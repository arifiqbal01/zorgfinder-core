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
    $review_file       = ZORGFINDER_PATH . 'assets/js/review-form-frontend.js';
    $appointment_file  = ZORGFINDER_PATH . 'blocks/build/appointment-form-frontend.js';
    $providers_file    = ZORGFINDER_PATH . 'blocks/build/providers-frontend.js';
    $comparison_file   = ZORGFINDER_PATH . 'blocks/build/comparison-frontend.js';
    $auth_forms_file   = ZORGFINDER_PATH . 'blocks/build/auth-forms.js';
    $compare_page_id = (int) get_option('zorg_compare_page_id', 0);

    $compare_page_id = (int) get_option('zorg_compare_page_id', 0);

    $localize = [
        'restUrl'    => rest_url('zorg/v1/'),
        'nonce'      => wp_create_nonce('wp_rest'),
        'isLoggedIn' => is_user_logged_in(),

        // Page context
        'postId'     => get_queried_object_id(),

        // Plugin settings
        'settings'   => [
            'comparePageId' => $compare_page_id,
            'compareUrl'    => $compare_page_id
                ? get_permalink($compare_page_id)
                : '',
        ],
    ];

    /**
     * REVIEW FORM
     */
    if (file_exists($review_file)) {
        wp_enqueue_script(
            'zorgfinder-review-form',
            ZORGFINDER_URL . 'assets/js/review-form-frontend.js',
            ['wp-element'],
            filemtime($review_file),
            true
        );
        wp_localize_script('zorgfinder-review-form', 'zorgFinderApp', $localize);
    }

    /**
     * APPOINTMENT FORM
     */
    if (file_exists($appointment_file)) {
        wp_enqueue_script(
            'zorgfinder-appointment-form',
            ZORGFINDER_URL . 'blocks/build/appointment-form-frontend.js',
            ['wp-element'],
            filemtime($appointment_file),
            true
        );
        wp_localize_script('zorgfinder-appointment-form', 'zorgFinderApp', $localize);
    }

    /**
     * PROVIDERS FRONTEND
     */
    if (file_exists($providers_file)) {
        wp_enqueue_script(
            'zorgfinder-providers-frontend',
            ZORGFINDER_URL . 'blocks/build/providers-frontend.js',
            ['wp-element'],
            filemtime($providers_file),
            true
        );
        wp_localize_script('zorgfinder-providers-frontend', 'zorgFinderApp', $localize);
    }

    /**
     * COMPARISON FRONTEND (NEW)
     */
    if (file_exists($comparison_file)) {
        wp_enqueue_script(
            'zorgfinder-comparison-frontend',
            ZORGFINDER_URL . 'blocks/build/comparison-frontend.js',
            ['wp-element'],
            filemtime($comparison_file),
            true
        );
        wp_localize_script('zorgfinder-comparison-frontend', 'zorgFinderApp', $localize);
    }

    /**
     * Auth Forms FRONTEND (NEW)
     */
    if (file_exists($auth_forms_file)) {
        wp_enqueue_script(
            'zorgfinder-auth-forms-frontend',
            ZORGFINDER_URL . 'blocks/build/auth-forms.js',
            ['wp-element'],
            filemtime($auth_forms_file),
            true
        );
        wp_localize_script('zorgfinder-auth-forms-frontend', 'zorgFinderApp', $localize);
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
