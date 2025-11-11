<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use ZorgFinder\Services\ProviderService;

class CompareController extends BaseController {
    public function register_routes() {
        register_rest_route($this->namespace, '/compare', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'compare_providers'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    public function compare_providers(WP_REST_Request $request) {
        $ids = array_map('intval', (array)$request->get_param('ids'));
        $service = ProviderService::get_instance();
        return $this->response($service->compare($ids));
    }
}
