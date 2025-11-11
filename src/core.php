<?php
namespace ZorgFinder;

use ZorgFinder\Traits\SingletonTrait;
use ZorgFinder\Database\DBManager;
use ZorgFinder\API\{
    ProvidersController,
    CompareController,
    FavouritesController
};

/**
 * The main orchestrator for the ZorgFinder Core plugin.
 *
 * Responsibilities:
 * - Bootstraps core services (DB, REST controllers)
 * - Initializes submodules
 * - Loads only when WordPress is ready
 */
final class Core {
    use SingletonTrait;

    /**
     * Boot sequence
     */
    protected function __construct() {
        $this->boot();
    }

    /**
     * Bootstraps the plugin core
     */
    private function boot(): void {
        $this->load_database();
        $this->register_api_routes();
    }

    /**
     * Initialize the database manager
     */
    private function load_database(): void {
        DBManager::get_instance();
    }

    /**
     * Register REST API controllers
     */
    private function register_api_routes(): void {
        add_action('rest_api_init', function () {
            (new ProvidersController())->register_routes();
            (new CompareController())->register_routes();
            (new FavouritesController())->register_routes();
        });
    }
}
