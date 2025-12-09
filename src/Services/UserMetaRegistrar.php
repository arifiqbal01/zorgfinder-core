<?php
namespace ZorgFinder\Services;

defined('ABSPATH') || exit;

class UserMetaRegistrar
{
    public function __construct()
    {
        add_action('rest_api_init', [$this, 'register_rest_fields']);
    }

    public function register_rest_fields(): void
    {
        // Email (for /wp/v2/users responses) - safe because for public endpoints WP will still hide it except for current user
        register_rest_field('user', 'email', [
            'get_callback' => function ($user) {
                return get_userdata($user['id'])->user_email ?? '';
            },
            'schema' => [
                'type' => 'string',
                'context' => ['view', 'edit']
            ],
        ]);

        // Phone
        register_rest_field('user', 'phone', [
            'get_callback' => function ($user) {
                return get_user_meta($user['id'], 'phone', true) ?: '';
            },
            'schema' => [
                'type' => 'string',
                'context' => ['view', 'edit']
            ],
        ]);

        // Language
        register_rest_field('user', 'language', [
            'get_callback' => function ($user) {
                return get_user_meta($user['id'], 'language', true) ?: '';
            },
            'schema' => [
                'type' => 'string',
                'context' => ['view', 'edit']
            ],
        ]);
    }
}
