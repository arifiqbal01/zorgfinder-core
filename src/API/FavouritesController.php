<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use ZorgFinder\Database\DBManager;

class FavouritesController extends BaseController {
    public function register_routes() {
        register_rest_route($this->namespace, '/favourites', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_favourites'],
                'permission_callback' => [$this, 'permission_check'],
            ],
            [
                'methods'  => 'POST',
                'callback' => [$this, 'add_favourite'],
                'permission_callback' => [$this, 'permission_check'],
            ],
            [
                'methods'  => 'DELETE',
                'callback' => [$this, 'remove_favourite'],
                'permission_callback' => [$this, 'permission_check'],
            ],
        ]);
    }

    public function get_favourites() {
        $db = DBManager::get_instance();
        return $this->response($db->get_favourites(get_current_user_id()));
    }

    public function add_favourite(WP_REST_Request $req) {
        $provider_id = (int)$req->get_param('provider_id');
        $db = DBManager::get_instance();
        $db->add_favourite(get_current_user_id(), $provider_id);
        return $this->response(['message' => 'Added to favourites']);
    }

    public function remove_favourite(WP_REST_Request $req) {
        $provider_id = (int)$req->get_param('provider_id');
        $db = DBManager::get_instance();
        $db->remove_favourite(get_current_user_id(), $provider_id);
        return $this->response(['message' => 'Removed from favourites']);
    }
}
