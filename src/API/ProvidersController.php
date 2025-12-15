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
       LIST PROVIDERS
    =============================================================== */
    public function get_providers(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . "zf_providers";

        $trashed = (int)$request->get_param("trashed") === 1;

        $where = $trashed ? "WHERE deleted_at IS NOT NULL" : "WHERE deleted_at IS NULL";

        /* ---------------------------
           SEARCH
        ---------------------------- */
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

        /* ---------------------------
           SAFE ENUM FILTERS
        ---------------------------- */
        foreach ($this->allowed_filters as $field) {
            if ($value = $request->get_param($field)) {
                $where .= $wpdb->prepare(" AND $field = %s", sanitize_text_field($value));
            }
        }

        /* ---------------------------
           JSON CONTAINS FILTERS
        ---------------------------- */
        if ($gender = $request->get_param("gender")) {
            $where .= $wpdb->prepare(
                " AND JSON_CONTAINS(target_genders, %s)",
                wp_json_encode($gender)
            );
        }

        if ($age = $request->get_param("age_group")) {
            $where .= $wpdb->prepare(
                " AND JSON_CONTAINS(target_age_groups, %s)",
                wp_json_encode($age)
            );
        }

        if ($request->get_param("has_hkz") == 1) {
            $where .= " AND has_hkz = 1";
        }

        /* ---------------------------
           SORTING
        ---------------------------- */
        $sort = $request->get_param("sort");
        $order = match ($sort) {
            "oldest"    => "ORDER BY created_at ASC",
            "name_asc"  => "ORDER BY provider ASC",
            "name_desc" => "ORDER BY provider DESC",
            default     => "ORDER BY created_at DESC",
        };

        /* ---------------------------
           PAGINATION
        ---------------------------- */
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
       GET SINGLE PROVIDER
    =============================================================== */
    public function get_provider(WP_REST_Request $request)
    {
        global $wpdb;

        $id = (int)$request->get_param("id");
        $table = $wpdb->prefix . "zf_providers";

        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id=%d", $id),
            ARRAY_A
        );

        if (!$row) {
            return $this->error("Provider not found", 404);
        }

        $row["target_age_groups"] = json_decode($row["target_age_groups"] ?? "[]", true);
        $row["target_genders"]    = json_decode($row["target_genders"] ?? "[]", true);

        return $this->respond([
            "success" => true,
            "data"    => $row,
        ]);
    }

    /* ===============================================================
       VALIDATION HELPERS
    =============================================================== */
    private function validate_provider(WP_REST_Request $request)
    {
        if (!$request->get_param("provider")) {
            return $this->error("Provider name is required.", 422);
        }

        return true;
    }

    private function ensure_unique_slug($slug, $exclude_id = 0)
    {
        global $wpdb;
        $table = $wpdb->prefix . "zf_providers";

        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE slug=%s AND id!=%d",
            $slug, $exclude_id
        ));

        if ($exists) {
            return $this->error("Slug already exists. Choose a different one.", 409);
        }

        return true;
    }

    /* ===============================================================
       CREATE PROVIDER
    =============================================================== */
    public function create_provider(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . "zf_providers";

        if ($v = $this->validate_provider($request)) {
            if ($v instanceof WP_Error) return $v;
        }

        $slug = sanitize_title($request->get_param("slug"))
              ?: sanitize_title($request->get_param("provider"));

        if ($e = $this->ensure_unique_slug($slug)) {
            if ($e instanceof WP_Error) return $e;
        }

        $data = [
            "provider"          => sanitize_text_field($request->get_param("provider")),
            "slug"              => $slug,
            "target_genders"    => wp_json_encode($request->get_param("target_genders") ?: []),
            "target_age_groups" => wp_json_encode($request->get_param("target_age_groups") ?: []),
            "type_of_care"      => sanitize_text_field($request->get_param("type_of_care")),
            "indication_type"   => sanitize_text_field($request->get_param("indication_type")),
            "organization_type" => sanitize_text_field($request->get_param("organization_type")),
            "religion"          => sanitize_text_field($request->get_param("religion")),
            "has_hkz"           => (int)$request->get_param("has_hkz"),
            "email"             => sanitize_email($request->get_param("email")),
            "phone"             => sanitize_text_field($request->get_param("phone")),
            "website"           => esc_url_raw($request->get_param("website")),
            "address"           => sanitize_textarea_field($request->get_param("address")),
            "created_at"        => current_time("mysql"),
            "updated_at"        => current_time("mysql"),
            "deleted_at"        => null,
        ];

        $wpdb->insert($table, $data);
        $id = $wpdb->insert_id;

        $req = new WP_REST_Request("GET", "/$this->namespace/providers/$id");
        return $this->get_provider($req);
    }

    /* ===============================================================
       UPDATE PROVIDER
    =============================================================== */
    public function update_provider(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . "zf_providers";
        $id = (int)$request->get_param("id");

        if ($v = $this->validate_provider($request)) {
            if ($v instanceof WP_Error) return $v;
        }

        $slug = sanitize_title($request->get_param("slug"))
              ?: sanitize_title($request->get_param("provider"));

        if ($e = $this->ensure_unique_slug($slug, $id)) {
            if ($e instanceof WP_Error) return $e;
        }

        $data = [
            "provider"          => sanitize_text_field($request->get_param("provider")),
            "slug"              => $slug,
            "target_genders"    => wp_json_encode($request->get_param("target_genders") ?: []),
            "target_age_groups" => wp_json_encode($request->get_param("target_age_groups") ?: []),
            "type_of_care"      => sanitize_text_field($request->get_param("type_of_care")),
            "indication_type"   => sanitize_text_field($request->get_param("indication_type")),
            "organization_type" => sanitize_text_field($request->get_param("organization_type")),
            "religion"          => sanitize_text_field($request->get_param("religion")),
            "has_hkz"           => (int)$request->get_param("has_hkz"),
            "email"             => sanitize_email($request->get_param("email")),
            "phone"             => sanitize_text_field($request->get_param("phone")),
            "website"           => esc_url_raw($request->get_param("website")),
            "address"           => sanitize_textarea_field($request->get_param("address")),
            "updated_at"        => current_time("mysql"),
        ];

        $wpdb->update($table, $data, ["id" => $id]);

        $req = new WP_REST_Request("GET", "/$this->namespace/providers/$id");
        return $this->get_provider($req);
    }

    /* ===============================================================
       SOFT DELETE
    =============================================================== */
    public function delete_provider(WP_REST_Request $request)
    {
        global $wpdb;

        $id = (int)$request->get_param("id");

        $wpdb->update(
            "{$wpdb->prefix}zf_providers",
            ["deleted_at" => current_time("mysql")],
            ["id" => $id]
        );

        return $this->respond([
            "success" => true,
            "message" => "Provider soft-deleted.",
        ]);
    }

    /* ===============================================================
       RESTORE
    =============================================================== */
    public function restore_provider(WP_REST_Request $request)
    {
        global $wpdb;

        $id = (int)$request->get_param("id");

        $wpdb->update(
            "{$wpdb->prefix}zf_providers",
            ["deleted_at" => null],
            ["id" => $id]
        );

        return $this->respond([
            "success" => true,
            "message" => "Provider restored.",
        ]);
    }

    /* ===============================================================
       ADMIN CHECK
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
