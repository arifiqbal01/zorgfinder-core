<?php
namespace ZorgFinder;

use ZorgFinder\Traits\SingletonTrait;
use ZorgFinder\Database\DBManager;
use ZorgFinder\API\{
    ProvidersController,
    CompareController,
    FavouritesController,
    ReviewsController,
    AppointmentsController,
    ReimbursementsController,
    DashboardController
};
use ZorgFinder\Blocks\BlockRegistrar;

final class Core {
    use SingletonTrait;

    protected function __construct() {
        $this->boot();
    }

    private function boot(): void {
        $this->load_database();
        $this->register_api_routes();
        $this->register_blocks();
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
            (new ReviewsController())->register_routes();
            (new AppointmentsController())->register_routes();
            (new ReimbursementsController())->register_routes();
            (new DashboardController())->register_routes();
        });
    }

    /**
     * Register Gutenberg blocks
     */
    private function register_blocks(): void {
         new \ZorgFinder\Blocks\BlockRegistrar();
    }
}
