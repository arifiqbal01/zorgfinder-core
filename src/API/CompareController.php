<?php
namespace ZorgFinder\API;

use WP_REST_Request;

class CompareController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/compare', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'compare_providers'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    /**
     * FULL COMPARISON ENGINE
     * GET /compare?ids=1,2,3
     */
    public function compare_providers(WP_REST_Request $request)
    {
        global $wpdb;

        /* -----------------------------
         * 1. Parse provider IDs
         * ----------------------------- */
        $ids = array_filter(array_map('intval', explode(',', $request->get_param('ids') ?? '')));
        if (count($ids) < 2) {
            return $this->error('At least two providers are required for comparison', 400);
        }

        $placeholders = implode(',', array_fill(0, count($ids), '%d'));

        /* -----------------------------
         * 2. Load providers
         * ----------------------------- */
        $providers_table = $wpdb->prefix . 'zf_providers';

        $providers = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT *
                 FROM $providers_table
                 WHERE id IN ($placeholders)
                   AND deleted_at IS NULL",
                ...$ids
            ),
            ARRAY_A
        );

        if (!$providers) {
            return $this->error('No providers found', 404);
        }

        /* -----------------------------
         * 3. Load reimbursements
         * ----------------------------- */
        $reimb_table = $wpdb->prefix . 'zf_reimbursements';

        $reimb_rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT *
                 FROM $reimb_table
                 WHERE provider_id IN ($placeholders)
                   AND deleted_at IS NULL",
                ...$ids
            ),
            ARRAY_A
        );

        $reimbursements_by_provider = [];
        foreach ($reimb_rows as $r) {
            $reimbursements_by_provider[$r['provider_id']][] = $r;
        }

        /* -----------------------------
         * 4. Load detailed review stats
         * ----------------------------- */
        $reviews_table = $wpdb->prefix . 'zf_reviews';

        $review_stats = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT
                    provider_id,
                    AVG(rating_overall)         AS avg_overall,
                    AVG(rating_staff)           AS avg_staff,
                    AVG(rating_communication)   AS avg_communication,
                    AVG(rating_cleanliness)     AS avg_cleanliness,
                    AVG(rating_facilities)      AS avg_facilities,
                    AVG(rating_professionalism) AS avg_professionalism,
                    COUNT(*)                    AS total_reviews
                 FROM $reviews_table
                 WHERE provider_id IN ($placeholders)
                   AND approved = 1
                   AND deleted_at IS NULL
                 GROUP BY provider_id",
                ...$ids
            ),
            ARRAY_A
        );

        $reviews_by_provider = [];
        foreach ($review_stats as $r) {
            $reviews_by_provider[$r['provider_id']] = [
                'overall'         => round((float) $r['avg_overall'], 1),
                'staff'           => round((float) $r['avg_staff'], 1),
                'communication'   => round((float) $r['avg_communication'], 1),
                'cleanliness'     => round((float) $r['avg_cleanliness'], 1),
                'facilities'      => round((float) $r['avg_facilities'], 1),
                'professionalism' => round((float) $r['avg_professionalism'], 1),
                'count'           => (int) $r['total_reviews'],
            ];
        }

        /* -----------------------------
         * 5. Favourite status
         * ----------------------------- */
        $favourites_by_provider = [];

        if (is_user_logged_in()) {
            $fav_table = $wpdb->prefix . 'zf_favourites';
            $uid = get_current_user_id();

            $fav_rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT provider_id
                     FROM $fav_table
                     WHERE user_id = %d
                       AND provider_id IN ($placeholders)
                       AND deleted_at IS NULL",
                    $uid,
                    ...$ids
                ),
                ARRAY_A
            );

            foreach ($fav_rows as $f) {
                $favourites_by_provider[(int) $f['provider_id']] = true;
            }
        }

        /* -----------------------------
         * 6. Assemble final payload
         * ----------------------------- */
        $final = [];

        foreach ($providers as $p) {
            $pid = (int) $p['id'];

            $final[] = [
                'id'                => $pid,
                'provider'          => $p['provider'],
                'slug'              => $p['slug'],

                'type_of_care'      => $p['type_of_care'],
                'indication_type'   => $p['indication_type'],
                'organization_type' => $p['organization_type'],
                'religion'          => $p['religion'],
                'has_hkz'           => (int) $p['has_hkz'],

                'target_genders'    => json_decode($p['target_genders'] ?? '[]', true),
                'target_age_groups' => json_decode($p['target_age_groups'] ?? '[]', true),

                'address'           => $p['address'],
                'email'             => $p['email'],
                'phone'             => $p['phone'],
                'website'           => $p['website'],

                'reimbursements'    => $reimbursements_by_provider[$pid] ?? [],
                'reviews'           => $reviews_by_provider[$pid] ?? [
                    'overall' => 0,
                    'staff' => 0,
                    'communication' => 0,
                    'cleanliness' => 0,
                    'facilities' => 0,
                    'professionalism' => 0,
                    'count' => 0,
                ],

                'is_favourite'      => isset($favourites_by_provider[$pid]),
            ];
        }

        return $this->respond($final);
    }
}
