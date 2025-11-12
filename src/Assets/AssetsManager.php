<?php
namespace ZorgFinder\Assets;

defined('ABSPATH') || exit;

class AssetsManager
{
    public function __construct()
    {
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
    }

    /**
     * Enqueue Admin Dashboard (React App)
     */
    public function enqueue_admin_assets($hook)
    {
        // Only load on ZorgFinder Dashboard page
        if (strpos($hook, 'zorgfinder-dashboard') === false) {
            return;
        }

        $asset_file = ZORGFINDER_PATH . 'admin/build/index.asset.php';
        $js_file    = ZORGFINDER_URL . 'admin/build/index.js';
        $css_file   = ZORGFINDER_URL . 'admin/build/style-index.css';

        if (! file_exists($asset_file)) {
            error_log('⚠️ ZorgFinder: missing admin asset file at ' . $asset_file);
            return;
        }

        $asset_data = include $asset_file;

        wp_enqueue_script(
            'zorgfinder-admin',
            $js_file,
            $asset_data['dependencies'] ?? ['wp-element'],
            $asset_data['version'] ?? ZORGFINDER_VERSION,
            true
        );

        wp_enqueue_style(
            'zorgfinder-admin-style',
            $css_file,
            [],
            $asset_data['version'] ?? ZORGFINDER_VERSION
        );

        wp_localize_script('zorgfinder-admin', 'zorgFinderApp', [
            'restUrl'   => rest_url('zorg/v1/'),
            'nonce'     => wp_create_nonce('wp_rest'),
            'pluginUrl' => ZORGFINDER_URL,
        ]);
    }

    /**
     * Enqueue Frontend Assets (Public Site)
     */
    public function enqueue_frontend_assets()
    {
        // Future use: for Gutenberg blocks, public forms, etc.
    }
}
