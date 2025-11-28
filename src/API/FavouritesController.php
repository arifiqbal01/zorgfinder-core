<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class FavouritesController extends BaseController
{
    public function register_routes()
    {
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

        register_rest_route($this->namespace, '/favourites/(?P<id>\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_favourite'],
                'permission_callback' => [$this, 'require_auth'],
            ],
        ]);
    }

    /**
     * LIST — GDPR SAFE
     */
    public function get_favourites(WP_REST_Request $request)
    {
        global $wpdb;

        $table_fav  = $wpdb->prefix . 'zf_favourites';
        $table_prov = $wpdb->prefix . 'zf_providers';
        $table_user = $wpdb->users;

        $is_admin = current_user_can('manage_options');

        $search   = $request->get_param('search');
        $provider = intval($request->get_param('provider_id'));
        $user_id  = intval($request->get_param('user_id'));

        // ALWAYS only active favourites
        $where = "WHERE f.deleted_at IS NULL";

        if (!$is_admin) {
            $where .= $wpdb->prepare(" AND f.user_id = %d", get_current_user_id());
        }

        if ($provider) {
            $where .= $wpdb->prepare(" AND f.provider_id = %d", $provider);
        }

        if ($user_id && $is_admin) {
            $where .= $wpdb->prepare(" AND f.user_id = %d", $user_id);
        }

        if (!empty($search)) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where .= $wpdb->prepare("
                AND (p.name LIKE %s OR p.slug LIKE %s OR u.display_name LIKE %s)
            ", $like, $like, $like);
        }

        $page     = max(1, intval($request->get_param('page')));
        $per_page = max(1, intval($request->get_param('per_page')));
        $offset   = ($page - 1) * $per_page;

        $total = (int) $wpdb->get_var("
            SELECT COUNT(*)
            FROM $table_fav f
            JOIN $table_prov p ON p.id = f.provider_id
            JOIN `$table_user` u ON u.ID = f.user_id
            $where
        ");

        $rows = $wpdb->get_results($wpdb->prepare("
            SELECT 
                f.id AS favourite_id,
                f.user_id,
                u.display_name AS user_name,
                f.provider_id,
                p.name AS provider_name,
                f.created_at
            FROM $table_fav f
            JOIN $table_prov p ON p.id = f.provider_id
            JOIN `$table_user` u ON u.ID = f.user_id
            $where
            ORDER BY f.created_at DESC
            LIMIT %d OFFSET %d
        ", $per_page, $offset), ARRAY_A);

        return new WP_REST_Response([
            "success"   => true,
            "data"      => $rows,
            "total"     => $total,
            "page"      => $page,
            "per_page"  => $per_page,
            "pages"     => ceil($total / $per_page)
        ], 200);
    }

    /**
     * CREATE / TOGGLE — GDPR SAFE
     */
    public function add_favourite(WP_REST_Request $r)
    {
        global $wpdb;

        $table = $wpdb->prefix . "zf_favourites";
        $user_id     = get_current_user_id();
        $provider_id = intval($r->get_param("provider_id"));

        if (!$provider_id) {
            return $this->error("provider_id is required", 400);
        }

        // Check existing
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE provider_id=%d AND user_id=%d ORDER BY id DESC LIMIT 1",
            $provider_id, $user_id
        ), ARRAY_A);

        // Toggle off
        if ($existing && $existing["deleted_at"] === null) {
            $wpdb->update($table, [
                "deleted_at" => current_time("mysql")
            ], ["id" => $existing["id"]]);

            return new WP_REST_Response(["success" => true, "action" => "removed"], 200);
        }

        // Toggle restore
        if ($existing && $existing["deleted_at"] !== null) {
            $wpdb->update($table, [
                "deleted_at" => null,
                "updated_at" => current_time("mysql")
            ], ["id" => $existing["id"]]);

            return new WP_REST_Response(["success" => true, "action" => "restored"], 200);
        }

        // NEW record — GDPR SAFE: no IP, device, meta_json
        $wpdb->insert($table, [
            "user_id"     => $user_id,
            "provider_id" => $provider_id,
            "created_at"  => current_time("mysql"),
        ]);

        return new WP_REST_Response(["success" => true, "action" => "created"], 200);
    }

    /**
     * Get single favourite
     */
    public function get_favourite(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_favourites';
        $id = (int) $request->get_param('id');

        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id=%d", $id),
            ARRAY_A
        );

        if (!$row) {
            return $this->error("Favourite not found", 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data'    => $row
        ], 200);
    }
}
