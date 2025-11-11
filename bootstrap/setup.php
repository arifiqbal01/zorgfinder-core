<?php

use ZorgFinder\Core;
use ZorgFinder\Bootstrap\Activator;
use ZorgFinder\Bootstrap\Deactivator;
use ZorgFinder\Bootstrap\Updater;

if ( ! defined( 'ABSPATH' ) ) exit;

// Load autoload
if ( file_exists( dirname( __DIR__ ) . '/vendor/autoload.php' ) ) {
    require_once dirname( __DIR__ ) . '/vendor/autoload.php';
}

define( 'ZORGFINDER_VERSION', '1.0.1' ); // 👈 bump this when releasing updates
define( 'ZORGFINDER_PATH', plugin_dir_path( dirname( __FILE__ ) ) );
define( 'ZORGFINDER_URL', plugin_dir_url( dirname( __FILE__ ) ) );

register_activation_hook(
    ZORGFINDER_PATH . 'zorgfinder-core.php',
    [Activator::class, 'activate']
);

register_deactivation_hook(
    ZORGFINDER_PATH . 'zorgfinder-core.php',
    [Deactivator::class, 'deactivate']
);

// Run updater on every load
add_action( 'plugins_loaded', static function () {
    Updater::maybe_update();
    Core::get_instance();
});
