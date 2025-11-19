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
        $blocks_dir = ZORGFINDER_PATH . 'blocks/build/';
        if (!is_dir($blocks_dir)) return;

        $block_folders = glob($blocks_dir . '*/', GLOB_ONLYDIR);

        foreach ($block_folders as $block_path) {
            if (file_exists($block_path . 'block.json')) {
                register_block_type($block_path);
            }
        }
    }
}
