<?php
namespace ZorgFinder\API;

use WP_REST_Controller;
use WP_REST_Response;
use WP_Error;

abstract class BaseController extends WP_REST_Controller
{
    /**
     * Namespace for all ZorgFinder routes.
     */
    protected $namespace = 'zorg/v1';

    /**
     * Standard JSON response wrapper.
     */
    protected function respond($data, int $status = 200): WP_REST_Response
    {
        return new WP_REST_Response([
            'success' => true,
            'data' => $data,
        ], $status);
    }

    /**
     * Standardized error response.
     */
    protected function error(string $message, int $status = 400): WP_Error
    {
        return new WP_Error('zorg_error', $message, ['status' => $status]);
    }

    /**
     * Authentication check for protected routes.
     */
    public function require_auth(): bool|WP_Error
{
    if (!is_user_logged_in()) {
        return new WP_Error(
            'rest_forbidden',
            __('You must be logged in.', 'zorgfinder-core'),
            ['status' => 401]
        );
    }

    return true;
}

}
