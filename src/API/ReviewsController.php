<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ReviewsController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/reviews', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_reviews'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'  => 'POST',
                'callback' => [$this, 'create_review'],
                'permission_callback' => [$this, 'require_auth'],
            ],
        ]);

        register_rest_route($this->namespace, '/reviews/(?P<id>\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_review'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'  => ['PUT','PATCH'],
                'callback' => [$this, 'update_review'],
                'permission_callback' => [$this, 'require_admin'],
            ],
            [
                'methods'  => 'DELETE',
                'callback' => [$this, 'delete_review'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        register_rest_route($this->namespace, '/reviews/(?P<id>\d+)/restore', [
            [
                'methods'  => 'PATCH',
                'callback' => [$this, 'restore_review'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }
protected function request_is_admin(WP_REST_Request $request): bool
{
    // Allow local override for dev tools
    $debug_override = filter_var(get_option('zorg_debug_admin_override', false), FILTER_VALIDATE_BOOLEAN);

    // Nonce from header or param
    $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');

    // Verify nonce if present
    $nonce_ok = $nonce && wp_verify_nonce($nonce, 'wp_rest');

    // Capability check after nonce auth
    $cap_after = current_user_can('edit_others_posts');

    // Debug override
    if ($debug_override) {
        return true;
    }

    // Valid nonce → rely on capability
    if ($nonce_ok) {
        return $cap_after;
    }

    // Cookie fallback
    if (is_user_logged_in() && current_user_can('edit_others_posts')) {
        return true;
    }

    return false;
}

    /**
     * LIST — paginated
     */
    public function get_reviews(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $table           = $wpdb->prefix . 'zf_reviews';
        $providers_table = $wpdb->prefix . 'zf_providers';

        $provider_id = $request->get_param('provider_id') ? (int)$request->get_param('provider_id') : null;
        $approved_raw = $request->get_param('approved'); // "0", "1", null
        $search      = $request->get_param('search');
        $rating      = $request->get_param('rating') !== null ? (float)$request->get_param('rating') : null;
        $trashed     = intval($request->get_param('trashed')) === 1 ? 1 : 0;
        $sort        = $request->get_param('sort') ?: 'newest';

        $is_admin_request = $this->request_is_admin($request);

        $where = $trashed ? "WHERE deleted_at IS NOT NULL" : "WHERE deleted_at IS NULL";

        if ($provider_id) {
            $where .= $wpdb->prepare(" AND provider_id = %d", $provider_id);
        }

        if ($is_admin_request) {
            if ($approved_raw !== null && $approved_raw !== '') {
                $where .= $wpdb->prepare(" AND approved = %d", (int)$approved_raw);
            }
        } else {
            $where .= " AND approved = 1";
        }

        if ($rating !== null && $rating >= 1 && $rating <= 5) {
            // allow decimal filter (e.g. 4.2)
            $where .= $wpdb->prepare(" AND rating_overall = %s", number_format((float)$rating, 1, '.', ''));
        }

        if ($search) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where .= $wpdb->prepare("
                AND (
                    comment LIKE %s
                    OR CAST(user_id AS CHAR) LIKE %s
                    OR EXISTS (
                        SELECT 1 FROM $providers_table p
                        WHERE p.id = {$table}.provider_id
                        AND p.provider LIKE %s
                    )
                )
            ", $like, $like, $like);
        }

        switch ($sort) {
            case 'oldest':
                $order = "ORDER BY created_at ASC"; break;
            case 'highest':
                $order = "ORDER BY rating_overall DESC, created_at DESC"; break;
            case 'lowest':
                $order = "ORDER BY rating_overall ASC, created_at DESC"; break;
            default:
                $order = "ORDER BY created_at DESC";
        }

        $page     = max(1, (int)$request->get_param('page'));
        $per_page = max(1, (int)$request->get_param('per_page')) ?: 10;
        $offset   = ($page - 1) * $per_page;

        $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table $where");

        $rows = $wpdb->get_results(
            $wpdb->prepare("
                SELECT * FROM $table
                $where
                $order
                LIMIT %d OFFSET %d
            ", $per_page, $offset),
            ARRAY_A
        );

        return new WP_REST_Response([
            'success'  => true,
            'data'     => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
            'pages'    => $per_page ? ceil($total / $per_page) : 0,
        ], 200);
    }

    /**
     * SINGLE REVIEW
     */
    public function get_review(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $id    = (int)$request->get_param('id');
        $table = $wpdb->prefix . 'zf_reviews';

        $review = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id),
            ARRAY_A
        );

        if (! $review) {
            return $this->error("Review not found", 404);
        }

        $is_admin_request = $this->request_is_admin($request);
        if ((int)$review['approved'] === 0 && ! $is_admin_request) {
            return new WP_Error('rest_forbidden', 'You cannot view unapproved reviews.', ['status' => 403]);
        }

        return new WP_REST_Response([
            'success' => true,
            'data'    => $review,
        ], 200);
    }

    /**
     * CREATE — user must be logged in
     */
    public function create_review(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        if (! is_user_logged_in()) {
            return new WP_Error('rest_forbidden', 'You must be logged in to submit reviews', ['status' => 401]);
        }

        $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');
        if (! $nonce || ! wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Invalid or missing nonce', ['status' => 403]);
        }

        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';

        $provider_id = (int) $request->get_param('provider_id');

        // detailed ratings
        $r_staff = (int)$request->get_param('rating_staff');
        $r_comm  = (int)$request->get_param('rating_communication');
        $r_clean = (int)$request->get_param('rating_cleanliness');
        $r_fac   = (int)$request->get_param('rating_facilities');
        $r_prof  = (int)$request->get_param('rating_professionalism');

        $raw_comment = $request->get_param('comment');
        $comment     = $raw_comment !== null ? sanitize_textarea_field(wp_strip_all_tags((string)$raw_comment, true)) : null;

        if (!$provider_id) {
            return new WP_Error('invalid_input', 'provider_id is required', ['status' => 400]);
        }

        // Require all detailed ratings present and in 1-5
        $detailed = [$r_staff, $r_comm, $r_clean, $r_fac, $r_prof];
        foreach ($detailed as $v) {
            if ($v < 1 || $v > 5) {
                return new WP_Error('invalid_rating', 'All detailed ratings must be integers between 1 and 5', ['status' => 400]);
            }
        }

        // Calculate overall (rounded to 1 decimal)
        $overall = round(array_sum($detailed) / count($detailed), 1);

        $approved = get_option('zorg_reviews_auto_approve', 0) ? 1 : 0;

        $data = [
            'provider_id' => $provider_id,
            'user_id'     => get_current_user_id(),
            'rating_overall' => $overall,
            'rating_staff' => $r_staff,
            'rating_communication' => $r_comm,
            'rating_cleanliness' => $r_clean,
            'rating_facilities' => $r_fac,
            'rating_professionalism' => $r_prof,
            'comment'     => $comment,
            'approved'    => $approved,
            'created_at'  => current_time('mysql'),
            'deleted_at'  => null,
        ];

        $inserted = $wpdb->insert($table, $data);

        if (! $inserted) {
            return new WP_Error('insert_failed', 'Could not save review', ['status' => 500]);
        }

        $id = (int)$wpdb->insert_id;

        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id), ARRAY_A);

        return new WP_REST_Response([
            'success' => true,
            'data'    => $row,
        ], 201);
    }

    /**
     * UPDATE (admin) — allow updating detailed ratings and auto-recalc overall
     */
    public function update_review(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';
        $id    = (int)$request->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d", $id))) {
            return $this->error("Review not found", 404);
        }

        $fields = [];

        $accept_detailed = false;
        $detailed = [];

        if ($request->get_param('rating_staff') !== null) {
            $v = (int)$request->get_param('rating_staff');
            if ($v < 1 || $v > 5) return new WP_Error('invalid_rating', 'rating_staff must be 1–5', ['status' => 400]);
            $fields['rating_staff'] = $v;
            $accept_detailed = true;
            $detailed[] = $v;
        }

        if ($request->get_param('rating_communication') !== null) {
            $v = (int)$request->get_param('rating_communication');
            if ($v < 1 || $v > 5) return new WP_Error('invalid_rating', 'rating_communication must be 1–5', ['status' => 400]);
            $fields['rating_communication'] = $v;
            $accept_detailed = true;
            $detailed[] = $v;
        }

        if ($request->get_param('rating_cleanliness') !== null) {
            $v = (int)$request->get_param('rating_cleanliness');
            if ($v < 1 || $v > 5) return new WP_Error('invalid_rating', 'rating_cleanliness must be 1–5', ['status' => 400]);
            $fields['rating_cleanliness'] = $v;
            $accept_detailed = true;
            $detailed[] = $v;
        }

        if ($request->get_param('rating_facilities') !== null) {
            $v = (int)$request->get_param('rating_facilities');
            if ($v < 1 || $v > 5) return new WP_Error('invalid_rating', 'rating_facilities must be 1–5', ['status' => 400]);
            $fields['rating_facilities'] = $v;
            $accept_detailed = true;
            $detailed[] = $v;
        }

        if ($request->get_param('rating_professionalism') !== null) {
            $v = (int)$request->get_param('rating_professionalism');
            if ($v < 1 || $v > 5) return new WP_Error('invalid_rating', 'rating_professionalism must be 1–5', ['status' => 400]);
            $fields['rating_professionalism'] = $v;
            $accept_detailed = true;
            $detailed[] = $v;
        }

        if ($request->get_param('comment') !== null) {
            $fields['comment'] = sanitize_textarea_field(wp_strip_all_tags((string)$request->get_param('comment'), true));
        }

        if ($request->get_param('approved') !== null) {
            $fields['approved'] = (int)$request->get_param('approved');
        }

        if (empty($fields) && !$accept_detailed) {
            return new WP_Error('no_changes', 'No valid fields provided', ['status' => 400]);
        }

        // If any detailed ratings provided, we must compute overall from the full set.
        if ($accept_detailed) {
            // Fetch current row to get any missing detailed values
            $current = $wpdb->get_row($wpdb->prepare("SELECT rating_staff, rating_communication, rating_cleanliness, rating_facilities, rating_professionalism FROM $table WHERE id = %d", $id), ARRAY_A);
            $final = [
                'rating_staff' => $fields['rating_staff'] ?? (int)$current['rating_staff'],
                'rating_communication' => $fields['rating_communication'] ?? (int)$current['rating_communication'],
                'rating_cleanliness' => $fields['rating_cleanliness'] ?? (int)$current['rating_cleanliness'],
                'rating_facilities' => $fields['rating_facilities'] ?? (int)$current['rating_facilities'],
                'rating_professionalism' => $fields['rating_professionalism'] ?? (int)$current['rating_professionalism'],
            ];
            $overall = round(array_sum(array_values($final)) / 5, 1);
            $fields['rating_overall'] = $overall;
        }

        $fields['updated_at'] = current_time('mysql');

        $updated = $wpdb->update($table, $fields, ['id' => $id]);

        if ($updated === false) {
            return new WP_Error('update_failed', 'Failed to update review', ['status' => 500]);
        }

        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id), ARRAY_A);

        return new WP_REST_Response([
            'success' => true,
            'data'    => $row,
        ], 200);
    }

    /**
     * DELETE (soft)
     */
    public function delete_review(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';
        $id    = (int)$request->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d", $id))) {
            return $this->error("Review not found", 404);
        }

        $deleted = $wpdb->update($table, [
            'deleted_at' => current_time('mysql')
        ], ['id' => $id]);

        if ($deleted === false) {
            return new WP_Error('delete_failed', 'Failed to delete review', ['status' => 500]);
        }

        return $this->respond(['message' => "Review soft-deleted"]);
    }

    /**
     * RESTORE (admin)
     */
    public function restore_review(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_reviews';
        $id    = (int)$request->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d", $id))) {
            return $this->error("Review not found", 404);
        }

        $restored = $wpdb->update($table, [
            'deleted_at' => null
        ], ['id' => $id]);

        if ($restored === false) {
            return new WP_Error('restore_failed', 'Failed to restore review', ['status' => 500]);
        }

        return $this->respond(['message' => "Review restored"]);
    }

    public function require_auth(): bool|\WP_Error
    {
        if (! is_user_logged_in()) {
            return new WP_Error('rest_forbidden', 'You must be logged in to perform this action.', ['status' => 401]);
        }
        return true;
    }

    public function require_admin(): bool|\WP_Error
    {
        if (! current_user_can('edit_others_posts')) {
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to modify reviews.', 'zorgfinder-core'),
                ['status' => 403]
            );
        }
        return true;
    }
}
