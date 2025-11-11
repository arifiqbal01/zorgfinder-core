<?php
namespace ZorgFinder;

use ZorgFinder\Traits\SingletonTrait;
use ZorgFinder\Database\DBManager;
use ZorgFinder\API\{ProvidersController, CompareController, FavouritesController};

final class Core {
    use SingletonTrait;

    public function __construct() {
        $this->register_services();
    }

    private function register_services(): void {
        DBManager::get_instance();
        add_action('rest_api_init', function () {
            (new ProvidersController())->register_routes();
            (new CompareController())->register_routes();
            (new FavouritesController())->register_routes();
        });
    }
}
