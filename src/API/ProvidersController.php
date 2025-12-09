<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ProvidersController extends BaseController
{
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

        $trashed = intval($request->get_param("trashed")) === 1 ? 1 : 0;

        $where = $trashed
            ? "WHERE deleted_at IS NOT NULL"
            : "WHERE deleted_at IS NULL";

        /* ---------------------------
           SEARCH (provider, email…)
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
           SIMPLE ENUM FILTERS
        ---------------------------- */
        $filters = [
            "type_of_care",
            "indication_type",
            "organization_type",
            "religion"
        ];

        foreach ($filters as $field) {
            if ($value = $request->get_param($field)) {
                $where .= $wpdb->prepare(" AND $field = %s", $value);
            }
        }

        /* ---------------------------
           JSON FILTERS
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
        switch ($request->get_param("sort")) {
            case "oldest":      $order = "ORDER BY created_at ASC"; break;
            case "name_asc":    $order = "ORDER BY provider ASC";   break;
            case "name_desc":   $order = "ORDER BY provider DESC";  break;
            default:            $order = "ORDER BY created_at DESC";
        }

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
       CREATE PROVIDER
    =============================================================== */
    public function create_provider(WP_REST_Request $request)
    {
        global $wpdb;
        $table = $wpdb->prefix . "zf_providers";

        $slug = sanitize_title($request->get_param("slug"))
              ?: sanitize_title($request->get_param("provider"));

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

        $slug = sanitize_title($request->get_param("slug"))
              ?: sanitize_title($request->get_param("provider"));

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
       DELETE & RESTORE (unchanged)
    =============================================================== */
    public function delete_provider(WP_REST_Request $request)
    {
        // unchanged
    }

    public function restore_provider(WP_REST_Request $request)
    {
        // unchanged
    }

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
