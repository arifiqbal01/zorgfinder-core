<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ReviewsController extends BaseController
{
    public function register_routes()
    {
        // List (paginated)
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

        // Single + update + delete
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

        // Restore (admin)
        register_rest_route($this->namespace, '/reviews/(?P<id>\d+)/restore', [
            [
                'methods'  => 'PATCH',
                'callback' => [$this, 'restore_review'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    /**
     * Helper: Determine whether incoming request should be treated as ADMIN.
     * Uses X-WP-Nonce header + capability check. This is deterministic and secure.
     */
   protected function request_is_admin(WP_REST_Request $request): bool
{
    // --- Safety: allow debug override only on local development ---
    $debug_override = filter_var(get_option('zorg_debug_admin_override', false), FILTER_VALIDATE_BOOLEAN);

    // Read incoming nonce (header or _wpnonce param)
    $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');

    // Basic info snapshot to log
    $info = [
        'time' => current_time('mysql'),
        'nonce_present' => $nonce ? true : false,
        'nonce_value' => $nonce ? substr($nonce, 0, 8) . '...' : null, // don't fully dump
        'is_user_logged_in_before' => is_user_logged_in(),
        'current_user_id_before' => get_current_user_id(),
        'cap_before' => current_user_can('edit_others_posts'),
    ];

    // Verify nonce if provided
    $nonce_ok = $nonce && wp_verify_nonce($nonce, 'wp_rest');
    $info['nonce_verified'] = $nonce_ok;

    // After wp_verify_nonce, WP should authenticate cookie user for REST.
    // Check capability now.
    $cap_after = current_user_can('edit_others_posts');
    $info['cap_after'] = $cap_after;
    $info['user_id_after'] = get_current_user_id();

    // Write to debug log (wp-content/debug.log) if WP_DEBUG and WP_DEBUG_LOG enabled
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('[ZORG-ADMIN-DETECT] ' . wp_json_encode($info));
    }

    // If explicit debug request param is present, include details in REST response:
    if ($request->get_param('__debug') == '1') {
        return new WP_REST_Response([
            'success' => true,
            'debug' => $info,
            'is_admin' => ($nonce_ok && $cap_after) || ($cap_after && is_user_logged_in())
        ], 200);
    }

    // If debug override option is enabled (ONLY use on local) treat as admin
    if ($debug_override) {
        return true;
    }

    // Normal admin detection:
    if ($nonce_ok) {
        // If nonce validated, rely on capability check (current_user_can()).
        return $cap_after;
    }

    // Fallback to cookie-authenticated user (if logged in)
    if (is_user_logged_in() && current_user_can('edit_others_posts')) {
        return true;
    }

    return false;
}

    /**
     * LIST — PAGINATED
     *
     * Query params:
     * - provider_id (int)
     * - approved (0|1)
     * - search (string)
     * - rating (1-5)
     * - trashed (0|1)
     * - sort (newest|oldest|highest|lowest)
     * - page, per_page
     */
   public function get_reviews(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    global $wpdb;

    $table           = $wpdb->prefix . 'zf_reviews';
    $providers_table = $wpdb->prefix . 'zf_providers';

    // Params
    $provider_id = $request->get_param('provider_id') ? (int)$request->get_param('provider_id') : null;
    $approved_raw = $request->get_param('approved'); // "0", "1", null
    $search      = $request->get_param('search');
    $rating      = $request->get_param('rating') !== null ? (int)$request->get_param('rating') : null;
    $trashed     = intval($request->get_param('trashed')) === 1 ? 1 : 0;
    $sort        = $request->get_param('sort') ?: 'newest';

    // Fix: detect admin correctly
    $is_admin_request = $this->request_is_admin($request);

    // WHERE clause
    $where = $trashed ? "WHERE deleted_at IS NOT NULL" : "WHERE deleted_at IS NULL";

    // Provider filter
    if ($provider_id) {
        $where .= $wpdb->prepare(" AND provider_id = %d", $provider_id);
    }

    // APPROVED filter (correct handling for "0")
    if ($is_admin_request) {
        if ($approved_raw !== null && $approved_raw !== '') {
            $where .= $wpdb->prepare(" AND approved = %d", (int)$approved_raw);
        }
    } else {
        // Public: only approved reviews
        $where .= " AND approved = 1";
    }

    // Rating filter
    if ($rating !== null && in_array($rating, [1,2,3,4,5], true)) {
        $where .= $wpdb->prepare(" AND rating = %d", $rating);
    }

    // Search filter
    if ($search) {
        $like = '%' . $wpdb->esc_like($search) . '%';
        $where .= $wpdb->prepare("
            AND (
                comment LIKE %s
                OR CAST(user_id AS CHAR) LIKE %s
                OR EXISTS (
                    SELECT 1 FROM $providers_table p
                    WHERE p.id = $table.provider_id
                    AND p.name LIKE %s
                )
            )
        ", $like, $like, $like);
    }

    // Sorting
    switch ($sort) {
        case 'oldest':
            $order = "ORDER BY created_at ASC"; break;
        case 'highest':
            $order = "ORDER BY rating DESC, created_at DESC"; break;
        case 'lowest':
            $order = "ORDER BY rating ASC, created_at DESC"; break;
        default:
            $order = "ORDER BY created_at DESC";
    }

    // Pagination
    $page     = max(1, (int)$request->get_param('page'));
    $per_page = max(1, (int)$request->get_param('per_page')) ?: 10;
    $offset   = ($page - 1) * $per_page;

    // Total count
    $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table $where");

    // Fetch rows
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

        // If review is unapproved, check access: only admin (nonce + capability) can view it.
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
     * CREATE
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
        $rating      = (int) $request->get_param('rating');
        $raw_comment = $request->get_param('comment');
        $comment     = sanitize_textarea_field(wp_strip_all_tags((string)$raw_comment, true));

        if (! $provider_id || $rating < 1 || $rating > 5) {
            return new WP_Error('invalid_input', 'Provider ID and rating (1–5) are required', ['status' => 400]);
        }

        // By default new reviews are pending (approved = 0). Auto-approve only if option enabled.
        $approved = get_option('zorg_reviews_auto_approve', 0) ? 1 : 0;

        $data = [
            'provider_id' => $provider_id,
            'user_id'     => get_current_user_id(),
            'rating'      => $rating,
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

        // Return fresh single review (admin check included)
        $req = new \WP_REST_Request('GET', "/{$this->namespace}/reviews/{$id}");
        // pass same nonce through so get_review can check access if needed
        $req->set_header('x-wp-nonce', $nonce);
        $req->set_param('id', $id);
        return $this->get_review($req);
    }

    /**
     * UPDATE (admin only)
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

        if ($request->get_param('rating') !== null) {
            $rating = (int)$request->get_param('rating');
            if ($rating < 1 || $rating > 5) {
                return new WP_Error('invalid_rating', 'Rating must be between 1 and 5', ['status' => 400]);
            }
            $fields['rating'] = $rating;
        }

        if ($request->get_param('comment') !== null) {
            $fields['comment'] = sanitize_textarea_field(wp_strip_all_tags((string)$request->get_param('comment'), true));
        }

        // allow admin to set approved flag explicitly
        if ($request->get_param('approved') !== null) {
            $fields['approved'] = (int)$request->get_param('approved');
        }

        if (empty($fields)) {
            return new WP_Error('no_changes', 'No valid fields provided', ['status' => 400]);
        }

        $fields['updated_at'] = current_time('mysql');

        $updated = $wpdb->update($table, $fields, ['id' => $id]);

        if ($updated === false) {
            return new WP_Error('update_failed', 'Failed to update review', ['status' => 500]);
        }

        // Return fresh single review (admin detection uses incoming request headers)
        $req = new \WP_REST_Request('GET', "/{$this->namespace}/reviews/{$id}");
        // forward nonce header if present
        $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');
        if ($nonce) {
            $req->set_header('x-wp-nonce', $nonce);
        }
        $req->set_param('id', $id);
        return $this->get_review($req);
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

    /**
     * Require logged-in user for creating reviews
     */
    public function require_auth(): bool|\WP_Error
    {
        if (! is_user_logged_in()) {
            return new WP_Error('rest_forbidden', 'You must be logged in to perform this action.', ['status' => 401]);
        }
        return true;
    }

    /**
     * Admin check
     */
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
