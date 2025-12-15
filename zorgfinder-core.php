<?php
/**
 * Plugin Name: ZorgFinder Core
 * Description: Core functionality for the ZorgFinder healthcare comparison platform.
 * Version: 1.0.0
 * Author: WebArtsy
 * Text Domain: zorgfinder-core
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/bootstrap/helpers.php';
require_once __DIR__ . '/bootstrap/setup.php';

/**
 * --------------------------------------------------------------------------
 * Initialize Core (handled automatically in setup.php)
 * --------------------------------------------------------------------------
 *
 * We intentionally do NOT call Core::get_instance() directly here.
 * setup.php handles plugin initialization on the `plugins_loaded` hook,
 * keeping this file minimal and free of boot logic.
 */

// TEMP: nonce / auth debug endpoint (remove after debugging)
add_action('rest_api_init', function () {
    register_rest_route('zorg/v1', '/debug-nonce', [
        'methods'  => 'GET',
        'callback' => function( WP_REST_Request $request ) {
            $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');
            $nonce_ok = $nonce ? wp_verify_nonce( $nonce, 'wp_rest' ) : false;

            $info = [
                'time'                    => current_time('mysql'),
                'php_time'                => date('Y-m-d H:i:s'),
                'nonce_present'           => $nonce ? true : false,
                'nonce_value_full'        => $nonce ?: null,
                'nonce_verified'         => (bool) $nonce_ok,
                'is_user_logged_in'       => is_user_logged_in(),
                'current_user_id'         => get_current_user_id(),
                'current_user_caps_check' => current_user_can('edit_others_posts'),
                'cookies'                 => [
                    'wordpress_logged_in' => isset($_COOKIE[preg_grep('/^wordpress_logged_in_/', array_keys($_COOKIE))[0] ?? '']) ? true : false,
                ],
                'server_headers' => array_intersect_key($_SERVER, array_flip([
                    'HTTP_HOST','REQUEST_URI','HTTP_X_WP_NONCE','HTTP_COOKIE','REMOTE_ADDR','SERVER_NAME'
                ])),
            ];

            return rest_ensure_response([
                'success' => true,
                'debug' => $info,
            ]);
        },
        'permission_callback' => '__return_true', // debug only
    ]);
});

