<?php
namespace ZorgFinder\Database\Migrations;

/**
 * Creates the zf_providers table.
 */
class CreateProvidersTable {

    public function up(): void {
        global $wpdb;
        $table_name = $wpdb->prefix . 'zf_providers';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table_name (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

        -- Provider (company/organization name)
        provider VARCHAR(255) NOT NULL,

        slug VARCHAR(255) NOT NULL,

        -- Multi-value target genders (JSON array)
        target_genders JSON DEFAULT NULL,

        -- Multi-value target age groups (JSON array)
        target_age_groups JSON DEFAULT NULL,

        type_of_care VARCHAR(50) DEFAULT NULL,
        indication_type VARCHAR(10) DEFAULT NULL,
        organization_type VARCHAR(50) DEFAULT NULL,
        religion VARCHAR(50) DEFAULT NULL,

        has_hkz TINYINT(1) DEFAULT 0,

        address TEXT DEFAULT NULL,
        email VARCHAR(150) DEFAULT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        website VARCHAR(255) DEFAULT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,

        PRIMARY KEY (id),
        UNIQUE KEY slug (slug)
    ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}
