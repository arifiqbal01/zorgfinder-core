<?php
namespace ZorgFinder\Database\Migrations;

class CreateAppointmentsTable
{
    public function up(): void
    {
        global $wpdb;

        $table = $wpdb->prefix . 'zf_appointments';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

            user_id BIGINT(20) UNSIGNED NULL DEFAULT NULL,
            provider_id BIGINT(20) UNSIGNED NOT NULL,

            -- Visitor contact info
            name VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL,
            phone VARCHAR(50) NOT NULL,

            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            notes TEXT DEFAULT NULL,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL DEFAULT NULL,

            PRIMARY KEY  (id),
            KEY provider_id (provider_id),
            KEY user_id (user_id)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }
}
