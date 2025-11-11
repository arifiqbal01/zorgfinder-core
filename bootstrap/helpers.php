<?php
/**
 * ZorgFinder Core - Global Helper Functions
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'zf_log' ) ) {
    /**
     * Log messages to PHP error log for debugging.
     *
     * @param mixed $message
     */
    function zf_log( $message ): void {
        if ( is_array( $message ) || is_object( $message ) ) {
            $message = print_r( $message, true );
        }
        error_log( '[ZorgFinder] ' . $message );
    }
}

if ( ! function_exists( 'zf_plugin_path' ) ) {
    function zf_plugin_path(): string {
        return plugin_dir_path( dirname( __FILE__ ) );
    }
}

if ( ! function_exists( 'zf_plugin_url' ) ) {
    function zf_plugin_url(): string {
        return plugin_dir_url( dirname( __FILE__ ) );
    }
}
