<?php

use ZorgFinder\Core;
use ZorgFinder\Bootstrap\Activator;
use ZorgFinder\Bootstrap\Deactivator;
use ZorgFinder\Bootstrap\Updater;
use ZorgFinder\Assets\AssetsManager;
use ZorgFinder\Bootstrap\SnapshotHooks;

if ( ! defined( 'ABSPATH' ) ) exit;

// Autoloader
$autoload = dirname( __DIR__ ) . '/vendor/autoload.php';
if ( file_exists( $autoload ) ) {
    require_once $autoload;
}

// 🔹 Constants
define( 'ZORGFINDER_VERSION', '1.0.1' );
define( 'ZORGFINDER_PATH', plugin_dir_path( dirname( __FILE__ ) ) );
define( 'ZORGFINDER_URL', plugin_dir_url( dirname( __FILE__ ) ) );

// 🔹 Lifecycle Hooks
register_activation_hook(
    ZORGFINDER_PATH . 'zorgfinder-core.php',
    [Activator::class, 'activate']
);

register_deactivation_hook(
    ZORGFINDER_PATH . 'zorgfinder-core.php',
    [Deactivator::class, 'deactivate']
);


add_action('plugins_loaded', function () {
    SnapshotHooks::register();
});

// 🔹 Bootstrap Main Core
add_action( 'plugins_loaded', static function () {
    // Run updater first (handles migrations or version bumps)
    Updater::maybe_update();

    // Load config files if exist
    $services_config = ZORGFINDER_PATH . 'config/services.php';
    if ( file_exists( $services_config ) ) {
        $services = include $services_config;
        foreach ( $services as $service_class ) {
            if ( class_exists( $service_class ) ) {
                new $service_class();
            }
        }
    }

    // Initialize the Core singleton
    Core::get_instance();

    // Load general assets manager (handles both frontend & admin)
    new AssetsManager();
});

add_action('wp_footer', function () {
    echo '<div class="zf-auth-drawer-root"></div>';
});

add_action('wp_footer', function () {
    echo '<div class="zf-appointment-drawer-root"></div>';
});