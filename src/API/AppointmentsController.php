<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class AppointmentsController extends BaseController
{
    public function register_routes()
    {
        // Collection: list + create
        register_rest_route($this->namespace, '/appointments', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_appointments'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'  => 'POST',
                'callback' => [$this, 'create_appointment'],
                'permission_callback' => [$this, 'require_auth'],
            ],
        ]);

        // Single: view, update, delete
        register_rest_route($this->namespace, '/appointments/(?P<id>\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_appointment'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'  => ['PUT','PATCH'],
                'callback' => [$this, 'update_appointment'],
                'permission_callback' => [$this, 'require_admin'],
            ],
            [
                'methods'  => 'DELETE',
                'callback' => [$this, 'delete_appointment'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        // Restore
        register_rest_route($this->namespace, '/appointments/(?P<id>\d+)/restore', [
            [
                'methods'  => 'PATCH',
                'callback' => [$this, 'restore_appointment'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        // Availability Check (public)
        register_rest_route($this->namespace, '/appointments/availability', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'check_availability'],
                'permission_callback' => '__return_true',
            ],
        ]);

    }

    /**
     * LIST — paginated, filters:
     * - provider_id, user_id, status, date, trashed, search, sort (newest|oldest)
     */
  public function get_appointments(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    global $wpdb;

    $table           = $wpdb->prefix . 'zf_appointments';
    $providers_table = $wpdb->prefix . 'zf_providers';
    $users_table     = $wpdb->users;

    $provider_id = $request->get_param('provider_id') ? (int)$request->get_param('provider_id') : null;
    $user_id     = $request->get_param('user_id') ? (int)$request->get_param('user_id') : null;
    $status      = $request->get_param('status') ?: null;
    $date        = $request->get_param('date') ?: null;
    $search      = $request->get_param('search') ?: null;
    $trashed     = intval($request->get_param('trashed')) === 1 ? 1 : 0;
    $sort        = $request->get_param('sort') ?: 'newest';

    // Base WHERE
    $where = $trashed ? "WHERE a.deleted_at IS NOT NULL" : "WHERE a.deleted_at IS NULL";

    if ($provider_id) {
        $where .= $wpdb->prepare(" AND a.provider_id = %d", $provider_id);
    }

    if ($user_id) {
        $where .= $wpdb->prepare(" AND a.user_id = %d", $user_id);
    }

    if ($status) {
        $allowed = ['pending','confirmed','rejected'];
        if (!in_array($status, $allowed, true)) {
            return $this->error("Invalid status filter", 400);
        }
        $where .= $wpdb->prepare(" AND a.status = %s", $status);
    }

    if ($date) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $this->error("Invalid date format. Use YYYY-MM-DD", 400);
        }
        $where .= $wpdb->prepare(" AND a.preferred_date = %s", $date);
    }

    // SEARCH that includes partial provider name
    $join = "";
    if ($search) {
        $like = '%' . $wpdb->esc_like($search) . '%';

        // JOIN providers only when searching (lighter)
        $join = "LEFT JOIN {$providers_table} p ON p.id = a.provider_id";

        $where .= $wpdb->prepare("
            AND (
                a.notes LIKE %s
                OR a.time_slot LIKE %s
                OR a.preferred_date LIKE %s
                OR CAST(a.user_id AS CHAR) LIKE %s
                OR EXISTS (
                    SELECT 1 FROM {$users_table} u
                    WHERE u.ID = a.user_id
                    AND (u.display_name LIKE %s OR u.user_login LIKE %s)
                )
                OR p.name LIKE %s
            )
        ", $like, $like, $like, $like, $like, $like, $like);
    }

    // Order
    $order = ($sort === 'oldest')
        ? "ORDER BY a.created_at ASC"
        : "ORDER BY a.created_at DESC";

    // Pagination
    $page     = max(1, (int)$request->get_param('page'));
    $per_page = max(1, (int)$request->get_param('per_page')) ?: 10;
    $offset   = ($page - 1) * $per_page;

    // Count query
    $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM {$table} a {$join} {$where}");

    // Fetch rows
    $rows = $wpdb->get_results(
        $wpdb->prepare("
            SELECT a.*
            FROM {$table} a
            {$join}
            {$where}
            {$order}
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
     * SINGLE
     */
    public function get_appointment(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $id = (int) $request->get_param('id');
        $table = $wpdb->prefix . 'zf_appointments';

        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id),
            ARRAY_A
        );

        if (! $row) {
            return $this->error("Appointment not found", 404);
        }

        // If soft-deleted and non-admin requesting, forbid
        $is_admin_request = $this->request_is_admin($request);
        if ($row['deleted_at'] !== null && ! $is_admin_request) {
            return new WP_Error('rest_forbidden', 'You cannot view deleted appointments.', ['status' => 403]);
        }

        return new WP_REST_Response([
            'success' => true,
            'data'    => $row,
        ], 200);
    }

    /**
     * CREATE
     */
    public function create_appointment(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        if (! is_user_logged_in()) {
            return new WP_Error('rest_forbidden', 'You must be logged in to create an appointment', ['status' => 401]);
        }

        // Nonce check
        $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');
        if (! $nonce || ! wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Invalid or missing nonce', ['status' => 403]);
        }

        global $wpdb;
        $table = $wpdb->prefix . 'zf_appointments';

        $provider_id = (int) $request->get_param('provider_id');
        $preferred_date = $request->get_param('preferred_date');
        $time_slot = sanitize_text_field((string) $request->get_param('time_slot'));
        $notes = $request->get_param('notes') !== null ? sanitize_textarea_field(wp_strip_all_tags((string)$request->get_param('notes'), true)) : null;

        if (! $provider_id || ! $preferred_date || ! $time_slot) {
            return new WP_Error('invalid_input', 'provider_id, preferred_date and time_slot are required', ['status' => 400]);
        }

        // Validate date format
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $preferred_date)) {
            return $this->error("Invalid preferred_date format. Use YYYY-MM-DD", 400);
        }

        $data = [
            'user_id'       => get_current_user_id(),
            'provider_id'   => $provider_id,
            'preferred_date'=> $preferred_date,
            'time_slot'     => $time_slot,
            'status'        => 'pending',
            'notes'         => $notes,
            'created_at'    => current_time('mysql'),
            'deleted_at'    => null,
        ];

        $inserted = $wpdb->insert($table, $data);

        if (! $inserted) {
            return new WP_Error('insert_failed', 'Could not create appointment', ['status' => 500]);
        }

        $id = (int)$wpdb->insert_id;

        // Return fresh single (forwarding nonce)
        $req = new \WP_REST_Request('GET', "/{$this->namespace}/appointments/{$id}");
        $req->set_header('x-wp-nonce', $nonce);
        $req->set_param('id', $id);
        return $this->get_appointment($req);
    }

    /**
     * UPDATE (admin)
     */
    public function update_appointment(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_appointments';
        $id    = (int)$request->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d", $id))) {
            return $this->error("Appointment not found", 404);
        }

        $fields = [];

        if ($request->get_param('preferred_date') !== null) {
            $d = $request->get_param('preferred_date');
            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
                return $this->error("Invalid preferred_date format. Use YYYY-MM-DD", 400);
            }
            $fields['preferred_date'] = $d;
        }

        if ($request->get_param('time_slot') !== null) {
            $fields['time_slot'] = sanitize_text_field((string)$request->get_param('time_slot'));
        }

        if ($request->get_param('status') !== null) {
            $status = $request->get_param('status');
            $allowed = ['pending','confirmed','rejected'];
            if (! in_array($status, $allowed, true)) {
                return $this->error("Invalid status", 400);
            }
            $fields['status'] = $status;
        }

        if ($request->get_param('notes') !== null) {
            $fields['notes'] = sanitize_textarea_field(wp_strip_all_tags((string)$request->get_param('notes'), true));
        }

        if (empty($fields)) {
            return $this->error("No valid fields provided", 400);
        }

        $fields['updated_at'] = current_time('mysql');

        $updated = $wpdb->update($table, $fields, ['id' => $id]);

        if ($updated === false) {
            return new WP_Error('update_failed', 'Failed to update appointment', ['status' => 500]);
        }

        // Return fresh
        $req = new \WP_REST_Request('GET', "/{$this->namespace}/appointments/{$id}");
        $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');
        if ($nonce) {
            $req->set_header('x-wp-nonce', $nonce);
        }
        $req->set_param('id', $id);
        return $this->get_appointment($req);
    }

    /**
     * DELETE (soft)
     */
    public function delete_appointment(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_appointments';
        $id    = (int)$request->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d", $id))) {
            return $this->error("Appointment not found", 404);
        }

        $deleted = $wpdb->update($table, [
            'deleted_at' => current_time('mysql')
        ], ['id' => $id]);

        if ($deleted === false) {
            return new WP_Error('delete_failed', 'Failed to delete appointment', ['status' => 500]);
        }

        return $this->respond(['message' => "Appointment soft-deleted"]);
    }

    /**
     * RESTORE (admin)
     */
    public function restore_appointment(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;
        $table = $wpdb->prefix . 'zf_appointments';
        $id    = (int)$request->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE id=%d", $id))) {
            return $this->error("Appointment not found", 404);
        }

        $restored = $wpdb->update($table, [
            'deleted_at' => null
        ], ['id' => $id]);

        if ($restored === false) {
            return new WP_Error('restore_failed', 'Failed to restore appointment', ['status' => 500]);
        }

        return $this->respond(['message' => "Appointment restored"]);
    }

    /**
     * Helper: request_is_admin — copied from Reviews for deterministic admin detection.
     */
    protected function request_is_admin(WP_REST_Request $request): bool
    {
        // --- Safety: allow debug override only on local development ---
        $debug_override = filter_var(get_option('zorg_debug_admin_override', false), FILTER_VALIDATE_BOOLEAN);

        // Read incoming nonce (header or _wpnonce param)
        $nonce = $request->get_header('x-wp-nonce') ?: $request->get_param('_wpnonce');

        // Verify nonce if provided
        $nonce_ok = $nonce && wp_verify_nonce($nonce, 'wp_rest');

        // After wp_verify_nonce, WP should authenticate cookie user for REST.
        $cap_after = current_user_can('edit_others_posts');

        // If debug override option is enabled (ONLY use on local) treat as admin
        if ($debug_override) {
            return true;
        }

        if ($nonce_ok) {
            return $cap_after;
        }

        if (is_user_logged_in() && current_user_can('edit_others_posts')) {
            return true;
        }

        return false;
    }

    public function check_availability(WP_REST_Request $request): WP_REST_Response|WP_Error
{
    global $wpdb;
    $table = $wpdb->prefix . 'zf_appointments';

    $provider_id = (int) $request->get_param('provider_id');
    $date        = $request->get_param('date');

    if (! $provider_id || ! $date) {
        return $this->error("provider_id and date are required", 400);
    }

    // Validate date format
    if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        return $this->error("Invalid date format. Use YYYY-MM-DD", 400);
    }

    // Fetch taken slots (only active, not deleted)
    $taken_slots = $wpdb->get_col(
        $wpdb->prepare(
            "SELECT time_slot 
             FROM $table 
             WHERE provider_id = %d 
             AND preferred_date = %s 
             AND deleted_at IS NULL",
            $provider_id, 
            $date
        )
    );

    // Response: all taken slots, + boolean convenience
    return new WP_REST_Response([
        'success' => true,
        'data' => [
            'available'    => empty($taken_slots),
            'taken_slots'  => $taken_slots,
        ]
    ], 200);
}


    /**
     * Admin permission helper (same as Reviews controller)
     */
    public function require_admin(): bool|WP_Error
    {
        if (! current_user_can('edit_others_posts')) {
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to modify appointments.', 'zorgfinder-core'),
                ['status' => 403]
            );
        }
        return true;
    }
}
