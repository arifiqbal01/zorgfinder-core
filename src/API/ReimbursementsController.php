<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ReimbursementsController extends BaseController
{
    protected string $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'zf_reimbursements';
    }

    public function register_routes()
    {
        // List + Create
        register_rest_route($this->namespace, '/reimbursements', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_reimbursements'],
                'permission_callback' => '__return_true'
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'create_reimbursement'],
                'permission_callback' => [$this, 'require_admin']
            ]
        ]);

        // Single + Update + Delete
        register_rest_route($this->namespace, '/reimbursements/(?P<id>\d+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_reimbursement'],
                'permission_callback' => '__return_true'
            ],
            [
                'methods' => ['PUT', 'PATCH'],
                'callback' => [$this, 'update_reimbursement'],
                'permission_callback' => [$this, 'require_admin']
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'delete_reimbursement'],
                'permission_callback' => [$this, 'require_admin']
            ]
        ]);

        // Restore deleted
        register_rest_route($this->namespace, '/reimbursements/(?P<id>\d+)/restore', [
            [
                'methods' => 'PATCH',
                'callback' => [$this, 'restore_reimbursement'],
                'permission_callback' => [$this, 'require_admin']
            ]
        ]);
    }

    /**
     * LIST — filters + pagination
     */
   public function get_reimbursements(WP_REST_Request $req)
{
    global $wpdb;

    // Always start with a leading/trailing spaces
    $where = " WHERE deleted_at IS NULL ";

    $provider_id = $req->get_param('provider_id');
    $type = $req->get_param('type');
    $search = $req->get_param('search');
    $trashed = (int)$req->get_param('trashed') === 1;

    if ($trashed) {
        $where = " WHERE deleted_at IS NOT NULL ";
    }

    if ($provider_id) {
        $where .= $wpdb->prepare(" AND provider_id = %d ", (int)$provider_id);
    }

    if ($type) {
        $where .= $wpdb->prepare(" AND type = %s ", $type);
    }

    if ($search) {
        $like = '%' . $wpdb->esc_like($search) . '%';
        $where .= $wpdb->prepare(" AND (description LIKE %s OR coverage_details LIKE %s) ", $like, $like);
    }

    $page = max(1, (int)$req->get_param('page'));
    $per_page = (int)$req->get_param('per_page') ?: 10;
    $offset = ($page - 1) * $per_page;

    // Debug SQL (optional)
    // error_log("SQL: SELECT * FROM {$this->table} $where LIMIT $per_page OFFSET $offset");

    $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM $this->table $where");

    $rows = $wpdb->get_results(
        $wpdb->prepare("
            SELECT * FROM {$this->table}
            $where
            ORDER BY created_at DESC
            LIMIT %d OFFSET %d
        ", $per_page, $offset),
        ARRAY_A
    );

    return $this->respond([
        'data'     => $rows,
        'total'    => $total,
        'page'     => $page,
        'per_page' => $per_page,
        'pages'    => ceil($total / $per_page),
    ]);
}


    /**
     * SINGLE
     */
    public function get_reimbursement(WP_REST_Request $req)
    {
        global $wpdb;
        $id = (int)$req->get_param('id');

        $item = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $this->table WHERE id=%d", $id),
            ARRAY_A
        );

        if (! $item) return $this->error("Not found", 404);

        return $this->respond(['data' => $item]);
    }

    /**
     * CREATE
     */
    public function create_reimbursement(WP_REST_Request $req)
    {
        global $wpdb;

        $provider_id = (int)$req->get_param('provider_id');
        $type        = sanitize_text_field($req->get_param('type'));
        $description = sanitize_textarea_field($req->get_param('description'));
        $coverage    = sanitize_textarea_field($req->get_param('coverage_details'));

        if (!$provider_id || !$type) {
            return $this->error("provider_id and type are required", 400);
        }

        $wpdb->insert($this->table, [
            'provider_id'     => $provider_id,
            'type'            => $type,
            'description'     => $description,
            'coverage_details'=> $coverage,
            'created_at'      => current_time('mysql'),
            'deleted_at'      => null
        ]);

        $id = $wpdb->insert_id;

        // SAFE: return record directly
        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $this->table WHERE id=%d", $id),
            ARRAY_A
        );

        return $this->respond([
            'success' => true,
            'data'    => $row
        ]);
    }


    /**
     * UPDATE
     */
    public function update_reimbursement(WP_REST_Request $req)
    {
        global $wpdb;
        $id = (int)$req->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $this->table WHERE id=%d", $id))) {
            return $this->error("Not found", 404);
        }

        $fields = [];

        if ($req->get_param('provider_id') !== null) {
            $fields['provider_id'] = (int)$req->get_param('provider_id');
        }

        if ($req->get_param('type') !== null) {
            $fields['type'] = sanitize_text_field($req->get_param('type'));
        }

        if ($req->get_param('description') !== null) {
            $fields['description'] = sanitize_textarea_field($req->get_param('description'));
        }

        if ($req->get_param('coverage_details') !== null) {
            $fields['coverage_details'] = sanitize_textarea_field($req->get_param('coverage_details'));
        }

        if (empty($fields)) {
            return $this->error("No valid fields provided", 400);
        }

        $fields['updated_at'] = current_time('mysql');

        $wpdb->update($this->table, $fields, ['id' => $id]);

        return $this->get_reimbursement(new WP_REST_Request('GET', "/{$this->namespace}/reimbursements/$id"));
    }

    /**
     * SOFT DELETE
     */
    public function delete_reimbursement(WP_REST_Request $req)
    {
        global $wpdb;
        $id = (int)$req->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $this->table WHERE id=%d", $id))) {
            return $this->error("Not found", 404);
        }

        $wpdb->update($this->table, [
            'deleted_at' => current_time('mysql')
        ], ['id' => $id]);

        return $this->respond(['message' => "Reimbursement deleted"]);
    }

    /**
     * RESTORE
     */
    public function restore_reimbursement(WP_REST_Request $req)
    {
        global $wpdb;
        $id = (int)$req->get_param('id');

        if (! $wpdb->get_var($wpdb->prepare("SELECT id FROM $this->table WHERE id=%d", $id))) {
            return $this->error("Not found", 404);
        }

        $wpdb->update($this->table, [
            'deleted_at' => null
        ], ['id' => $id]);

        return $this->respond(['message' => "Reimbursement restored"]);
    }

    public function require_admin(): bool|\WP_Error
    {
        if (!current_user_can('edit_others_posts')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to modify reimbursements.', 'zorgfinder-core'),
                ['status' => 403]
            );
        }

        return true;
    }

}
