<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ProvidersController extends BaseController
{
    public function register_routes()
    {
        // GET /providers (list)
        register_rest_route($this->namespace, '/providers', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_providers'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // GET /providers/{id}
        register_rest_route($this->namespace, '/providers/(?P<id>\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_provider'],
                'permission_callback' => '__return_true',
            ],
        ]);

        // POST /providers (create)
        register_rest_route($this->namespace, '/providers', [
            [
                'methods'  => 'POST',
                'callback' => [$this, 'create_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        // PUT/PATCH /providers/{id} (update)
        register_rest_route($this->namespace, '/providers/(?P<id>\d+)', [
            [
                'methods'  => ['PUT', 'PATCH'],
                'callback' => [$this, 'update_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        // DELETE /providers/{id} (soft delete)
        register_rest_route($this->namespace, '/providers/(?P<id>\d+)', [
            [
                'methods'  => 'DELETE',
                'callback' => [$this, 'delete_provider'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    /**
     * GET /providers
     */
    public function get_providers(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    global $wpdb;
    $table = $wpdb->prefix . 'zf_providers';

    // Base query: only active providers
    $query = "SELECT * FROM $table WHERE deleted_at IS NULL";

    // 🔍 SEARCH (name, email, phone, slug)
    if ($search = $request->get_param('search')) {
        $like = '%' . $wpdb->esc_like($search) . '%';
        $query .= $wpdb->prepare("
            AND (
                name LIKE %s OR
                email LIKE %s OR
                phone LIKE %s OR
                slug LIKE %s
            )
        ", $like, $like, $like, $like);
    }

    // 🔽 ENUM FILTERS (safe & dynamic)
    $enumFilters = [
        'type_of_care',
        'indication_type',
        'organization_type',
        'religion',
    ];

    foreach ($enumFilters as $field) {
        $value = $request->get_param($field);
        if (!empty($value)) {
            $query .= $wpdb->prepare(" AND $field = %s", $value);
        }
    }

    $hkz = $request->get_param('has_hkz');
        if ($hkz == 1) {
            $query .= " AND has_hkz = 1";
        }


    // Execute query
    $providers = $wpdb->get_results($query, ARRAY_A);

    return $this->respond($providers);
}


    /**
     * GET /providers/{id}
     */
    public function get_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $id = (int) $request->get_param('id');
        $table = $wpdb->prefix . 'zf_providers';

        $provider = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id = %d AND deleted_at IS NULL", $id),
            ARRAY_A
        );

        if (!$provider) {
            return $this->error('Provider not found', 404);
        }

        return $this->respond($provider);
    }

    /**
     * POST /providers (create)
     */
    public function create_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';

        // Auto slug generation
        $slug = sanitize_title($request->get_param('slug'));
        if (empty($slug)) {
            $slug = sanitize_title($request->get_param('name'));
        }

        $data = [
            'name'              => sanitize_text_field($request->get_param('name')),
            'slug'              => $slug,
            'type_of_care'      => sanitize_text_field($request->get_param('type_of_care')),
            'indication_type'   => sanitize_text_field($request->get_param('indication_type')),
            'organization_type' => sanitize_text_field($request->get_param('organization_type')),
            'religion'          => sanitize_text_field($request->get_param('religion')),
            'has_hkz'           => (int) $request->get_param('has_hkz'),
            'address'           => sanitize_textarea_field($request->get_param('address')),
            'email'             => sanitize_email($request->get_param('email')),
            'phone'             => sanitize_text_field($request->get_param('phone')),
            'website'           => esc_url_raw($request->get_param('website')),
            'created_at'        => current_time('mysql'),
            'updated_at'        => current_time('mysql'),
            'deleted_at'        => null,
        ];

        $inserted = $wpdb->insert($table, $data);

        if (!$inserted) {
            return $this->error('Failed to create provider', 500);
        }

        $id = $wpdb->insert_id;

        $provider = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id),
            ARRAY_A
        );

        return $this->respond([
            'message'  => 'Provider created successfully',
            'provider' => $provider,
        ], 201);
    }

    /**
     * PUT/PATCH /providers/{id}
     */
    public function update_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';
        $id = (int) $request->get_param('id');

        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id = %d", $id));
        if (!$exists) {
            return $this->error('Provider not found', 404);
        }

        // Slug logic
        $slug = sanitize_title($request->get_param('slug'));
        if (empty($slug)) {
            $slug = sanitize_title($request->get_param('name'));
        }

        $fields = [
            'name'              => sanitize_text_field($request->get_param('name')),
            'slug'              => $slug,
            'type_of_care'      => sanitize_text_field($request->get_param('type_of_care')),
            'indication_type'   => sanitize_text_field($request->get_param('indication_type')),
            'organization_type' => sanitize_text_field($request->get_param('organization_type')),
            'religion'          => sanitize_text_field($request->get_param('religion')),
            'has_hkz'           => (int) $request->get_param('has_hkz'),
            'address'           => sanitize_textarea_field($request->get_param('address')),
            'email'             => sanitize_email($request->get_param('email')),
            'phone'             => sanitize_text_field($request->get_param('phone')),
            'website'           => esc_url_raw($request->get_param('website')),
            'updated_at'        => current_time('mysql'),
        ];

        // IMPORTANT: Do NOT filter out empty strings (ENUM + Checkbox)
        $updated = $wpdb->update($table, $fields, ['id' => $id]);

        if ($updated === false) {
            return $this->error('Failed to update provider', 500);
        }

        $provider = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id),
            ARRAY_A
        );

        return $this->respond([
            'message'  => 'Provider updated successfully',
            'provider' => $provider,
        ]);
    }

    /**
     * DELETE /providers/{id} — soft delete
     */
    public function delete_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';
        $id = (int) $request->get_param('id');

        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id = %d", $id));
        if (!$exists) {
            return $this->error('Provider not found', 404);
        }

        // Proper soft delete
        $deleted = $wpdb->update(
            $table,
            ['deleted_at' => current_time('mysql')],
            ['id' => $id]
        );

        if ($deleted === false) {
            return $this->error('Failed to delete provider', 500);
        }

        return $this->respond(['message' => 'Provider soft-deleted successfully']);
    }

    /**
     * Permission check (Admin/Editor only)
     */
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
