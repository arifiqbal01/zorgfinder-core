<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ReviewsController extends BaseController
{
    /* ==========================================================
     * ROUTES
     * ======================================================== */

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

    /* ==========================================================
     * ADMIN CHECK (RESTORED – FIXES 500)
     * ======================================================== */

    protected function request_is_admin(WP_REST_Request $request): bool
    {
        $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');

        if ($nonce && wp_verify_nonce($nonce, 'wp_rest')) {
            return current_user_can('edit_others_posts');
        }

        return is_user_logged_in() && current_user_can('edit_others_posts');
    }

    /* ==========================================================
     * SNAPSHOT REBUILD (NEW – CORE FIX)
     * ======================================================== */

    protected function rebuild_provider_snapshot(int $provider_id): void
    {
        global $wpdb;

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT
                    AVG(rating_overall) AS avg_rating,
                    COUNT(*) AS review_count
                 FROM {$wpdb->prefix}zf_reviews
                 WHERE provider_id = %d
                   AND approved = 1
                   AND deleted_at IS NULL",
                $provider_id
            ),
            ARRAY_A
        );

        $wpdb->replace(
            "{$wpdb->prefix}zf_provider_snapshot",
            [
                'provider_id'  => $provider_id,
                'avg_rating'   => round((float)($row['avg_rating'] ?? 0), 1),
                'review_count' => (int)($row['review_count'] ?? 0),
                'has_reviews'  => (int)(($row['review_count'] ?? 0) > 0),
                'updated_at'   => current_time('mysql'),
            ],
            ['%d', '%f', '%d', '%d', '%s']
        );
    }

    /* ==========================================================
     * LIST (UNCHANGED EXCEPT ADMIN CHECK)
     * ======================================================== */

    public function get_reviews(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $table = $wpdb->prefix . 'zf_reviews';

        $provider_id = $request->get_param('provider_id');
        $rating      = $request->get_param('rating');
        $trashed     = (int)$request->get_param('trashed') === 1;
        $sort        = $request->get_param('sort') ?: 'newest';

        $is_admin = $this->request_is_admin($request);

        $where = $trashed
            ? "WHERE deleted_at IS NOT NULL"
            : "WHERE deleted_at IS NULL";

        if ($provider_id) {
            $where .= $wpdb->prepare(" AND provider_id = %d", (int)$provider_id);
        }

        if (!$is_admin) {
            $where .= " AND approved = 1";
        }

        if ($rating !== null) {
            $where .= $wpdb->prepare(
                " AND rating_overall = %s",
                number_format((float)$rating, 1, '.', '')
            );
        }

        $order = match ($sort) {
            'oldest'  => "ORDER BY created_at ASC",
            'highest' => "ORDER BY rating_overall DESC, created_at DESC",
            'lowest'  => "ORDER BY rating_overall ASC, created_at DESC",
            default   => "ORDER BY created_at DESC",
        };

        $page     = max(1, (int)$request->get_param('page'));
        $per_page = max(1, (int)$request->get_param('per_page')) ?: 10;
        $offset   = ($page - 1) * $per_page;

        $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table $where");

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table $where $order LIMIT %d OFFSET %d",
                $per_page,
                $offset
            ),
            ARRAY_A
        );

        return $this->respond([
            'success'  => true,
            'data'     => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
            'pages'    => ceil($total / $per_page),
        ]);
    }

    /* ==========================================================
     * SINGLE (UNCHANGED)
     * ======================================================== */

    public function get_review(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id    = (int)$request->get_param('id');
        $table = $wpdb->prefix . 'zf_reviews';

        $review = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id),
            ARRAY_A
        );

        if (!$review) {
            return $this->error('Review not found', 404);
        }

        if ((int)$review['approved'] === 0 && ! $this->request_is_admin($request)) {
            return new WP_Error('rest_forbidden', 'Review not approved', ['status' => 403]);
        }

        return $this->respond(['success' => true, 'data' => $review]);
    }

    /* ==========================================================
     * CREATE (SNAPSHOT IF AUTO-APPROVED)
     * ======================================================== */

    public function create_review(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $provider_id = (int)$request->get_param('provider_id');
        if (!$provider_id) {
            return new WP_Error('missing_provider', 'Provider required', ['status' => 400]);
        }

        $ratings = [
            (int)$request->get_param('rating_staff'),
            (int)$request->get_param('rating_communication'),
            (int)$request->get_param('rating_cleanliness'),
            (int)$request->get_param('rating_facilities'),
            (int)$request->get_param('rating_professionalism'),
        ];

        foreach ($ratings as $r) {
            if ($r < 1 || $r > 5) {
                return new WP_Error('invalid_rating', 'Ratings must be between 1 and 5', ['status' => 400]);
            }
        }

        $overall = round(array_sum($ratings) / count($ratings), 1);
        $approved = get_option('zorg_reviews_auto_approve', 0) ? 1 : 0;

        $wpdb->insert(
            $wpdb->prefix . 'zf_reviews',
            [
                'provider_id'            => $provider_id,
                'user_id'                => get_current_user_id(),
                'source'                 => 'internal',
                'rating_overall'         => $overall,
                'rating_staff'           => $ratings[0],
                'rating_communication'   => $ratings[1],
                'rating_cleanliness'     => $ratings[2],
                'rating_facilities'      => $ratings[3],
                'rating_professionalism' => $ratings[4],
                'comment'                => sanitize_textarea_field($request->get_param('comment')),
                'approved'               => $approved,
                'created_at'             => current_time('mysql'),
                'updated_at'             => current_time('mysql'),
            ]
        );

        if ($approved === 1) {
            $this->rebuild_provider_snapshot($provider_id);
        }

        return $this->respond(['success' => true], 201);
    }

    /* ==========================================================
     * UPDATE (APPROVE / UNAPPROVE + SNAPSHOT)
     * ======================================================== */

    public function update_review(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $id = (int)$request->get_param('id');
        $table = $wpdb->prefix . 'zf_reviews';

        $approved = $request->get_param('approved');

        if ($approved !== null) {
            $wpdb->update(
                $table,
                ['approved' => (int)$approved],
                ['id' => $id]
            );

            $provider_id = (int)$wpdb->get_var(
                $wpdb->prepare("SELECT provider_id FROM $table WHERE id = %d", $id)
            );

            if ($provider_id) {
                $this->rebuild_provider_snapshot($provider_id);
            }

            return $this->respond(['success' => true]);
        }

        return parent::update_review($request);
    }
}
