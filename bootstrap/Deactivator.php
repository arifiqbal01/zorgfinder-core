<?php
namespace ZorgFinder\Bootstrap;

/**
 * Handles plugin deactivation.
 * Runs when the plugin is deactivated but not deleted.
 */
class Deactivator
{
    public static function deactivate(): void
    {
        self::clear_scheduled_events();

        if ( function_exists('flush_rewrite_rules') ) {
            flush_rewrite_rules();
        }
    }

    private static function clear_scheduled_events(): void
    {
        $events = [
            'zorgfinder_daily_cleanup',
            'zorgfinder_sync_task'
        ];

        foreach ( $events as $hook ) {
            if ( wp_next_scheduled( $hook ) ) {
                wp_clear_scheduled_hook( $hook );
            }
        }
    }
}
