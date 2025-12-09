<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class DashboardController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/dashboard/summary', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_summary'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        register_rest_route($this->namespace, '/dashboard/appointments-trend', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_appointments_trend'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        register_rest_route($this->namespace, '/dashboard/top-providers', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_top_providers'],
            'permission_callback' => [$this, 'require_admin'],
        ]);

        register_rest_route($this->namespace, '/dashboard/distribution', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_distribution_stats'],
            'permission_callback' => [$this, 'require_admin'],
        ]);
    }

    /**
     * SUMMARY CARD DATA
     */
    public function get_summary(WP_REST_Request $request)
    {
        global $wpdb;

        $providers    = "{$wpdb->prefix}zf_providers";
        $apps         = "{$wpdb->prefix}zf_appointments";
        $reviews      = "{$wpdb->prefix}zf_reviews";
        $favourites   = "{$wpdb->prefix}zf_favourites";

        // Totals
        $total_providers     = (int) $wpdb->get_var("SELECT COUNT(*) FROM $providers WHERE deleted_at IS NULL");
        $total_appointments  = (int) $wpdb->get_var("SELECT COUNT(*) FROM $apps WHERE deleted_at IS NULL");
        $total_reviews       = (int) $wpdb->get_var("SELECT COUNT(*) FROM $reviews WHERE deleted_at IS NULL AND approved = 1");
        $total_favourites    = (int) $wpdb->get_var("SELECT COUNT(*) FROM $favourites WHERE deleted_at IS NULL");

        // Appointment statuses
        $confirmed = (int) $wpdb->get_var("SELECT COUNT(*) FROM $apps WHERE status='confirmed' AND deleted_at IS NULL");
        $pending   = (int) $wpdb->get_var("SELECT COUNT(*) FROM $apps WHERE status='pending' AND deleted_at IS NULL");
        $rejected  = (int) $wpdb->get_var("SELECT COUNT(*) FROM $apps WHERE status='rejected' AND deleted_at IS NULL");

        // Average rating (corrected rating column)
        $avg_rating = round((float) $wpdb->get_var("
            SELECT AVG(rating_overall) FROM $reviews 
            WHERE approved=1 AND deleted_at IS NULL
        "), 2);

        // Latest reviews — patched provider column
        $latest_reviews = $wpdb->get_results("
            SELECT r.*, p.provider AS provider_name
            FROM $reviews r
            JOIN $providers p ON p.id = r.provider_id
            WHERE r.deleted_at IS NULL
            ORDER BY r.created_at DESC
            LIMIT 5
        ", ARRAY_A);

        // Latest appointments — patched provider column
        $latest_appointments = $wpdb->get_results("
            SELECT a.*, p.provider AS provider_name, u.display_name AS user_name
            FROM $apps a
            JOIN $providers p ON p.id = a.provider_id
            LEFT JOIN $wpdb->users u ON u.ID = a.user_id
            WHERE a.deleted_at IS NULL
            ORDER BY a.created_at DESC
            LIMIT 5
        ", ARRAY_A);

        return $this->respond([
            "total_providers"     => $total_providers,
            "total_appointments"  => $total_appointments,
            "total_reviews"       => $total_reviews,
            "total_favourites"    => $total_favourites,

            "appointments_status" => [
                "confirmed" => $confirmed,
                "pending"   => $pending,
                "rejected"  => $rejected,
            ],

            "avg_rating"          => $avg_rating,
            "latest_reviews"      => $latest_reviews,
            "latest_appointments" => $latest_appointments,
        ]);
    }

    /**
     * APPOINTMENTS TREND (FOR LINE CHART)
     */
    public function get_appointments_trend(WP_REST_Request $request)
    {
        global $wpdb;

        $days = intval($request->get_param('days')) ?: 30;

        $table = "{$wpdb->prefix}zf_appointments";

        $rows = $wpdb->get_results($wpdb->prepare("
            SELECT DATE(created_at) AS date, COUNT(*) AS count
            FROM $table
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL %d DAY)
            AND deleted_at IS NULL
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ", $days), ARRAY_A);

        return $this->respond([
            "range" => $days,
            "data"  => $rows,
        ]);
    }

    /**
     * TOP PROVIDERS (BY REVIEWS, FAVOURITES, APPOINTMENTS)
     */
    public function get_top_providers(WP_REST_Request $request)
    {
        global $wpdb;

        $providers  = "{$wpdb->prefix}zf_providers";
        $apps       = "{$wpdb->prefix}zf_appointments";
        $reviews    = "{$wpdb->prefix}zf_reviews";
        $favourites = "{$wpdb->prefix}zf_favourites";

        $rows = $wpdb->get_results("
            SELECT 
                p.id,
                p.provider,
                (SELECT COUNT(*) FROM $apps WHERE provider_id = p.id AND deleted_at IS NULL) AS appointments,
                (SELECT COUNT(*) FROM $reviews WHERE provider_id = p.id AND approved = 1 AND deleted_at IS NULL) AS reviews,
                (SELECT COUNT(*) FROM $favourites WHERE provider_id = p.id AND deleted_at IS NULL) AS favourites
            FROM $providers p
            WHERE p.deleted_at IS NULL
            ORDER BY appointments DESC
            LIMIT 10
        ", ARRAY_A);

        return $this->respond($rows);
    }

    /**
     * DISTRIBUTION STATS (DONUT CHARTS)
     */
    public function get_distribution_stats(WP_REST_Request $request)
    {
        global $wpdb;

        $apps = "{$wpdb->prefix}zf_appointments";
        $reim = "{$wpdb->prefix}zf_reimbursements";
        $fav  = "{$wpdb->prefix}zf_favourites";

        // Appointment status %
        $status = $wpdb->get_results("
            SELECT status, COUNT(*) as total
            FROM $apps
            WHERE deleted_at IS NULL
            GROUP BY status
        ", ARRAY_A);

        // Reimbursement type %
        $reim_types = $wpdb->get_results("
            SELECT type, COUNT(*) as total
            FROM $reim
            WHERE deleted_at IS NULL
            GROUP BY type
        ", ARRAY_A);

        // Device analytics (if still stored in favourites)
        $device = $wpdb->get_results("
            SELECT device, COUNT(*) as total
            FROM $fav
            WHERE deleted_at IS NULL
            GROUP BY device
        ", ARRAY_A);

        return $this->respond([
            "appointments_status" => $status,
            "reimbursements_type" => $reim_types,
            "favourites_device"   => $device,
        ]);
    }

    /**
     * ADMIN AUTH CHECK
     */
    public function require_admin(): bool|WP_Error
    {
        $auth = $this->require_auth();
        if (is_wp_error($auth)) {
            return $auth;
        }

        if (!current_user_can('manage_options')) {
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to access dashboard insights.', 'zorgfinder-core'),
                ['status' => 403]
            );
        }

        return true;
    }
}
