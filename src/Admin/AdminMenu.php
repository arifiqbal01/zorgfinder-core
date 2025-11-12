<?php
namespace ZorgFinder\Admin;

if (! defined('ABSPATH')) exit;

class AdminMenu
{
    public function __construct()
    {
        add_action('admin_menu', [$this, 'register']);
    }

    public function register()
    {
        add_menu_page(
            __('ZorgFinder Dashboard', 'zorgfinder'),
            __('ZorgFinder', 'zorgfinder'),
            'manage_options',
            'zorgfinder-dashboard',
            [$this, 'render'],
            'dashicons-heart',
            3
        );
    }

    public function render()
    {
        echo '<div id="zorgfinder-admin-app" class="wrap zorgfinder-app"></div>';
    }

}
