<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

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
        if (empty($ids)) {
            return $this->error('No provider IDs provided', 400);
        }

        $placeholders = implode(',', array_fill(0, count($ids), '%d'));

        /* -----------------------------
         * 2. Load provider base info
         * ----------------------------- */
        $providers_table = $wpdb->prefix . 'zf_providers';

        $providers = $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM $providers_table WHERE id IN ($placeholders) AND deleted_at IS NULL", ...$ids),
            ARRAY_A
        );

        if (empty($providers)) {
            return $this->error('No providers found', 404);
        }

        /* -----------------------------
         * 3. Load reimbursements
         * ----------------------------- */
        $reimb_table = $wpdb->prefix . 'zf_reimbursements';

        $reimb_rows = $wpdb->get_results(
            $wpdb->prepare("
                SELECT * FROM $reimb_table 
                WHERE provider_id IN ($placeholders)
                AND deleted_at IS NULL
            ", ...$ids),
            ARRAY_A
        );

        $reimbursements_by_provider = [];
        foreach ($reimb_rows as $r) {
            $reimbursements_by_provider[$r['provider_id']][] = $r;
        }

        /* -----------------------------
         * 4. Load reviews (average + count)
         * ----------------------------- */
        $reviews_table = $wpdb->prefix . 'zf_reviews';

        $review_stats = $wpdb->get_results(
            $wpdb->prepare("
                SELECT provider_id,
                       AVG(rating) as avg_rating,
                       COUNT(*) as total_reviews
                FROM $reviews_table
                WHERE provider_id IN ($placeholders)
                AND approved = 1
                AND deleted_at IS NULL
                GROUP BY provider_id
            ", ...$ids),
            ARRAY_A
        );

        $reviews_by_provider = [];
        foreach ($review_stats as $s) {
            $reviews_by_provider[$s['provider_id']] = [
                'avg_rating' => round((float)$s['avg_rating'], 2),
                'total'      => (int)$s['total_reviews']
            ];
        }

        /* -----------------------------
         * 5. Favourite status (per user)
         * ----------------------------- */
        $favourites_by_provider = [];

        if (is_user_logged_in()) {
            $fav_table = $wpdb->prefix . 'zf_favourites';
            $user_id = get_current_user_id();

            $fav_rows = $wpdb->get_results(
                $wpdb->prepare("
                    SELECT provider_id 
                    FROM $fav_table 
                    WHERE user_id = %d
                    AND provider_id IN ($placeholders)
                    AND deleted_at IS NULL
                ", $user_id, ...$ids),
                ARRAY_A
            );

            foreach ($fav_rows as $f) {
                $favourites_by_provider[$f['provider_id']] = true;
            }
        }

        /* -----------------------------
         * 6. Appointment info
         * (next available date + taken slots)
         * ----------------------------- */
        $appoint_table = $wpdb->prefix . 'zf_appointments';

        $appointment_data = [];

        foreach ($ids as $pid) {
            $next_date = $wpdb->get_var(
                $wpdb->prepare("
                    SELECT preferred_date 
                    FROM $appoint_table
                    WHERE provider_id = %d
                    AND deleted_at IS NULL
                    ORDER BY preferred_date ASC
                    LIMIT 1
                ", $pid)
            );

            $taken_slots = [];
            if ($next_date) {
                $taken_slots = $wpdb->get_col(
                    $wpdb->prepare("
                        SELECT time_slot 
                        FROM $appoint_table
                        WHERE provider_id = %d
                        AND preferred_date = %s
                        AND deleted_at IS NULL
                    ", $pid, $next_date)
                );
            }

            $appointment_data[$pid] = [
                'next_available_date' => $next_date,
                'taken_slots'         => $taken_slots
            ];
        }

        /* -----------------------------
         * 7. Assemble final comparison data
         * ----------------------------- */
        $final = [];
        foreach ($providers as $p) {
            $pid = $p['id'];

            $final[] = [
                'id'                => $pid,
                'name'              => $p['name'],
                'slug'              => $p['slug'],
                'type_of_care'      => $p['type_of_care'],
                'indication_type'   => $p['indication_type'],
                'organization_type' => $p['organization_type'],
                'religion'          => $p['religion'],
                'has_hkz'           => $p['has_hkz'],
                'address'           => $p['address'],
                'email'             => $p['email'],
                'phone'             => $p['phone'],
                'website'           => $p['website'],

                'reimbursements'    => $reimbursements_by_provider[$pid] ?? [],
                'reviews'           => $reviews_by_provider[$pid] ?? ['avg_rating' => 0, 'total' => 0],
                'is_favourite'      => isset($favourites_by_provider[$pid]),
                'appointments'      => $appointment_data[$pid] ?? null
            ];
        }

        return $this->respond($final);
    }
}
