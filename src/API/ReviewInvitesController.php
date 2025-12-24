<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ReviewInvitesController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/review-invites', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'list_invites'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        register_rest_route($this->namespace, '/review-invites/send', [
            [
                'methods'  => 'POST',
                'callback' => [$this, 'send_invite'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        register_rest_route($this->namespace, '/review-invites/verify', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'verify_invite'],
                'permission_callback' => '__return_true',
            ],
        ]);

        register_rest_route($this->namespace, '/review-invites/bulk-delete', [
            [
                'methods'  => 'POST',
                'callback' => [$this, 'bulk_delete'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    /* =========================
     * LIST INVITES
     * ========================= */
    public function list_invites(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $table = $wpdb->prefix . 'zf_review_invites';

        $search      = $request->get_param('search');
        $provider_id = (int) $request->get_param('provider_id');
        $status      = $request->get_param('status');

        $where = "WHERE 1=1";
        $params = [];

        if ($provider_id) {
            $where .= " AND provider_id = %d";
            $params[] = $provider_id;
        }

        if ($search) {
            $where .= " AND email LIKE %s";
            $params[] = '%' . $wpdb->esc_like($search) . '%';
        }

        if ($status === 'pending') {
            $where .= " AND used_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())";
        } elseif ($status === 'used') {
            $where .= " AND used_at IS NOT NULL";
        } elseif ($status === 'expired') {
            $where .= " AND used_at IS NULL AND expires_at < NOW()";
        }

        $sql = "SELECT * FROM {$table} {$where} ORDER BY created_at DESC";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $rows = $wpdb->get_results($sql, ARRAY_A);

        return $this->respond([
            'success' => true,
            'data'    => $rows ?: [],
            'total'   => count($rows ?: []),
        ]);
    }

    /* =========================
     * BULK DELETE
     * ========================= */
    public function bulk_delete(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;

        $ids = (array) $request->get_param('ids');
        if (empty($ids)) {
            return $this->respond(['success' => true, 'deleted' => 0]);
        }

        $table = $wpdb->prefix . 'zf_review_invites';
        $ids   = array_map('intval', $ids);
        $in    = implode(',', $ids);

        $deleted = $wpdb->query("DELETE FROM {$table} WHERE id IN ({$in})");

        return $this->respond([
            'success' => true,
            'deleted' => (int) $deleted,
        ]);
    }

    /* =========================
     * VERIFY INVITE
     * ========================= */
    public function verify_invite(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        global $wpdb;

        $token = sanitize_text_field($request->get_param('token'));
        if (!$token) {
            return $this->error('Missing token', 400);
        }

        $table = $wpdb->prefix . 'zf_review_invites';

        $invite = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table} WHERE token=%s", $token),
            ARRAY_A
        );

        if (!$invite) {
            return $this->error('Invalid invite', 404);
        }

        if ($invite['used_at']) {
            return $this->error('Invite already used', 403);
        }

        if ($invite['expires_at'] && strtotime($invite['expires_at']) < time()) {
            return $this->error('Invite expired', 403);
        }

        return $this->respond([
            'success' => true,
            'data' => [
                'invite_id'   => (int) $invite['id'],
                'provider_id' => (int) $invite['provider_id'],
            ],
        ]);
    }
}
