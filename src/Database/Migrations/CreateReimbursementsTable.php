<?php
namespace ZorgFinder\Database\Migrations;

/**
 * Creates the zf_reimbursements table.
 */
class CreateReimbursementsTable {

    public function up(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reimbursements';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS $table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            provider_id BIGINT(20) UNSIGNED NOT NULL,
            type ENUM('WLZ','ZVW','WMO','Youth') DEFAULT NULL,
            description TEXT DEFAULT NULL,
            coverage_details TEXT DEFAULT NULL,
            PRIMARY KEY (id),
            KEY provider_id (provider_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}
