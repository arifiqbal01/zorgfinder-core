<?php
namespace ZorgFinder\Database;

use ZorgFinder\Traits\SingletonTrait;
use ZorgFinder\Database\Migrations\MigrationRunner;

/**
 * DBManager handles all ZorgFinder database operations:
 * - Running migrations
 * - Initializing custom tables
 * - Tracking DB version for automatic upgrades
 */
class DBManager {
    use SingletonTrait;

    /**
     * Initialize database services.
     */
    protected function __construct() {
        add_action('plugins_loaded', [$this, 'maybe_run_migrations']);
    }

    /**
     * Run all ZorgFinder migrations.
     * Called manually during plugin activation or upgrades.
     */
    public function run_migrations(): void {
        $runner = new MigrationRunner();
        $runner->run();
        update_option('zorgfinder_db_version', ZORGFINDER_VERSION);
    }

    /**
     * Run seeders manually (optional for dev/demo data).
     */
    public function run_seeders(): void {
        $seeder_class = '\\ZorgFinder\\Database\\Seeders\\DemoSeeder';
        if (class_exists($seeder_class)) {
            (new $seeder_class())->run();
        }
    }

    /**
     * Check if DB migrations need to run (on version change).
     */
    public function maybe_run_migrations(): void {
        $current_db_version = get_option('zorgfinder_db_version');
        if ($current_db_version !== ZORGFINDER_VERSION) {
            $this->run_migrations();
        }
    }
}
