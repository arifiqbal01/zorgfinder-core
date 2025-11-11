<?php
namespace ZorgFinder\API;

use WP_REST_Request;

class CompareController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/compare', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'compare_providers'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    /**
     * GET /compare?ids=1,2,3
     */
    public function compare_providers(WP_REST_Request $request)
    {
        global $wpdb;

        $ids = explode(',', $request->get_param('ids') ?? '');
        $ids = array_filter(array_map('intval', $ids));

        if (empty($ids)) {
            return $this->error('No provider IDs provided', 400);
        }

        $placeholders = implode(',', array_fill(0, count($ids), '%d'));
        $table = $wpdb->prefix . 'zf_providers';
        $query = $wpdb->prepare("SELECT * FROM $table WHERE id IN ($placeholders)", ...$ids);
        $results = $wpdb->get_results($query, ARRAY_A);

        if (empty($results)) {
            return $this->error('No providers found for comparison', 404);
        }

        return $this->respond($results);
    }
}
