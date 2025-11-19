<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ProvidersController extends BaseController
{
    public function register_routes()
    {
        // List
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

        // Single
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

        // Restore Provider
        register_rest_route($this->namespace, '/providers/(?P<id>\d+)/restore', [
            [
                'methods'  => 'PATCH',
                'callback' => [$this, 'restore_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    /**
     * LIST PROVIDERS
     */
    public function get_providers(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';

        $where = "WHERE deleted_at IS NULL";

        // Search
        if ($search = $request->get_param('search')) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where .= $wpdb->prepare("
                AND (name LIKE %s OR email LIKE %s OR phone LIKE %s OR slug LIKE %s)
            ", $like, $like, $like, $like);
        }

        // Enum filters
        $enumFilters = ['type_of_care','indication_type','organization_type','religion'];
        foreach ($enumFilters as $field) {
            if ($value = $request->get_param($field)) {
                $where .= $wpdb->prepare(" AND $field = %s", $value);
            }
        }

        if ($request->get_param('has_hkz') == 1) {
            $where .= " AND has_hkz = 1";
        }

        // Pagination
        $page     = max(1, (int)$request->get_param('page'));
        $per_page = max(1, (int)$request->get_param('per_page'));
        $offset   = ($page - 1) * $per_page;

        $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table $where");

        $rows = $wpdb->get_results(
            $wpdb->prepare("
                SELECT * FROM $table 
                $where
                ORDER BY id DESC
                LIMIT %d OFFSET %d
            ", $per_page, $offset),
            ARRAY_A
        );

        return new WP_REST_Response([
            'success'   => true,
            'data'      => $rows,
            'total'     => $total,
            'page'      => $page,
            'per_page'  => $per_page,
            'pages'     => ceil($total / $per_page),
        ], 200);
    }

    /**
     * SINGLE PROVIDER
     */
    public function get_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $id    = (int)$request->get_param('id');
        $table = $wpdb->prefix . 'zf_providers';

        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id=%d AND deleted_at IS NULL", $id),
            ARRAY_A
        );

        if (!$row) {
            return $this->error("Provider not found", 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data'    => $row,
        ], 200);
    }

    /**
     * CREATE
     */
    public function create_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';

        $slug = sanitize_title($request->get_param('slug')) ?: sanitize_title($request->get_param('name'));

        $data = [
            'name'              => sanitize_text_field($request->get_param('name')),
            'slug'              => $slug,
            'type_of_care'      => sanitize_text_field($request->get_param('type_of_care')),
            'indication_type'   => sanitize_text_field($request->get_param('indication_type')),
            'organization_type' => sanitize_text_field($request->get_param('organization_type')),
            'religion'          => sanitize_text_field($request->get_param('religion')),
            'has_hkz'           => (int)$request->get_param('has_hkz'),
            'address'           => sanitize_textarea_field($request->get_param('address')),
            'email'             => sanitize_email($request->get_param('email')),
            'phone'             => sanitize_text_field($request->get_param('phone')),
            'website'           => esc_url_raw($request->get_param('website')),
            'created_at'        => current_time('mysql'),
            'updated_at'        => current_time('mysql'),
            'deleted_at'        => null,
        ];

        $wpdb->insert($table, $data);
        $id = $wpdb->insert_id;

        return $this->get_provider(new WP_REST_Request(['id' => $id]));
    }

    /**
     * UPDATE
     */
    public function update_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';
        $id    = (int)$request->get_param('id');

        if (!$wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d", $id))) {
            return $this->error("Provider not found", 404);
        }

        $slug = sanitize_title($request->get_param('slug')) ?: sanitize_title($request->get_param('name'));

        $fields = [
            'name'              => sanitize_text_field($request->get_param('name')),
            'slug'              => $slug,
            'type_of_care'      => sanitize_text_field($request->get_param('type_of_care')),
            'indication_type'   => sanitize_text_field($request->get_param('indication_type')),
            'organization_type' => sanitize_text_field($request->get_param('organization_type')),
            'religion'          => sanitize_text_field($request->get_param('religion')),
            'has_hkz'           => (int)$request->get_param('has_hkz'),
            'address'           => sanitize_textarea_field($request->get_param('address')),
            'email'             => sanitize_email($request->get_param('email')),
            'phone'             => sanitize_text_field($request->get_param('phone')),
            'website'           => esc_url_raw($request->get_param('website')),
            'updated_at'        => current_time('mysql'),
        ];

        $wpdb->update($table, $fields, ['id' => $id]);

        return $this->get_provider(new WP_REST_Request(['id' => $id]));
    }

    /**
     * DELETE PROVIDER (Soft) + CASCADE
     */
    public function delete_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int)$request->get_param('id');
        if (!$id) return $this->error("Provider ID is required", 400);

        $table_prov = $wpdb->prefix . 'zf_providers';
        $table_fav  = $wpdb->prefix . 'zf_favourites';
        $table_rev  = $wpdb->prefix . 'zf_reviews';
        $table_app  = $wpdb->prefix . 'zf_appointments';
        $table_reim = $wpdb->prefix . 'zf_reimbursements';

        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_prov WHERE id=%d", $id));
        if (!$exists) return $this->error("Provider not found", 404);

        $now = current_time('mysql');

        $wpdb->query("START TRANSACTION");

        try {
            // Soft delete provider
            $wpdb->update($table_prov, ['deleted_at' => $now], ['id' => $id]);

            // Cascade delete
            $wpdb->update($table_fav, ['deleted_at' => $now], ['provider_id' => $id]);
            $wpdb->update($table_rev, ['deleted_at' => $now], ['provider_id' => $id]);
            $wpdb->update($table_app, ['deleted_at' => $now], ['provider_id' => $id]);

            if ($wpdb->get_var("SHOW TABLES LIKE '{$table_reim}'")) {
                $wpdb->update($table_reim, ['deleted_at' => $now], ['provider_id' => $id]);
            }

            $wpdb->query("COMMIT");

            return $this->respond([
                'message' => 'Provider soft-deleted with cascaded favourites, reviews, appointments and reimbursements.'
            ]);

        } catch (\Throwable $e) {
            $wpdb->query("ROLLBACK");
            error_log("[ZORG CASCADE DELETE ERROR] " . $e->getMessage());
            return $this->error("Failed to delete provider", 500);
        }
    }

    /**
     * RESTORE PROVIDER + CASCADE RESTORE
     */
    public function restore_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int)$request->get_param('id');
        if (!$id) return $this->error("Provider ID is required", 400);

        $table_prov = $wpdb->prefix . 'zf_providers';
        $table_fav  = $wpdb->prefix . 'zf_favourites';
        $table_rev  = $wpdb->prefix . 'zf_reviews';
        $table_app  = $wpdb->prefix . 'zf_appointments';
        $table_reim = $wpdb->prefix . 'zf_reimbursements';

        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_prov WHERE id=%d", $id));
        if (!$exists) return $this->error("Provider not found", 404);

        $wpdb->query("START TRANSACTION");

        try {
            $wpdb->update($table_prov, ['deleted_at' => null], ['id' => $id]);

            $wpdb->update($table_fav, ['deleted_at' => null], ['provider_id' => $id]);
            $wpdb->update($table_rev, ['deleted_at' => null], ['provider_id' => $id]);
            $wpdb->update($table_app, ['deleted_at' => null], ['provider_id' => $id]);

            if ($wpdb->get_var("SHOW TABLES LIKE '{$table_reim}'")) {
                $wpdb->update($table_reim, ['deleted_at' => null], ['provider_id' => $id]);
            }

            $wpdb->query("COMMIT");

            return $this->respond([
                'message' => 'Provider restored with all related records.'
            ]);

        } catch (\Throwable $e) {
            $wpdb->query("ROLLBACK");
            error_log("[ZORG CASCADE RESTORE ERROR] " . $e->getMessage());
            return $this->error("Failed to restore provider", 500);
        }
    }

    public function require_admin(): bool|WP_Error
    {
        if (!current_user_can('edit_others_posts')) {
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to modify providers.', 'zorgfinder-core'),
                ['status' => 403]
            );
        }
        return true;
    }
}
