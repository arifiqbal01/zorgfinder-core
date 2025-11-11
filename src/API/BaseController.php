<?php
namespace ZorgFinder\API;

use WP_REST_Server;

abstract class BaseController {
    protected string $namespace = 'zorg/v1';

    abstract public function register_routes();

    protected function response($data, int $status = 200) {
        return rest_ensure_response([
            'status' => $status,
            'data'   => $data,
        ]);
    }

    protected function permission_check(): bool {
        return current_user_can('read');
    }
}
