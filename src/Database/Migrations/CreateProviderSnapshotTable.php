<?php
namespace ZorgFinder\Database\Migrations;

class CreateProviderSnapshotTable {

    public function up(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_provider_snapshot';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table (
            provider_id BIGINT(20) UNSIGNED NOT NULL,

            avg_rating DECIMAL(3,2) DEFAULT 0,
            review_count INT DEFAULT 0,
            has_reviews TINYINT(1) DEFAULT 0,

            reimbursements_json LONGTEXT NULL,
            target_genders_json LONGTEXT NULL,
            target_age_groups_json LONGTEXT NULL,

            search_blob TEXT NULL,

            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

            PRIMARY KEY  (provider_id)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);

        // ADD FULLTEXT INDEX SAFELY (dbDelta cannot handle it)
        $wpdb->query("ALTER TABLE $table ADD FULLTEXT idx_search (search_blob)");
    }
}
