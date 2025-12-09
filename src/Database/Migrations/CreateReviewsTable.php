<?php
namespace ZorgFinder\Database\Migrations;

class CreateReviewsTable
{
    public function up(): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';
        $charset_collate = $wpdb->get_charset_collate();

        // Primary create statement includes new detailed rating fields + overall (decimal 1dp)
        $sql = "CREATE TABLE $table (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            provider_id BIGINT(20) UNSIGNED NOT NULL,
            user_id BIGINT(20) UNSIGNED DEFAULT NULL,

            -- overall rating stored as decimal with 1 decimal place (e.g. 4.2)
            rating_overall DECIMAL(3,1) NOT NULL DEFAULT 5.0,

            -- detailed criteria (1-5)
            rating_staff TINYINT(1) NOT NULL DEFAULT 5,
            rating_communication TINYINT(1) NOT NULL DEFAULT 5,
            rating_cleanliness TINYINT(1) NOT NULL DEFAULT 5,
            rating_facilities TINYINT(1) NOT NULL DEFAULT 5,
            rating_professionalism TINYINT(1) NOT NULL DEFAULT 5,

            comment TEXT DEFAULT NULL,
            approved TINYINT(1) NOT NULL DEFAULT 0,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL DEFAULT NULL,

            PRIMARY KEY (id),
            KEY provider_id (provider_id),
            KEY user_id (user_id),
            KEY approved (approved)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);

        // If table previously existed without the new columns, add them safely
        $this->ensure_columns($table, $wpdb);
        // Backfill overall for existing rows
        $this->backfill_overall($table, $wpdb);
    }

    private function ensure_columns(string $table, $wpdb): void
    {
        // Add columns if missing (ALTER TABLE is idempotent per existence checks)
        $cols = [
            'rating_overall' => "ADD COLUMN rating_overall DECIMAL(3,1) NOT NULL DEFAULT 5.0",
            'rating_staff' => "ADD COLUMN rating_staff TINYINT(1) NOT NULL DEFAULT 5",
            'rating_communication' => "ADD COLUMN rating_communication TINYINT(1) NOT NULL DEFAULT 5",
            'rating_cleanliness' => "ADD COLUMN rating_cleanliness TINYINT(1) NOT NULL DEFAULT 5",
            'rating_facilities' => "ADD COLUMN rating_facilities TINYINT(1) NOT NULL DEFAULT 5",
            'rating_professionalism' => "ADD COLUMN rating_professionalism TINYINT(1) NOT NULL DEFAULT 5",
        ];

        foreach ($cols as $col => $alter_sql) {
            $exists = $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$table} LIKE %s", $col));
            if (!$exists) {
                $wpdb->query("ALTER TABLE {$table} {$alter_sql}");
            }
        }
    }

    private function backfill_overall(string $table, $wpdb): void
    {
        // If detailed columns exist, compute overall as rounded average (1 dp).
        // If detailed columns do not exist but old 'rating' column exists, keep it as overall.
        $has_detailed = $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$table} LIKE %s", 'rating_staff'));

        if ($has_detailed) {
            // Compute overall for rows where overall is NULL or equals default (ensure idempotent)
            $wpdb->query("
                UPDATE {$table}
                SET rating_overall = ROUND(
                    (COALESCE(rating_staff,5)
                    + COALESCE(rating_communication,5)
                    + COALESCE(rating_cleanliness,5)
                    + COALESCE(rating_facilities,5)
                    + COALESCE(rating_professionalism,5)) / 5
                , 1)
                WHERE rating_overall IS NULL OR rating_overall = 0
            ");
        } else {
            // If only old 'rating' exists, copy it into rating_overall (preserve previous values)
            $has_old_rating = $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$table} LIKE %s", 'rating'));
            if ($has_old_rating) {
                $exists_new = $wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM {$table} LIKE %s", 'rating_overall'));
                if ($exists_new) {
                    $wpdb->query("
                        UPDATE {$table}
                        SET rating_overall = ROUND(COALESCE(rating,5),1)
                        WHERE rating_overall IS NULL OR rating_overall = 0
                    ");
                }
            }
        }
    }
}
