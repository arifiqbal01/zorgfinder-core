<?php
namespace ZorgFinder\Services;

class ReviewService
{
    /**
     * Get reviews for a provider (excluding soft-deleted).
     */
    public function get_reviews_for_provider(int $provider_id, ?int $approved = 1): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $sql = "SELECT * FROM $table WHERE provider_id = %d AND deleted_at IS NULL";
        $params = [$provider_id];

        if ($approved !== null) {
            $sql .= " AND approved = %d";
            $params[] = $approved;
        }

        $sql .= " ORDER BY created_at DESC";

        return $wpdb->get_results($wpdb->prepare($sql, ...$params), ARRAY_A);
    }

    /**
     * Get a single review (excluding deleted unless admin restores).
     */
    public function get_review(int $id, bool $include_deleted = false): ?array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $sql = "SELECT * FROM $table WHERE id = %d";
        if (! $include_deleted) {
            $sql .= " AND deleted_at IS NULL";
        }

        $review = $wpdb->get_row($wpdb->prepare($sql, $id), ARRAY_A);
        return $review ?: null;
    }

    /**
     * Get all non-deleted reviews (admin view).
     */
    public function get_all_reviews(bool $include_deleted = false): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $sql = "SELECT * FROM $table";
        if (! $include_deleted) {
            $sql .= " WHERE deleted_at IS NULL";
        }
        $sql .= " ORDER BY created_at DESC";

        return $wpdb->get_results($sql, ARRAY_A);
    }

    /**
     * Insert a new review.
     */
    public function add_review(array $data)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $insert = $wpdb->insert($table, $data);
        if ($insert === false) {
            error_log('[ZorgFinder Reviews] Insert failed: ' . $wpdb->last_error);
            return false;
        }
        return $wpdb->insert_id;
    }

    /**
     * Update review fields (admin).
     */
    public function update_review(int $id, array $data): bool
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $updated = $wpdb->update($table, $data, ['id' => $id]);
        if ($updated === false) {
            error_log('[ZorgFinder Reviews] Update failed: ' . $wpdb->last_error);
            return false;
        }
        return true;
    }

    /**
     * Soft delete a review (mark deleted_at timestamp).
     */
    public function delete_review(int $id): bool
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $deleted = $wpdb->update($table, [
            'deleted_at' => current_time('mysql')
        ], ['id' => $id]);

        if ($deleted === false) {
            error_log('[ZorgFinder Reviews] Soft delete failed: ' . $wpdb->last_error);
            return false;
        }
        return true;
    }

    /**
     * Restore a soft-deleted review (admin only).
     */
    public function restore_review(int $id): bool
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $restored = $wpdb->update($table, ['deleted_at' => null], ['id' => $id]);
        return $restored !== false;
    }

    /**
     * Get average rating for approved, non-deleted reviews.
     */
    public function get_average_rating(int $provider_id): float
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $avg = $wpdb->get_var($wpdb->prepare(
            "SELECT AVG(rating) FROM $table WHERE provider_id = %d AND approved = 1 AND deleted_at IS NULL",
            $provider_id
        ));

        return $avg !== null ? (float) $avg : 0.0;
    }
}
