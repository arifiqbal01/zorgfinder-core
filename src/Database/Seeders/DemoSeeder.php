<?php
namespace ZorgFinder\Database\Seeders;

/**
 * Seeds demo data for ZorgFinder tables (providers, reimbursements, favourites).
 * Safe to run multiple times — skips if data already exists.
 */
class DemoSeeder
{
    public function run(): void
    {
        global $wpdb;

        $this->seed_providers($wpdb);
        $this->seed_reimbursements($wpdb);
        $this->seed_favourites($wpdb);
    }

    private function seed_providers($wpdb): void
    {
        $table = $wpdb->prefix . 'zf_providers';

        // Skip if already has data
        $count = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        $providers = [
            [
                'name' => 'Den Hartog Zorg',
                'slug' => 'den-hartog-zorg',
                'type_of_care' => 'disability',
                'indication_type' => 'PGB',
                'organization_type' => 'Stichting',
                'religion' => 'Christian',
                'has_hkz' => 1,
                'address' => 'Nieuwegracht 24, Utrecht',
                'email' => 'info@denhartogzorg.nl',
                'phone' => '+31 30 123 4567',
                'website' => 'https://denhartogzorg.nl',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
            [
                'name' => 'MediCare Plus',
                'slug' => 'medicare-plus',
                'type_of_care' => 'GGZ',
                'indication_type' => 'ZIN',
                'organization_type' => 'BV',
                'religion' => 'None',
                'has_hkz' => 0,
                'address' => 'Kanaalstraat 55, Amsterdam',
                'email' => 'contact@medicareplus.nl',
                'phone' => '+31 20 456 7890',
                'website' => 'https://medicareplus.nl',
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ],
        ];

        foreach ($providers as $provider) {
            $wpdb->insert($table, $provider);
        }

        error_log('[ZorgFinder Seeder] Providers seeded.');
    }

    private function seed_reimbursements($wpdb): void
    {
        $table = $wpdb->prefix . 'zf_reimbursements';
        $count = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        $wpdb->insert($table, [
            'provider_id' => 1,
            'type' => 'WLZ',
            'description' => 'Long-term care coverage for disability services.',
            'coverage_details' => 'Full coverage under WLZ scheme.'
        ]);

        $wpdb->insert($table, [
            'provider_id' => 2,
            'type' => 'ZVW',
            'description' => 'Mental health treatment reimbursement.',
            'coverage_details' => 'Partial coverage under ZVW plan.'
        ]);

        error_log('[ZorgFinder Seeder] Reimbursements seeded.');
    }

    private function seed_favourites($wpdb): void
    {
        $table = $wpdb->prefix . 'zf_favourites';
        $count = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table");
        if ($count > 0) {
            return;
        }

        // Ensure there are users
        $user_id = (int) $wpdb->get_var("SELECT ID FROM {$wpdb->prefix}users LIMIT 1");
        if (!$user_id) {
            error_log('[ZorgFinder Seeder] No users found — skipping favourites.');
            return;
        }

        // Insert some favourite providers for the first user
        $favourites = [
            ['user_id' => $user_id, 'provider_id' => 1, 'created_at' => current_time('mysql')],
            ['user_id' => $user_id, 'provider_id' => 2, 'created_at' => current_time('mysql')],
        ];

        foreach ($favourites as $fav) {
            $wpdb->insert($table, $fav);
        }

        error_log('[ZorgFinder Seeder] Favourites seeded for user ID ' . $user_id);
    }
}
