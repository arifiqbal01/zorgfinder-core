<?php
namespace ZorgFinder\Snapshot;

class ProviderSnapshotGenerator {

    /**
     * Rebuild snapshot for ALL providers.
     */
    public static function rebuild_all(): void {
        global $wpdb;

        $providers_table = $wpdb->prefix . "zf_providers";
        $ids = $wpdb->get_col("SELECT id FROM {$providers_table} WHERE deleted_at IS NULL");

        if (empty($ids)) {
            error_log("[ZorgFinder Snapshot] No providers found for snapshot.");
            return;
        }

        foreach ($ids as $id) {
            self::update_provider((int)$id);
        }
    }

    /**
     * Rebuild a snapshot for a single provider.
     */
    public static function update_provider(int $provider_id): void {
        global $wpdb;

        $providers_table = $wpdb->prefix . "zf_providers";
        $reviews_table = $wpdb->prefix . "zf_reviews";
        $reimb_table = $wpdb->prefix . "zf_reimbursements";
        $snap_table = $wpdb->prefix . "zf_provider_snapshot";

        // Fetch provider
        $provider = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $providers_table WHERE id = %d LIMIT 1", $provider_id),
            ARRAY_A
        );

        if (!$provider) {
            error_log("[ZorgFinder Snapshot] Provider #$provider_id not found.");
            return;
        }

        /* -------------------------------------------
           REVIEWS SUMMARY
        ------------------------------------------- */
        $review = $wpdb->get_row(
            $wpdb->prepare("
                SELECT AVG(rating_overall) AS avg_rating,
                       COUNT(*) AS review_count
                FROM $reviews_table
                WHERE provider_id = %d AND approved = 1 AND deleted_at IS NULL
            ", $provider_id)
        );

        $avg_rating = $review && $review->avg_rating ? round((float)$review->avg_rating, 2) : 0;
        $review_count = $review ? (int)$review->review_count : 0;
        $has_reviews = $review_count > 0 ? 1 : 0;

        /* -------------------------------------------
           REIMBURSEMENTS
        ------------------------------------------- */
        $reimbursements = $wpdb->get_results(
            $wpdb->prepare("
                SELECT type, description, coverage_details
                FROM $reimb_table
                WHERE provider_id = %d AND deleted_at IS NULL
            ", $provider_id),
            ARRAY_A
        );

        $reimb_json = wp_json_encode($reimbursements);

        /* -------------------------------------------
           SEARCH BLOB FOR FAST SEARCHING
        ------------------------------------------- */
        $search_blob = implode(" ", array_filter([
            $provider['provider'],
            $provider['email'],
            $provider['phone'],
            $provider['address'],
            $provider['religion'],
            $provider['slug'],
        ]));

        /* -------------------------------------------
           WRITE SNAPSHOT
        ------------------------------------------- */
        $wpdb->replace($snap_table, [
            'provider_id'            => $provider_id,
            'avg_rating'             => $avg_rating,
            'review_count'           => $review_count,
            'has_reviews'            => $has_reviews,
            'reimbursements_json'    => $reimb_json,
            'target_genders_json'    => $provider['target_genders'],
            'target_age_groups_json' => $provider['target_age_groups'],
            'search_blob'            => $search_blob,
        ]);
    }
}
