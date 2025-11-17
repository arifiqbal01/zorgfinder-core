<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ProvidersController extends BaseController
{
    public function register_routes()
    {
        // List (paginated)
        register_rest_route($this->namespace, '/providers', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_providers'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // Single
        register_rest_route($this->namespace, '/providers/(?P<id>\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_provider'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // Create
        register_rest_route($this->namespace, '/providers', [
            [
                'methods'  => 'POST',
                'callback' => [$this, 'create_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        // Update
        register_rest_route($this->namespace, '/providers/(?P<id>\d+)', [
            [
                'methods'  => ['PUT','PATCH'],
                'callback' => [$this, 'update_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        // Delete
        register_rest_route($this->namespace, '/providers/(?P<id>\d+)', [
            [
                'methods'  => 'DELETE',
                'callback' => [$this, 'delete_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }


    /**
     * LIST — PAGINATED
     */
    public function get_providers(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';

        // WHERE conditions
        $where = "WHERE deleted_at IS NULL";

        // SEARCH
        if ($search = $request->get_param('search')) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where .= $wpdb->prepare("
                AND (name LIKE %s OR email LIKE %s OR phone LIKE %s OR slug LIKE %s)
            ", $like, $like, $like, $like);
        }

        // ENUM FILTERS
        $enumFilters = ['type_of_care','indication_type','organization_type','religion'];
        foreach ($enumFilters as $field) {
            if ($value = $request->get_param($field)) {
                $where .= $wpdb->prepare(" AND $field = %s", $value);
            }
        }

        // HKZ
        if ($request->get_param('has_hkz') == 1) {
            $where .= " AND has_hkz = 1";
        }

        // Pagination
        $page     = max(1, (int)$request->get_param('page'));
        $per_page = max(1, (int)$request->get_param('per_page'));
        $offset   = ($page - 1) * $per_page;

        // Count
        $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table $where");

        // Query
        $providers = $wpdb->get_results(
            $wpdb->prepare("
                SELECT * 
                FROM $table 
                $where 
                ORDER BY id DESC 
                LIMIT %d OFFSET %d
            ", $per_page, $offset),
            ARRAY_A
        );

        // FINAL STANDARD RESPONSE
        return new WP_REST_Response([
            'success'   => true,
            'data'      => $providers,
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

        $provider = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id = %d AND deleted_at IS NULL", $id),
            ARRAY_A
        );

        if (!$provider) {
            return $this->error("Provider not found", 404);
        }

        return new WP_REST_Response([
            'success' => true,
            'data'    => $provider,
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
     * DELETE (soft)
     */
    public function delete_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';
        $id    = (int)$request->get_param('id');

        if (!$wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d", $id))) {
            return $this->error("Provider not found", 404);
        }

        $wpdb->update($table, [
            'deleted_at' => current_time('mysql')
        ], ['id' => $id]);

        return $this->respond(['message' => 'Provider soft-deleted']);
    }

    public function require_admin(): bool|\WP_Error
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
