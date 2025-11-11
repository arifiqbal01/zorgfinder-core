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

        // GET /providers/{id} (single)
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

        // PATCH or PUT /providers/{id} (update)
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
        $type  = $request->get_param('type_of_care');
        $query = "SELECT * FROM $table WHERE 1=1";

        if ($type) {
            $query .= $wpdb->prepare(" AND type_of_care = %s", $type);
        }

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

        $provider = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id), ARRAY_A);

        if (!$provider) {
            return $this->error('Provider not found', 404);
        }

        return $this->respond($provider);
    }

    /**
     * POST /providers (Admin)
     */
    public function create_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';

        $data = [
            'name'              => sanitize_text_field($request->get_param('name')),
            'slug'              => sanitize_title($request->get_param('slug')),
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
        ];

        $inserted = $wpdb->insert($table, $data);

        if (!$inserted) {
            return $this->error('Failed to create provider', 500);
        }

        $id = $wpdb->insert_id;
        $provider = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id), ARRAY_A);

        return $this->respond([
            'message' => 'Provider created successfully',
            'provider' => $provider,
        ], 201);
    }

    /**
     * PATCH /providers/{id} (Admin)
     */
    public function update_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $id = (int) $request->get_param('id');
        $table = $wpdb->prefix . 'zf_providers';

        $existing = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
        if (!$existing) {
            return $this->error('Provider not found', 404);
        }

        $fields = [
            'name'              => sanitize_text_field($request->get_param('name')),
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

        $fields = array_filter($fields, fn($v) => $v !== null && $v !== '');

        $updated = $wpdb->update($table, $fields, ['id' => $id]);

        if ($updated === false) {
            return $this->error('Failed to update provider', 500);
        }

        $provider = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id), ARRAY_A);

        return $this->respond([
            'message' => 'Provider updated successfully',
            'provider' => $provider,
        ]);
    }

    /**
     * DELETE /providers/{id} (Admin)
     */
    public function delete_provider(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $id = (int) $request->get_param('id');
        $table = $wpdb->prefix . 'zf_providers';

        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id = %d", $id));
        if (!$exists) {
            return $this->error('Provider not found', 404);
        }

        // Soft delete: mark deleted (add a flag or use updated_at as marker)
        $deleted = $wpdb->update($table, ['name' => '[DELETED]'], ['id' => $id]);

        if ($deleted === false) {
            return $this->error('Failed to delete provider', 500);
        }

        return $this->respond(['message' => 'Provider soft-deleted successfully']);
    }

    /**
     * Permission: only admins or editors
     */
    public function require_admin(): bool|\WP_Error
    {
        if (!current_user_can('edit_others_posts')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to modify providers.', 'zorgfinder-core'),
                ['status' => 403]
            );
        }
        return true;
    }
}
