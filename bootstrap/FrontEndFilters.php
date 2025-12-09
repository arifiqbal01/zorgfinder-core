<?php
namespace ZorgFinder\Bootstrap;

defined('ABSPATH') || exit;

class FrontEndFilters
{
    public function __construct()
    {
        add_filter('show_admin_bar', [$this, 'hide_admin_bar_for_clients']);
        add_action('admin_init', [$this, 'prevent_admin_access_for_clients']);
    }

    public function hide_admin_bar_for_clients($show)
    {
        if (is_user_logged_in() && current_user_can('zf_client')) {
            return false;
        }
        return $show;
    }

    public function prevent_admin_access_for_clients()
    {
        if (!is_user_logged_in()) return;

        if (current_user_can('zf_client') && !defined('DOING_AJAX')) {
            // Allow REST and AJAX; prevent admin dashboard view
            if (strpos($_SERVER['REQUEST_URI'], '/wp-admin') !== false) {
                wp_safe_redirect(home_url());
                exit;
            }
        }
    }
}
