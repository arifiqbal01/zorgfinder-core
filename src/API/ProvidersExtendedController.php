<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class ProvidersExtendedController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/providers-with-reimbursements', [
            [
                'methods'  => 'POST',
                'callback' => [$this, 'create_provider_with_reimbursements'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        register_rest_route($this->namespace, '/providers-with-reimbursements/(?P<id>\d+)', [
            [
                'methods'  => ['PUT', 'PATCH'],
                'callback' => [$this, 'update_provider_with_reimbursements'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);

        // GET single provider + reimbursements
        register_rest_route($this->namespace, '/providers-with-reimbursements/(?P<id>\d+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_provider_with_reimbursements'],
                'permission_callback' => '__return_true', // public read allowed
            ],
        ]);

    }

    public function get_provider_with_reimbursements(WP_REST_Request $request)
{
    global $wpdb;

    $table_prov = $wpdb->prefix . 'zf_providers';
    $table_reim = $wpdb->prefix . 'zf_reimbursements';

    $id = (int) $request->get_param('id');

    // 1) Load provider
    $provider = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_prov WHERE id=%d AND deleted_at IS NULL", $id),
        ARRAY_A
    );

    if (!$provider) {
        return $this->error("Provider not found.", 404);
    }

    // 2) Load reimbursements, grouped by type
    $rows = $wpdb->get_results(
        $wpdb->prepare("SELECT * FROM $table_reim WHERE provider_id=%d AND deleted_at IS NULL", $id),
        ARRAY_A
    );

    $reimbursements = [];
    foreach ($rows as $r) {
        $reimbursements[$r['type']] = [
            'type'             => $r['type'],
            'description'      => $r['description'],
            'coverage_details' => $r['coverage_details'],
        ];
    }

    return $this->respond([
        'provider'       => $provider,
        'reimbursements' => $reimbursements
    ]);
}


    /* ============================================================
     * CREATE NEW PROVIDER + REIMBURSEMENTS (ATOMIC)
     * ============================================================ */
    public function create_provider_with_reimbursements(WP_REST_Request $request)
    {
        global $wpdb;

        $table_prov = $wpdb->prefix . 'zf_providers';
        $table_reim = $wpdb->prefix . 'zf_reimbursements';

        $wpdb->query("START TRANSACTION");

        try {

            /* 1) CREATE PROVIDER */
            $slug = sanitize_title($request->get_param('slug')) 
                 ?: sanitize_title($request->get_param('name'));

            $provider_data = [
                'name'              => sanitize_text_field($request->get_param('name')),
                'slug'              => $slug,
                'type_of_care'      => sanitize_text_field($request->get_param('type_of_care')),
                'indication_type'   => sanitize_text_field($request->get_param('indication_type')),
                'organization_type' => sanitize_text_field($request->get_param('organization_type')),
                'religion'          => sanitize_text_field($request->get_param('religion')),
                'has_hkz'           => (int)$request->get_param('has_hkz'),
                'address'           => sanitize_textarea_field($request->get_param('address')),
                'email'             => sanitize_email($request->get_param('email')),
                'phone'             => sanitize_text_field($request->get_param('phone')),
                'website'           => esc_url_raw($request->get_param('website')),
                'created_at'        => current_time('mysql'),
                'updated_at'        => current_time('mysql'),
                'deleted_at'        => null,
            ];

            $wpdb->insert($table_prov, $provider_data);
            $provider_id = $wpdb->insert_id;

            if (! $provider_id) {
                throw new \Exception("Provider creation failed.");
            }


            /* 2) CREATE REIMBURSEMENTS (ONE PER TYPE) */
            $reimbursements = $request->get_param('reimbursements') ?: [];

            foreach ($reimbursements as $r) {
                $type = sanitize_text_field($r['type']);

                // Prevent duplicate WLZ/WMO/ZVW/Youth for this provider
                $exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $table_reim
                     WHERE provider_id=%d AND type=%s AND deleted_at IS NULL",
                    $provider_id,
                    $type
                ));

                if ($exists > 0) {
                    throw new \Exception("Reimbursement of type '{$type}' already exists. Only editing is allowed.");
                }

                // Insert new reimbursement
                $wpdb->insert($table_reim, [
                    'provider_id'      => $provider_id,
                    'type'             => $type,
                    'description'      => sanitize_textarea_field($r['description']),
                    'coverage_details' => sanitize_textarea_field($r['coverage_details']),
                    'created_at'       => current_time('mysql'),
                    'updated_at'       => current_time('mysql'),
                    'deleted_at'       => null,
                ]);
            }

            $wpdb->query("COMMIT");

            return $this->respond([
                'success' => true,
                'provider_id' => $provider_id,
                'message' => "Provider and reimbursements created successfully."
            ]);

        } catch (\Throwable $e) {
            $wpdb->query("ROLLBACK");
            return $this->error($e->getMessage(), 400);
        }
    }



    /* ============================================================
     * UPDATE PROVIDER + REIMBURSEMENTS (SMART UPSERT)
     * ============================================================ */
   public function update_provider_with_reimbursements(WP_REST_Request $request)
{
    global $wpdb;

    $table_prov = $wpdb->prefix . 'zf_providers';
    $table_reim = $wpdb->prefix . 'zf_reimbursements';

    $provider_id = (int)$request->get_param('id');

    /* --------------------------------------------------------
     * 1) VALIDATE PROVIDER EXISTS
     * -------------------------------------------------------- */
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM $table_prov WHERE id=%d AND deleted_at IS NULL",
        $provider_id
    ));

    if (!$exists) {
        return $this->error("Provider not found.", 404);
    }

    $wpdb->query("START TRANSACTION");

    try {

        /* --------------------------------------------------------
         * 2) ALWAYS UPDATE ALL FIELDS (allow empty)
         * -------------------------------------------------------- */

        $update = [
            'name'              => sanitize_text_field($request->get_param('name')),
            'slug'              => sanitize_title($request->get_param('slug')),
            'type_of_care'      => sanitize_text_field($request->get_param('type_of_care')),
            'indication_type'   => sanitize_text_field($request->get_param('indication_type')),
            'organization_type' => sanitize_text_field($request->get_param('organization_type')),
            'religion'          => sanitize_text_field($request->get_param('religion')),
            'has_hkz'           => (int)$request->get_param('has_hkz'),
            'address'           => sanitize_textarea_field($request->get_param('address')),
            'email'             => sanitize_email($request->get_param('email')),
            'phone'             => sanitize_text_field($request->get_param('phone')),
            'website'           => esc_url_raw($request->get_param('website')),
            'updated_at'        => current_time('mysql'),
        ];

        // DO NOT FILTER OUT EMPTY VALUES — WE WANT TO CLEAR FIELDS TOO
        $wpdb->update(
            $table_prov,
            $update,
            ['id' => $provider_id]
        );

        /* --------------------------------------------------------
         * 3) REIMBURSEMENTS — UPSERT PER TYPE
         * -------------------------------------------------------- */

        $reimbursements = $request->get_param('reimbursements') ?: [];

        foreach ($reimbursements as $r) {
            $type = sanitize_text_field($r['type']);

            $existing_id = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table_reim 
                 WHERE provider_id=%d AND type=%s AND deleted_at IS NULL",
                $provider_id,
                $type
            ));

            $data = [
                'description'      => sanitize_textarea_field($r['description'] ?? ''),
                'coverage_details' => sanitize_textarea_field($r['coverage_details'] ?? ''),
                'updated_at'       => current_time('mysql'),
            ];

            if ($existing_id) {
                // Update existing reimbursement
                $wpdb->update($table_reim, $data, ['id' => $existing_id]);
            } else {
                // Insert new reimbursement record
                $wpdb->insert($table_reim, array_merge([
                    'provider_id' => $provider_id,
                    'type'        => $type,
                    'created_at'  => current_time('mysql'),
                    'deleted_at'  => null,
                ], $data));
            }
        }

        /* --------------------------------------------------------
         * 4) COMMIT
         * -------------------------------------------------------- */
        $wpdb->query("COMMIT");

        return $this->respond([
            'success'      => true,
            'provider_id'  => $provider_id,
            'message'      => "Provider and reimbursements updated successfully."
        ]);

    } catch (\Throwable $e) {
        $wpdb->query("ROLLBACK");
        return $this->error($e->getMessage(), 400);
    }
}



    /* ============================================================
     * PERMISSIONS
     * ============================================================ */
    public function require_admin(): bool|WP_Error
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error(
                'rest_forbidden',
                __('You do not have permission to modify providers.', 'zorgfinder-core'),
                ['status' => 403]
            );
        }
        return true;
    }
}
