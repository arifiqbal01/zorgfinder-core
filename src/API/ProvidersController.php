<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use ZorgFinder\Services\ProviderService;

class ProvidersController extends BaseController {
    public function register_routes() {
        register_rest_route($this->namespace, '/providers', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_providers'],
                'permission_callback' => '__return_true',
            ],
        ]);

        register_rest_route($this->namespace, '/providers/(?P<id>\\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_provider'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    public function get_providers(WP_REST_Request $request) {
        $service = ProviderService::get_instance();
        return $this->response($service->get_all());
    }

    public function get_provider(WP_REST_Request $request) {
        $id = (int)$request->get_param('id');
        $service = ProviderService::get_instance();
        return $this->response($service->get_one($id));
    }
}
