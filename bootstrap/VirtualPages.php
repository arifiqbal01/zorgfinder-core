<?php
namespace ZorgFinder\Bootstrap;

defined('ABSPATH') || exit;

class VirtualPages
{
    public static function register(): void
    {
        error_log('[ZorgFinder] VirtualPages::register called');
        add_action('template_redirect', [self::class, 'handle_submit_review'], 0);
    }

    public static function handle_submit_review(): void
{
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

    if ($path !== 'submit-review') {
        return;
    }

    global $wp_query;
    $wp_query->is_404 = false;

    status_header(200);
    nocache_headers();

    do_action('wp_enqueue_scripts');

    get_header();

    echo '<main id="primary" class="site-main">';
    echo '<div class="zf-submit-review-root" style="margin-top:80px; margin-bottom:80px;"></div>';
    echo '</main>';

    get_footer();

    exit;
}



}
