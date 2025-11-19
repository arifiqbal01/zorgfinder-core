<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class FavouritesController extends BaseController
{
    public function register_routes()
    {
        // LIST (paginated)
        register_rest_route($this->namespace, '/favourites', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_favourites'],
                'permission_callback' => [$this, 'require_auth'],
            ],
            [
                'methods'  => 'POST',
                'callback' => [$this, 'add_favourite'],
                'permission_callback' => [$this, 'require_auth'],
            ],
        ]);

        // Single + delete + restore
        register_rest_route($this->namespace, '/favourites/(?P<id>\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_favourite'],
                'permission_callback' => [$this, 'require_auth'],
            ],
            [
                'methods'  => 'DELETE',
                'callback' => [$this, 'soft_delete'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        register_rest_route($this->namespace, '/favourites/(?P<id>\d+)/restore', [
            [
                'methods'  => 'PATCH',
                'callback' => [$this, 'restore_favourite'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    /**
     * LIST — paginated + search
     */
    public function get_favourites(WP_REST_Request $request)
    {
        global $wpdb;

        $table_fav = $wpdb->prefix . 'zf_favourites';
        $table_prov = $wpdb->prefix . 'zf_providers';
        $user_id = get_current_user_id();

        $search = $request->get_param('search');
        $trashed = intval($request->get_param('trashed')) === 1 ? 1 : 0;

        // Base WHERE
        $where = $trashed ? "WHERE f.deleted_at IS NOT NULL" : "WHERE f.deleted_at IS NULL";
        $where .= $wpdb->prepare(" AND f.user_id = %d", $user_id);

        if ($search) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where .= $wpdb->prepare("
                AND (
                    p.name LIKE %s
                    OR p.email LIKE %s
                    OR p.slug LIKE %s
                )
            ", $like, $like, $like);
        }

        // Pagination
        $page     = max(1, (int)$request->get_param('page'));
        $per_page = max(1, (int)$request->get_param('per_page')) ?: 20;
        $offset   = ($page - 1) * $per_page;

        // Count
        $total = (int)$wpdb->get_var("
            SELECT COUNT(*) 
            FROM $table_fav f 
            JOIN $table_prov p ON p.id = f.provider_id
            $where
        ");

        // Query
        $rows = $wpdb->get_results(
        $wpdb->prepare("
            SELECT 
                f.id AS favourite_id,
                f.user_id,
                f.provider_id,
                f.created_at,
                f.updated_at,
                f.deleted_at,
                p.name AS provider_name,
                p.slug AS provider_slug
            FROM $table_fav f
            JOIN $table_prov p 
                ON p.id = f.provider_id
            $where
            ORDER BY f.created_at DESC
            LIMIT %d OFFSET %d
        ", $per_page, $offset),
        ARRAY_A
    );


        return $this->respond([
            'success' => true,
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'per_page' => $per_page,
            'pages' => ceil($total / $per_page),
        ]);
    }

    /**
     * CREATE
     */
   public function add_favourite(WP_REST_Request $request)
{
    global $wpdb;
    $table = $wpdb->prefix . 'zf_favourites';

    $user_id = get_current_user_id();
    $provider_id = (int)$request->get_param('provider_id');

    if (!$provider_id) {
        return $this->error("provider_id is required", 400);
    }

    // Check if exists and NOT deleted
    $existing = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table 
         WHERE user_id=%d AND provider_id=%d 
         ORDER BY id DESC 
         LIMIT 1",
        $user_id,
        $provider_id
    ), ARRAY_A);

    // CASE 1: Exists + Active → SOFT DELETE (toggle OFF)
    if ($existing && $existing["deleted_at"] === null) {
        $wpdb->update(
            $table,
            ["deleted_at" => current_time('mysql')],
            ["id" => $existing["id"]]
        );

        return $this->respond([
            "success" => true,
            "action" => "removed",
            "message" => "Removed from favourites"
        ]);
    }

    // CASE 2: Exists but deleted → RESTORE (toggle ON)
    if ($existing && $existing["deleted_at"] !== null) {
        $wpdb->update(
            $table,
            ["deleted_at" => null, "updated_at" => current_time('mysql')],
            ["id" => $existing["id"]]
        );

        return $this->respond([
            "success" => true,
            "action" => "restored",
            "message" => "Added to favourites"
        ]);
    }

    // CASE 3: Not exist → INSERT new favourite
    $wpdb->insert($table, [
        "user_id" => $user_id,
        "provider_id" => $provider_id,
        "created_at" => current_time('mysql'),
    ]);

    return $this->respond([
        "success" => true,
        "action" => "created",
        "message" => "Added to favourites"
    ]);
}


    /**
     * VIEW SINGLE
     */
    public function get_favourite(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_favourites';
        $id = (int)$request->get_param('id');

        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id=%d", $id),
            ARRAY_A
        );

        if (!$row) return $this->error("Favourite not found", 404);

        return $this->respond(['success' => true, 'data' => $row]);
    }

    /**
     * SOFT DELETE (admin only)
     */
    public function soft_delete(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_favourites';
        $id = (int)$request->get_param('id');

        $wpdb->update($table, [
            'deleted_at' => current_time('mysql')
        ], ['id' => $id]);

        return $this->respond(['message' => 'Favourite soft-deleted']);
    }

    /**
     * RESTORE (admin)
     */
    public function restore_favourite(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_favourites';
        $id = (int)$request->get_param('id');

        $wpdb->update($table, [
            'deleted_at' => null
        ], ['id' => $id]);

        return $this->respond(['message' => 'Favourite restored']);
    }
}
