<?php
namespace ZorgFinder\Assets;

defined('ABSPATH') || exit;

class AssetsManager
{
    public function __construct()
    {
        // 🔹 Enqueue admin (React app)
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

        // 🔹 Enqueue frontend (Gutenberg blocks, forms, etc.)
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);

        // 🔹 Shared global styles for block editor + frontend
        add_action('enqueue_block_assets', [$this, 'enqueue_shared_global_styles']);
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
        $global_css = ZORGFINDER_URL . 'shared-styles/dist/global.css';

        // --- Enqueue Shared Global Styles (Tailwind + theme variables) ---
        if (file_exists(ZORGFINDER_PATH . 'shared-styles/dist/global.css')) {
            wp_enqueue_style(
                'zorgfinder-global-styles',
                $global_css,
                [],
                ZORGFINDER_VERSION
            );
        } else {
            error_log('⚠️ ZorgFinder: missing global.css in shared-styles/dist/');
        }

        // --- Admin React Build ---
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

        // Admin-only CSS bundle (if present)
        if (file_exists(ZORGFINDER_PATH . 'admin/build/style-index.css')) {
            wp_enqueue_style(
                'zorgfinder-admin-style',
                $css_file,
                ['zorgfinder-global-styles'],
                $asset_data['version'] ?? ZORGFINDER_VERSION
            );
        }

        // Pass data to JS
        wp_localize_script('zorgfinder-admin', 'zorgFinderApp', [
            'restUrl'   => rest_url('zorg/v1/'),
            'nonce'     => wp_create_nonce('wp_rest'),
            'pluginUrl' => ZORGFINDER_URL,
        ]);
    }

    /**
     * Enqueue Shared Global Styles for Frontend and Gutenberg
     */
    public function enqueue_shared_global_styles()
    {
        $global_css = ZORGFINDER_URL . 'shared-styles/dist/global.css';

        if (file_exists(ZORGFINDER_PATH . 'shared-styles/dist/global.css')) {
            wp_enqueue_style(
                'zorgfinder-global-styles',
                $global_css,
                [],
                ZORGFINDER_VERSION
            );
        }
    }

    /**
     * Enqueue Frontend Assets (Public Site)
     */
    public function enqueue_frontend_assets()
    {
        // Future use: for Gutenberg blocks, frontend forms, etc.
        // The shared Tailwind styles are already handled in enqueue_shared_global_styles()
    }
}
