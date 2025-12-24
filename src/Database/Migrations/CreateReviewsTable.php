<?php
namespace ZorgFinder\Database\Migrations;

class CreateReviewsTable
{
    public function up(): void
    {
        global $wpdb;

        $table = $wpdb->prefix . 'zf_reviews';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

            provider_id BIGINT(20) UNSIGNED NOT NULL,

            -- Review origin
            source ENUM('internal','google') NOT NULL DEFAULT 'internal',

            -- Internal reviews
            user_id BIGINT(20) UNSIGNED DEFAULT NULL,
            invite_id BIGINT(20) UNSIGNED DEFAULT NULL,

            -- Google reviews
            external_review_id VARCHAR(191) DEFAULT NULL,
            external_author_name VARCHAR(191) DEFAULT NULL,
            external_author_avatar TEXT DEFAULT NULL,

            -- Ratings
            rating_overall DECIMAL(3,1) NOT NULL,

            -- Detailed ratings (internal only)
            rating_staff TINYINT(1) DEFAULT NULL,
            rating_communication TINYINT(1) DEFAULT NULL,
            rating_cleanliness TINYINT(1) DEFAULT NULL,
            rating_facilities TINYINT(1) DEFAULT NULL,
            rating_professionalism TINYINT(1) DEFAULT NULL,

            comment TEXT DEFAULT NULL,

            approved TINYINT(1) NOT NULL DEFAULT 0,

            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            deleted_at DATETIME DEFAULT NULL,

            PRIMARY KEY (id),

            KEY provider_id (provider_id),
            KEY source (source),
            KEY user_id (user_id),
            KEY invite_id (invite_id),
            KEY external_review_id (external_review_id),
            KEY provider_approved (provider_id, approved)

        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }
}
