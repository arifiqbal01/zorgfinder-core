<?php
namespace ZorgFinder\Bootstrap;

use ZorgFinder\Database\DBManager;

/**
 * Handles version-based updates for ZorgFinder Core.
 */
class Updater
{
    /**
     * Run version check and upgrade tasks.
     */
    public static function maybe_update(): void
    {
        $installed_version = get_option('zorgfinder_version');
        $current_version   = defined('ZORGFINDER_VERSION') ? ZORGFINDER_VERSION : '1.0.0';

        // First-time install
        if ( ! $installed_version ) {
            update_option('zorgfinder_version', $current_version);
            return;
        }

        // Already up-to-date
        if ( version_compare($installed_version, $current_version, '>=') ) {
            return;
        }

        // Run migration updates
        try {
            DBManager::get_instance()->run_migrations();
        } catch (\Throwable $e) {
            error_log('[ZorgFinder Updater Error] ' . $e->getMessage());
        }

        // Run seeder (optional)
        self::run_seeders();

        // Update stored version
        update_option('zorgfinder_version', $current_version);
    }

    /**
     * Run seeders after version upgrade (optional).
     */
    private static function run_seeders(): void
    {
        $seeder = new \ZorgFinder\Database\Seeders\DemoSeeder();
        $seeder->run();
    }
}
