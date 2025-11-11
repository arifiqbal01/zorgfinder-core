<?php
/**
 * Plugin Name: ZorgFinder Core
 * Description: Core functionality for the ZorgFinder healthcare comparison platform.
 * Version: 1.0.0
 * Author: WebArtsy
 * Text Domain: zorgfinder-core
 */

if (!defined('ABSPATH')) exit;

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrapping
use ZorgFinder\Core;

Core::get_instance();