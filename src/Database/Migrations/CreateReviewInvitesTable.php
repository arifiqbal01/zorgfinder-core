<?php
namespace ZorgFinder\Database\Migrations;

class CreateReviewInvitesTable
{
    public function up(): void
    {
        global $wpdb;

        $table = $wpdb->prefix . 'zf_review_invites';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

            provider_id BIGINT(20) UNSIGNED NOT NULL,

            email VARCHAR(191) NOT NULL,

            token VARCHAR(64) NOT NULL,

            used_at DATETIME DEFAULT NULL,
            expires_at DATETIME DEFAULT NULL,

            created_at DATETIME NOT NULL,

            PRIMARY KEY (id),

            UNIQUE KEY token (token),
            KEY provider_id (provider_id),
            KEY email (email),
            KEY used_at (used_at),
            KEY expires_at (expires_at)

        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
    }
}
