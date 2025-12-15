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

        // Run migrations
        $db->run_migrations();

        // Seed demo data on fresh install
        if (! get_option('zorgfinder_installed')) {
            $db->run_seeders();
        }

        // ⭐ NEW: Build provider snapshots on activation
        \ZorgFinder\Snapshot\ProviderSnapshotGenerator::rebuild_all();

    } catch (\Throwable $e) {
        error_log('[ZorgFinder Activation Error] ' . $e->getMessage());
    }

    // Register roles, options, flush rules...
    self::register_roles();
    self::register_default_options();
    self::flush_rewrite_rules();
}


    /**
     * Create or update custom roles.
     */
    private static function register_roles(): void
    {
        // Clone Subscriber capabilities as baseline
        $subscriber = get_role('subscriber');
        $base_caps  = $subscriber ? $subscriber->capabilities : [ 'read' => true ];

        // Create the role if missing
        if (! get_role('zf_client')) {
            add_role(
                'zf_client',
                'Client',
                $base_caps
            );
        }

        // Ensure role gets our plugin-specific capability
        $role = get_role('zf_client');
        if ($role && ! $role->has_cap('use_zorg_frontend')) {
            $role->add_cap('use_zorg_frontend');
        }
    }

    /**
     * Register or update default plugin options.
     */
    private static function register_default_options(): void
    {
        $now = current_time('mysql');

        if (! get_option('zorgfinder_installed')) {
            add_option('zorgfinder_installed', $now);
        }

        update_option('zorgfinder_version', ZORGFINDER_VERSION);
    }

    /**
     * Flush rewrite rules to register REST routes.
     */
    private static function flush_rewrite_rules(): void
    {
        if (function_exists('flush_rewrite_rules')) {
            flush_rewrite_rules();
        }
    }
}
