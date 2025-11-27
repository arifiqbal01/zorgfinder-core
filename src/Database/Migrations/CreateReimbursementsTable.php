<?php
namespace ZorgFinder\Database\Migrations;

class CreateReimbursementsTable {

    public function up(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reimbursements';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            provider_id BIGINT(20) UNSIGNED NOT NULL,
            type ENUM('WLZ','ZVW','WMO','Youth') NOT NULL,
            description TEXT DEFAULT NULL,
            coverage_details TEXT DEFAULT NULL,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL DEFAULT NULL,

            PRIMARY KEY (id),
            KEY provider_id (provider_id),
            KEY type (type),

            UNIQUE KEY unique_provider_type (provider_id, type)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }
}
