<?php
namespace ZorgFinder\Blocks;

defined('ABSPATH') || exit;

class BlockRegistrar
{
    public function __construct()
    {
        add_action('init', [$this, 'register_all']);
    }

    public function register_all()
    {
        error_log('ZorgFinder BlockRegistrar running...');

        $blocks_dir = ZORGFINDER_PATH . 'blocks/build/';
        if (!is_dir($blocks_dir)) {
            error_log('⚠️ ZorgFinder: blocks build folder missing.');
            return;
        }

        $block_folders = glob($blocks_dir . '*/', GLOB_ONLYDIR);

        foreach ($block_folders as $block_path) {
            if (!file_exists($block_path . 'block.json')) {
                continue;
            }

            // Get block slug from folder name, e.g. "providers"
            $block_slug = basename($block_path);

            // Register dynamic render callback for specific blocks
            if ($block_slug === 'providers') {
                register_block_type(
                    $block_path,
                    [
                        'render_callback' => [$this, 'render_providers_block']
                    ]
                );
            } else {
                // Default: static block registration
                register_block_type($block_path);
            }
        }
    }

    /**
     * Render callback for Providers block
     */
    public function render_providers_block($attributes = [], $content = '')
    {
        error_log('ZorgFinder ProvidersBlock render() triggered ✅');

        global $wpdb;
        $table = $wpdb->prefix . 'zf_providers';
        $providers = $wpdb->get_results("SELECT * FROM {$table} LIMIT 10", ARRAY_A);

        if (empty($providers)) {
            return '<p>No providers found.</p>';
        }

        ob_start(); ?>
        <div class="zf-card">
            <h3 class="text-xl font-semibold mb-4">ZorgFinder Providers</h3>
            <ul class="space-y-2">
                <?php foreach ($providers as $p): ?>
                    <li class="border-b border-gray-100 pb-2">
                        <strong class="text-gray-900"><?= esc_html($p['name']); ?></strong><br>
                        <span class="text-sm text-gray-500"><?= esc_html($p['type_of_care']); ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php
        return ob_get_clean();
    }
}
