<?php
namespace ZorgFinder\Bootstrap;

use wpdb;

/**
 * Handles full uninstall (plugin deletion).
 */
class Uninstaller
{
    public static function uninstall(): void
    {
        global $wpdb;

        self::drop_custom_tables( $wpdb );
        self::delete_plugin_options();

        if ( function_exists('flush_rewrite_rules') ) {
            flush_rewrite_rules();
        }
    }

    private static function drop_custom_tables( wpdb $wpdb ): void
    {
        $tables = [
            "{$wpdb->prefix}zf_providers",
            "{$wpdb->prefix}zf_reimbursements",
            "{$wpdb->prefix}zf_favourites",
            "{$wpdb->prefix}zf_reviews",
            "{$wpdb->prefix}zf_appointments"
        ];

        foreach ( $tables as $table ) {
            $wpdb->query( "DROP TABLE IF EXISTS $table" );
        }
    }

    private static function delete_plugin_options(): void
    {
        $options = [
            'zorgfinder_installed',
            'zorgfinder_version'
        ];

        foreach ( $options as $option ) {
            delete_option( $option );
        }
    }
}
