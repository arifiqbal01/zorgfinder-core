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