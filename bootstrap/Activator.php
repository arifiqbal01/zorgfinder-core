<?php
namespace ZorgFinder\Bootstrap;

use ZorgFinder\Database\DBManager;

/**
 * Handles plugin activation.
 * Runs once when the plugin is activated.
 */
class Activator
{
    /**
     * Main activation routine.
     */
    public static function activate(): void
    {
        try {
            $db = DBManager::get_instance();

            // 1️⃣ Run migrations to ensure all tables exist
            $db->run_migrations();

            // 2️⃣ Seed demo data if it's a fresh install
            if ( ! get_option( 'zorgfinder_installed' ) ) {
                $db->run_seeders();
            }

        } catch (\Throwable $e) {
            error_log('[ZorgFinder Activation Error] ' . $e->getMessage());
        }

        // 3️⃣ Register default plugin options
        self::register_default_options();

        // 4️⃣ Flush rewrite rules for REST routes
        self::flush_rewrite_rules();
    }

    /**
     * Register or update default plugin options.
     */
    private static function register_default_options(): void
    {
        $now = current_time('mysql');

        if ( ! get_option('zorgfinder_installed') ) {
            add_option('zorgfinder_installed', $now);
        }

        update_option('zorgfinder_version', ZORGFINDER_VERSION);
    }

    /**
     * Flush rewrite rules to register REST routes.
     */
    private static function flush_rewrite_rules(): void
    {
        if ( function_exists('flush_rewrite_rules') ) {
            flush_rewrite_rules();
        }
    }
}
