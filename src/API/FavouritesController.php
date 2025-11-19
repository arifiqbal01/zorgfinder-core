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

    $table_fav  = $wpdb->prefix . 'zf_favourites';
    $table_prov = $wpdb->prefix . 'zf_providers';
    $table_user = $wpdb->users;

    $is_admin = current_user_can('manage_options');

    $search   = $request->get_param('search');
    $trashed  = intval($request->get_param('trashed')) === 1;
    $provider = intval($request->get_param('provider_id'));
    $user     = intval($request->get_param('user_id'));
    $device   = sanitize_text_field($request->get_param('device'));

    $where = $trashed ? "WHERE f.deleted_at IS NOT NULL" : "WHERE f.deleted_at IS NULL";

    // Admin sees all, normal users only see their own
    if (!$is_admin) {
        $where .= $wpdb->prepare(" AND f.user_id = %d ", get_current_user_id());
    }

    if ($provider) {
        $where .= $wpdb->prepare(" AND f.provider_id = %d", $provider);
    }

    if ($user && $is_admin) {
        $where .= $wpdb->prepare(" AND f.user_id = %d", $user);
    }

    if ($device) {
        $where .= $wpdb->prepare(" AND f.device = %s", $device);
    }

    if ($search) {
        $like = '%' . $wpdb->esc_like($search) . '%';
        $where .= $wpdb->prepare("
            AND ( p.name LIKE %s OR p.slug LIKE %s )
        ", $like, $like);
    }

    $page     = max(1, intval($request->get_param('page')));
    $per_page = max(1, intval($request->get_param('per_page')));
    $offset   = ($page - 1) * $per_page;

    $total = (int)$wpdb->get_var("
        SELECT COUNT(*)
        FROM $table_fav f
        JOIN $table_prov p ON p.id = f.provider_id
        $where
    ");

    $rows = $wpdb->get_results($wpdb->prepare("
        SELECT 
            f.id AS favourite_id,
            f.user_id,
            u.display_name AS user_name,

            f.provider_id,
            p.name AS provider_name,

            f.device,
            f.source_page,
            f.ip_address,
            f.meta_json,

            f.created_at,
            f.deleted_at

        FROM $table_fav f
        JOIN $table_prov p ON p.id = f.provider_id
        JOIN $table_user u ON u.ID = f.user_id
        $where
        ORDER BY f.created_at DESC
        LIMIT %d OFFSET %d
    ", $per_page, $offset), ARRAY_A);

    return $this->respond([
        "data" => $rows,
        "total" => $total,
        "page" => $page,
        "per_page" => $per_page,
        "pages" => ceil($total / $per_page)
    ]);
}


    /**
     * CREATE
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

    // Metadata capture
    $ip      = $_SERVER['REMOTE_ADDR'] ?? null;
    $agent   = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $device  = wp_is_mobile() ? 'mobile' : 'desktop';
    $source  = sanitize_text_field($r->get_param("source_page"));

    $meta = [
        "user_agent" => $agent,
        "browser"    => $_SERVER['HTTP_SEC_CH_UA'] ?? null,
    ];

    // Check existing entry
    $existing = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table WHERE provider_id=%d AND user_id=%d ORDER BY id DESC LIMIT 1",
        $provider_id, $user_id
    ), ARRAY_A);

    // Toggle logic
    if ($existing && $existing["deleted_at"] === null) {
        $wpdb->update($table, [
            "deleted_at" => current_time("mysql")
        ], ["id" => $existing["id"]]);

        return $this->respond(["action" => "removed"]);
    }

    if ($existing && $existing["deleted_at"] !== null) {
        $wpdb->update($table, [
            "deleted_at" => null,
            "updated_at" => current_time("mysql"),
            "device"     => $device,
            "ip_address" => $ip,
            "source_page"=> $source,
            "meta_json"  => wp_json_encode($meta),
        ], ["id" => $existing["id"]]);

        return $this->respond(["action" => "restored"]);
    }

    // Create new favourite
    $wpdb->insert($table, [
        "user_id"     => $user_id,
        "provider_id" => $provider_id,
        "device"      => $device,
        "ip_address"  => $ip,
        "source_page" => $source,
        "meta_json"   => wp_json_encode($meta),
        "created_at"  => current_time("mysql"),
    ]);

    return $this->respond(["action" => "created"]);
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
