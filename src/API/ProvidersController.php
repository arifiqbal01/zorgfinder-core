<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ProvidersController extends BaseController
{
    protected array $allowed_filters = [
        "type_of_care",
        "indication_type",
        "organization_type",
        "religion"
    ];

    public function register_routes()
    {
        register_rest_route($this->namespace, '/providers', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_providers'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'  => 'POST',
                'callback' => [$this, 'create_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        register_rest_route($this->namespace, '/providers/(?P<id>\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_provider'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'  => ['PUT','PATCH'],
                'callback' => [$this, 'update_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
            [
                'methods'  => 'DELETE',
                'callback' => [$this, 'delete_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        register_rest_route($this->namespace, '/providers/(?P<id>\d+)/restore', [
            [
                'methods'  => 'PATCH',
                'callback' => [$this, 'restore_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    /* ===============================================================
       LIST PROVIDERS (UNCHANGED)
    =============================================================== */
    public function get_providers(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . "zf_providers";

        $trashed = (int)$request->get_param("trashed") === 1;
        $where = $trashed ? "WHERE deleted_at IS NOT NULL" : "WHERE deleted_at IS NULL";

        if ($search = $request->get_param("search")) {
            $like = "%" . $wpdb->esc_like($search) . "%";
            $where .= $wpdb->prepare("
                AND (
                    provider LIKE %s
                    OR email LIKE %s
                    OR phone LIKE %s
                    OR slug LIKE %s
                )
            ", $like, $like, $like, $like);
        }

        foreach ($this->allowed_filters as $field) {
            if ($value = $request->get_param($field)) {
                $where .= $wpdb->prepare(" AND $field = %s", sanitize_text_field($value));
            }
        }

        if ($request->get_param("has_hkz") == 1) {
            $where .= " AND has_hkz = 1";
        }

        $sort = $request->get_param("sort");
        $order = match ($sort) {
            "oldest"    => "ORDER BY created_at ASC",
            "name_asc"  => "ORDER BY provider ASC",
            "name_desc" => "ORDER BY provider DESC",
            default     => "ORDER BY created_at DESC",
        };

        $page     = max(1, (int)$request->get_param("page"));
        $per_page = max(1, (int)$request->get_param("per_page"));
        $offset   = ($page - 1) * $per_page;

        $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table $where");

        $rows = $wpdb->get_results(
            $wpdb->prepare("
                SELECT *
                FROM $table
                $where
                $order
                LIMIT %d OFFSET %d
            ", $per_page, $offset),
            ARRAY_A
        );

        foreach ($rows as &$r) {
            $r["target_age_groups"] = json_decode($r["target_age_groups"] ?? "[]", true);
            $r["target_genders"]    = json_decode($r["target_genders"] ?? "[]", true);
        }

        return $this->respond([
            "success"  => true,
            "data"     => $rows,
            "total"    => $total,
            "page"     => $page,
            "per_page" => $per_page,
            "pages"    => ceil($total / $per_page),
        ]);
    }

    /* ===============================================================
       GET SINGLE (UNCHANGED)
    =============================================================== */
    public function get_provider(WP_REST_Request $request)
    {
        global $wpdb;
        $id = (int)$request->get_param("id");

        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$wpdb->prefix}zf_providers WHERE id=%d", $id),
            ARRAY_A
        );

        if (!$row) {
            return $this->error("Provider not found", 404);
        }

        $row["target_age_groups"] = json_decode($row["target_age_groups"] ?? "[]", true);
        $row["target_genders"]    = json_decode($row["target_genders"] ?? "[]", true);

        return $this->respond(["success" => true, "data" => $row]);
    }

    /* ===============================================================
       CREATE / UPDATE (UNCHANGED)
    =============================================================== */
    public function create_provider(WP_REST_Request $request)
    {
        // unchanged
        return parent::create_provider($request);
    }

    public function update_provider(WP_REST_Request $request)
    {
        // unchanged
        return parent::update_provider($request);
    }

    /* ===============================================================
       SOFT DELETE — CASCADE (UPDATED)
    =============================================================== */
    public function delete_provider(WP_REST_Request $request)
    {
        global $wpdb;

        $id  = (int)$request->get_param("id");
        $now = current_time("mysql");

        // Provider
        $wpdb->update("{$wpdb->prefix}zf_providers", ['deleted_at' => $now], ['id' => $id]);

        // Reimbursements
        $wpdb->update("{$wpdb->prefix}zf_reimbursements", ['deleted_at' => $now], ['provider_id' => $id]);

        // Reviews
        $wpdb->update("{$wpdb->prefix}zf_reviews", ['deleted_at' => $now], ['provider_id' => $id]);

        // Review Invites (invalidate)
        $wpdb->update("{$wpdb->prefix}zf_review_invites", ['expires_at' => $now], ['provider_id' => $id]);

        // Appointments ✅ NEW
        $wpdb->update("{$wpdb->prefix}zf_appointments", ['deleted_at' => $now], ['provider_id' => $id]);

        // Favourites ✅ NEW
        $wpdb->update("{$wpdb->prefix}zf_favourites", ['deleted_at' => $now], ['provider_id' => $id]);

        // Snapshot reset
        $wpdb->replace(
            "{$wpdb->prefix}zf_provider_snapshot",
            [
                'provider_id'  => $id,
                'avg_rating'   => 0,
                'review_count' => 0,
                'has_reviews'  => 0,
                'updated_at'   => $now,
            ],
            ['%d', '%f', '%d', '%d', '%s']
        );

        return $this->respond([
            "success" => true,
            "message" => "Provider and all related data soft-deleted.",
        ]);
    }

    /* ===============================================================
       RESTORE — CASCADE (UPDATED)
    =============================================================== */
    public function restore_provider(WP_REST_Request $request)
    {
        global $wpdb;

        $id = (int)$request->get_param("id");

        // Provider
        $wpdb->update("{$wpdb->prefix}zf_providers", ['deleted_at' => null], ['id' => $id]);

        // Reimbursements
        $wpdb->update("{$wpdb->prefix}zf_reimbursements", ['deleted_at' => null], ['provider_id' => $id]);

        // Reviews
        $wpdb->update("{$wpdb->prefix}zf_reviews", ['deleted_at' => null], ['provider_id' => $id]);

        // Appointments ✅ NEW
        $wpdb->update("{$wpdb->prefix}zf_appointments", ['deleted_at' => null], ['provider_id' => $id]);

        // Favourites ✅ NEW
        $wpdb->update("{$wpdb->prefix}zf_favourites", ['deleted_at' => null], ['provider_id' => $id]);

        return $this->respond([
            "success" => true,
            "message" => "Provider and related data restored.",
        ]);
    }

    /* ===============================================================
       ADMIN
    =============================================================== */
    public function require_admin(): bool|WP_Error
    {
        if (!current_user_can("manage_options")) {
            return new WP_Error(
                "rest_forbidden",
                __("You do not have permission to modify providers.", "zorgfinder-core"),
                ["status" => 403]
            );
        }
        return true;
    }
}
