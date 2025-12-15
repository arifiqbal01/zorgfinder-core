<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class FrontendProvidersController extends BaseController
{
    private array $allowed_filters = [
        'type_of_care',
        'indication_type',
        'organization_type',
        'religion',
    ];

    public function register_routes()
    {
        register_rest_route($this->namespace, '/frontend/providers', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_full_providers'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    public function get_full_providers(WP_REST_Request $req)
    {
        global $wpdb;

        /* PAGINATION */
        $page     = max(1, (int)$req->get_param('page'));
        $per_page = max(1, (int)$req->get_param('per_page') ?: 12);
        $offset   = ($page - 1) * $per_page;

        $search   = $req->get_param('search');
        $sort     = $req->get_param('sort');

        $table = $wpdb->prefix . "zf_providers";
        $snap  = $wpdb->prefix . "zf_provider_snapshot";

        $where = "WHERE p.deleted_at IS NULL";

        /* ================================
           SEARCH
        ================================= */
        if ($search) {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where .= $wpdb->prepare("
                AND (
                    p.provider LIKE %s
                    OR p.email LIKE %s
                    OR p.phone LIKE %s
                    OR p.slug LIKE %s
                    OR s.search_blob LIKE %s
                )
            ", $like, $like, $like, $like, $like);
        }

        /* ================================
           SAFE ENUM FILTERS
        ================================= */
        foreach ($this->allowed_filters as $field) {
            $val = $req->get_param($field);
            if ($val !== null && $val !== '') {
                $where .= $wpdb->prepare(" AND p.$field = %s", sanitize_text_field($val));
            }
        }

        /* ================================
           HKZ FILTER
        ================================= */
        $hkz = $req->get_param('has_hkz');
        if ($hkz === "1") {
            $where .= " AND p.has_hkz = 1";
        } elseif ($hkz === "0") {
            $where .= " AND p.has_hkz = 0";
        }

        /* ================================
           JSON FILTERS (NOW USING SNAPSHOT JSON)
        ================================= */
        $gender = $req->get_param('target_genders');
        if ($this->is_valid_filter_value($gender)) {
            $val = is_array($gender) ? $gender[0] : $gender;
            $where .= $wpdb->prepare(
                " AND JSON_CONTAINS(s.target_genders_json, %s)",
                wp_json_encode($val)
            );
        }

        $age = $req->get_param('target_age_groups');
        if ($this->is_valid_filter_value($age)) {
            $val = is_array($age) ? $age[0] : $age;
            $where .= $wpdb->prepare(
                " AND JSON_CONTAINS(s.target_age_groups_json, %s)",
                wp_json_encode($val)
            );
        }

        /* ================================
           REIMBURSEMENT FILTER (USING SNAPSHOT)
        ================================= */
        if ($rt = $req->get_param('reimbursement_type')) {
            $where .= $wpdb->prepare("
                AND JSON_CONTAINS(
                    s.reimbursements_json,
                    %s,
                    '$[*].type'
                )
            ", wp_json_encode($rt));
        }

        /* ================================
           SORTING
        ================================= */
        $order = match ($sort) {
            "name_asc"  => "ORDER BY p.provider ASC",
            "name_desc" => "ORDER BY p.provider DESC",
            "oldest"    => "ORDER BY p.created_at ASC",
            default     => "ORDER BY p.created_at DESC",
        };

        /* ================================
           TOTAL COUNT
        ================================= */
        $total = (int)$wpdb->get_var("
            SELECT COUNT(*)
            FROM $table p
            LEFT JOIN $snap s ON s.provider_id = p.id
            $where
        ");

        /* ================================
           GET PROVIDERS (MAIN SNAPSHOT QUERY)
        ================================= */
        $providers = $wpdb->get_results(
            $wpdb->prepare("
                SELECT p.*, 
                       s.avg_rating,
                       s.review_count,
                       s.has_reviews AS snapshot_has_reviews,
                       s.reimbursements_json,
                       s.target_genders_json,
                       s.target_age_groups_json
                FROM $table p
                LEFT JOIN $snap s ON s.provider_id = p.id
                $where
                $order
                LIMIT %d OFFSET %d
            ", $per_page, $offset),
            ARRAY_A
        );

        if (!$providers) {
            return $this->respond([
                "success" => true,
                "data"    => [],
                "total"   => 0,
                "page"    => $page,
                "pages"   => 0,
            ]);
        }

        /* ================================
           FAVORITES (KEPT)
        ================================= */
        $fid_map = [];

        if (is_user_logged_in()) {
            $uid = get_current_user_id();
            $ids = array_column($providers, 'id');
            $ph  = implode(',', array_fill(0, count($ids), '%d'));

            $fav = $wpdb->get_results(
                $wpdb->prepare("
                    SELECT provider_id 
                    FROM {$wpdb->prefix}zf_favourites
                    WHERE user_id = %d
                      AND provider_id IN ($ph)
                ", $uid, ...$ids),
                ARRAY_A
            );

            foreach ($fav as $f) {
                $fid_map[(int)$f['provider_id']] = true;
            }
        }

        /* ================================
           BUILD RESPONSE
        ================================= */
        $result = [];

        foreach ($providers as $p) {
            $result[] = [
                'id'                => $p['id'],
                'provider'          => $p['provider'],
                'slug'              => $p['slug'],

                'type_of_care'      => $p['type_of_care'],
                'indication_type'   => $p['indication_type'],
                'organization_type' => $p['organization_type'],
                'religion'          => $p['religion'],
                'has_hkz'           => (int)$p['has_hkz'],

                'target_age_groups' => json_decode($p['target_age_groups_json'] ?? '[]', true),
                'target_genders'    => json_decode($p['target_genders_json'] ?? '[]', true),

                'address'           => $p['address'],
                'email'             => $p['email'],
                'phone'             => $p['phone'],
                'website'           => $p['website'],
                'logo'              => $p['logo'] ?? null,

                'reviews'           => [
                    'overall' => (float)($p['avg_rating'] ?? 0),
                    'count'   => (int)($p['review_count'] ?? 0),
                ],

                'reimbursements'    => json_decode($p['reimbursements_json'], true) ?? [],

                'is_favourite'      => isset($fid_map[$p['id']]),
            ];
        }

        return $this->respond([
            "success"  => true,
            "data"     => $result,
            "total"    => $total,
            "page"     => $page,
            "per_page" => $per_page,
            "pages"    => ceil($total / $per_page),
        ]);
    }

    private function is_valid_filter_value($val): bool
    {
        if ($val === null) return false;
        if (is_string($val)) {
            $v = trim($val);
            return !($v === '' || strtolower($v) === 'any' || strtolower($v) === 'all');
        }
        if (is_array($val)) {
            if (!count($val)) return false;
            $first = $val[0];
            if ($first === null) return false;
            if (is_string($first)) {
                $f = trim($first);
                return !($f === '' || strtolower($f) === 'any' || strtolower($f) === 'all');
            }
            return true;
        }
        return true;
    }
}
