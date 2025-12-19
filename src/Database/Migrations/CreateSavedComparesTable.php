<?php
namespace ZorgFinder\Database\Migrations;

defined('ABSPATH') || exit;

class CreateSavedComparesTable {

    public function up(): void {
        global $wpdb;

        $table = $wpdb->prefix . 'zf_saved_compares';
        $charset_collate = $wpdb->get_charset_collate();

        // 1️⃣ Check if table exists
        $exists = $wpdb->get_var(
            $wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $table
            )
        );

        // -------------------------
        // Fresh install
        // -------------------------
        if (!$exists) {
            $sql = "CREATE TABLE $table (
                id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

                user_id BIGINT(20) UNSIGNED NOT NULL,
                provider_ids JSON NOT NULL,
                compare_key VARCHAR(255) NOT NULL,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_at DATETIME NULL DEFAULT NULL,

                PRIMARY KEY (id),
                UNIQUE KEY uniq_user_compare_active (user_id, compare_key, deleted_at),
                KEY user_id (user_id),
                KEY deleted_at (deleted_at)
            ) $charset_collate;";

            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            dbDelta($sql);
            return;
        }

        // -------------------------
        // Upgrade existing table
        // -------------------------

        // Get current columns
        $columns = $wpdb->get_col("DESC $table", 0);

        // 2️⃣ Drop old provider_hash if exists
        if (in_array('provider_hash', $columns, true)) {
            $wpdb->query("ALTER TABLE $table DROP COLUMN provider_hash");
        }

        // 3️⃣ Add compare_key if missing
        if (!in_array('compare_key', $columns, true)) {
            $wpdb->query(
                "ALTER TABLE $table
                 ADD compare_key VARCHAR(255) NOT NULL"
            );
        }

        // 4️⃣ Ensure unique index exists (drop & recreate safely)
        $indexes = $wpdb->get_results("SHOW INDEX FROM $table");
        $index_names = array_column($indexes, 'Key_name');

        if (in_array('uniq_user_compare_active', $index_names, true)) {
            $wpdb->query(
                "ALTER TABLE $table
                 DROP INDEX uniq_user_compare_active"
            );
        }

        $wpdb->query(
            "ALTER TABLE $table
             ADD UNIQUE KEY uniq_user_compare_active (user_id, compare_key, deleted_at)"
        );
    }
}
