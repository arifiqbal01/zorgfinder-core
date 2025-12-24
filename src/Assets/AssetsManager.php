<?php
namespace ZorgFinder\Assets;

defined('ABSPATH') || exit;

class AssetsManager
{
    public function __construct()
    {
        // Admin SPA
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

        // Frontend blocks + review form JS
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);

        // Shared global styles
        add_action('enqueue_block_assets', [$this, 'enqueue_shared_global_styles']);

        add_action('wp_footer', [$this, 'render_auth_mount']);
        add_action('wp_footer', [$this, 'render_appointment_drawer_mount']);
    }

    /**
     * Admin Dashboard (React App)
     */
    public function enqueue_admin_assets($hook)
    {
        if (strpos($hook, 'zorgfinder-dashboard') === false) {
            return;
        }

        // Load WordPress REST API JS bootstrap
        wp_enqueue_script('wp-api');

        // Make sure WP exposes the global REST nonce
        wp_localize_script('wp-api', 'wpApiSettings', [
            'root'  => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        $asset_file = ZORGFINDER_PATH . 'admin/build/index.asset.php';
        $js_file    = ZORGFINDER_URL . 'admin/build/index.js';
        $css_file   = ZORGFINDER_URL . 'admin/build/style-index.css';
        $global_css = ZORGFINDER_URL . 'shared-styles/dist/global.css';

        // Global Tailwind
        if (file_exists(ZORGFINDER_PATH . 'shared-styles/dist/global.css')) {
            wp_enqueue_style(
                'zorgfinder-global-styles',
                $global_css,
                [],
                ZORGFINDER_VERSION
            );
        }

        if (! file_exists($asset_file)) {
            error_log('⚠️ ZorgFinder: missing admin asset file: ' . $asset_file);
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

        if (file_exists(ZORGFINDER_PATH . 'admin/build/style-index.css')) {
            wp_enqueue_style(
                'zorgfinder-admin-style',
                $css_file,
                ['zorgfinder-global-styles'],
                $asset_data['version'] ?? ZORGFINDER_VERSION
            );
        }

        wp_localize_script('zorgfinder-admin', 'zorgFinderApp', [
            'restUrl'   => rest_url('zorg/v1/'),
            'nonce'     => wp_create_nonce('wp_rest'),
            'pluginUrl' => ZORGFINDER_URL,
        ]);
    }

    /**
     * Shared Global Styles (Frontend + Editor)
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

   public function enqueue_frontend_assets()
{
    $compare_page_id = (int) get_option('zorg_compare_page_id', 0);

    $localize = [
    'restUrl'    => rest_url('zorg/v1/'),
    'nonce'      => wp_create_nonce('wp_rest'),
    'isLoggedIn' => is_user_logged_in(),
    'roles'      => wp_get_current_user()->roles ?? [],
    'postId'     => get_queried_object_id(),
    'settings'   => [
        'comparePageId' => $compare_page_id,
        'compareUrl'    => $compare_page_id
            ? get_permalink($compare_page_id)
            : '',
    ],
];


    $scripts = [
        'reviews' => 'reviews-frontend',
        'appointment-form' => 'appointment-form-frontend',
        'providers' => 'providers-frontend',
        'comparison' => 'comparison-frontend',
        'auth-forms' => 'auth-forms',
    ];

    foreach ($scripts as $key => $file) {
        $path = ZORGFINDER_PATH . "blocks/build/{$file}.js";
        $url  = ZORGFINDER_URL  . "blocks/build/{$file}.js";

        if (!file_exists($path)) {
            continue;
        }

        $asset = require ZORGFINDER_PATH . "blocks/build/{$file}.asset.php";

        wp_enqueue_script(
            "zorgfinder-{$key}-frontend",
            $url,
            $asset['dependencies'],
            $asset['version'],
            true
        );

        wp_localize_script(
            "zorgfinder-{$key}-frontend",
            'zorgFinderApp',
            $localize
        );
    }
}


/**
 * Global Auth Drawer Mount Point
 * This must exist on all frontend pages
 */
public function render_auth_mount()
{
    if (is_admin()) {
        return;
    }

    echo '<div class="zf-auth-drawer-root"></div>';
}

public function render_appointment_drawer_mount() {
  if (is_admin()) return;
  echo '<div class="zf-appointment-drawer-root"></div>';
}




}
