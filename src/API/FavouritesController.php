<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;

class FavouritesController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/favourites', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_favourites'],
                'permission_callback' => [$this, 'require_auth'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'add_favourite'],
                'permission_callback' => [$this, 'require_auth'],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'remove_favourite'],
                'permission_callback' => [$this, 'require_auth'],
            ],
        ]);
    }

    /**
     * GET /favourites
     */
    public function get_favourites(WP_REST_Request $request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $table = $wpdb->prefix . 'zf_favourites';
        $providers_table = $wpdb->prefix . 'zf_providers';

        $query = $wpdb->prepare("
            SELECT p.* FROM $table f
            JOIN $providers_table p ON f.provider_id = p.id
            WHERE f.user_id = %d
        ", $user_id);

        $results = $wpdb->get_results($query, ARRAY_A);
        return $this->respond($results);
    }

    /**
     * POST /favourites
     */
    public function add_favourite(WP_REST_Request $request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $provider_id = (int) $request->get_param('provider_id');

        if (!$provider_id) {
            return $this->error('Missing provider_id', 400);
        }

        $table = $wpdb->prefix . 'zf_favourites';
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE user_id = %d AND provider_id = %d",
            $user_id,
            $provider_id
        ));

        if ($exists) {
            return $this->respond(['message' => 'Already in favourites']);
        }

        $wpdb->insert($table, [
            'user_id' => $user_id,
            'provider_id' => $provider_id,
            'created_at' => current_time('mysql')
        ]);

        return $this->respond(['message' => 'Added to favourites']);
    }

    /**
     * DELETE /favourites
     */
    public function remove_favourite(WP_REST_Request $request)
    {
        global $wpdb;
        $user_id = get_current_user_id();
        $provider_id = (int) $request->get_param('provider_id');

        if (!$provider_id) {
            return $this->error('Missing provider_id', 400);
        }

        $table = $wpdb->prefix . 'zf_favourites';
        $wpdb->delete($table, [
            'user_id' => $user_id,
            'provider_id' => $provider_id,
        ]);

        return $this->respond(['message' => 'Removed from favourites']);
    }
}
