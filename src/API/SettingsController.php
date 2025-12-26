<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_Error;

class SettingsController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/settings', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_settings'],
                'permission_callback' => [$this, 'require_admin'],
            ],
            [
                'methods'  => ['POST', 'PUT', 'PATCH'],
                'callback' => [$this, 'update_settings'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    public function get_settings(WP_REST_Request $request)
    {
        return $this->respond([
            'success' => true,
            'data' => [
                'compare_page_id'   => (int) get_option('zorg_compare_page_id', 0),
                'providers_page_id' => (int) get_option('zorg_providers_page_id', 0),
            ],
        ]);
    }

    public function update_settings(WP_REST_Request $request)
    {
        $compare_page_id   = absint($request->get_param('compare_page_id'));
        $providers_page_id = absint($request->get_param('providers_page_id'));

        foreach ([
            'compare'   => $compare_page_id,
            'providers' => $providers_page_id,
        ] as $label => $page_id) {
            if ($page_id > 0) {
                $page = get_post($page_id);
                if (!$page || $page->post_type !== 'page') {
                    return $this->error(
                        "Invalid {$label} page selected.",
                        422
                    );
                }
            }
        }

        update_option('zorg_compare_page_id', $compare_page_id);
        update_option('zorg_providers_page_id', $providers_page_id);

        return $this->respond([
            'success' => true,
            'message' => 'Settings updated.',
            'data' => [
                'compare_page_id'   => $compare_page_id,
                'providers_page_id' => $providers_page_id,
            ],
        ]);
    }

}
