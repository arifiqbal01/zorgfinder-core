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
                'methods'  => 'GET',
                'callback' => [$this, 'get_provider_with_reimbursements'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'  => ['PUT','PATCH'],
                'callback' => [$this, 'update_provider_with_reimbursements'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    /* Helper: JSON array safe encode */
    private function encode_json($val)
    {
        if (!$val) return null;
        return wp_json_encode(is_array($val) ? array_values($val) : [$val]);
    }

    /* ===============================================================
       GET PROVIDER + REIMBURSEMENTS
    =============================================================== */
    public function get_provider_with_reimbursements(WP_REST_Request $request)
    {
        global $wpdb;

        $provider = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}zf_providers 
                 WHERE id=%d AND deleted_at IS NULL",
                (int)$request->get_param('id')
            ),
            ARRAY_A
        );

        if (!$provider) {
            return $this->error("Provider not found", 404);
        }

        // Decode JSON
        $provider['target_genders']     = json_decode($provider['target_genders'] ?? "[]", true);
        $provider['target_age_groups']  = json_decode($provider['target_age_groups'] ?? "[]", true);

        // Load reimbursements
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}zf_reimbursements 
                 WHERE provider_id=%d AND deleted_at IS NULL",
                $provider['id']
            ),
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
            'reimbursements' => $reimbursements,
        ]);
    }

    /* ===============================================================
       CREATE PROVIDER + REIMBURSEMENTS
    =============================================================== */
    public function create_provider_with_reimbursements(WP_REST_Request $req)
    {
        global $wpdb;

        $wpdb->query("START TRANSACTION");

        try {
            $slug = sanitize_title($req->get_param('slug'))
                  ?: sanitize_title($req->get_param('provider'));

            $provData = [
                'provider'          => sanitize_text_field($req->get_param('provider')),
                'slug'              => $slug,
                'target_genders'    => $this->encode_json($req->get_param('target_genders')),
                'target_age_groups' => $this->encode_json($req->get_param('target_age_groups')),
                'type_of_care'      => sanitize_text_field($req->get_param('type_of_care')),
                'indication_type'   => sanitize_text_field($req->get_param('indication_type')),
                'organization_type' => sanitize_text_field($req->get_param('organization_type')),
                'religion'          => sanitize_text_field($req->get_param('religion')),
                'has_hkz'           => (int)$req->get_param('has_hkz'),
                'address'           => sanitize_textarea_field($req->get_param('address')),
                'email'             => sanitize_email($req->get_param('email')),
                'phone'             => sanitize_text_field($req->get_param('phone')),
                'website'           => esc_url_raw($req->get_param('website')),
                'created_at'        => current_time('mysql'),
                'updated_at'        => current_time('mysql'),
                'deleted_at'        => null,
            ];

            $wpdb->insert("{$wpdb->prefix}zf_providers", $provData);
            $pid = $wpdb->insert_id;

            // Insert reimbursements
            $reims = $req->get_param('reimbursements') ?: [];
            foreach ($reims as $r) {
                $wpdb->insert("{$wpdb->prefix}zf_reimbursements", [
                    'provider_id' => $pid,
                    'type'        => sanitize_text_field($r['type']),
                    'description' => sanitize_textarea_field($r['description'] ?? ''),
                    'coverage_details' => sanitize_textarea_field($r['coverage_details'] ?? ''),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                    'deleted_at' => null,
                ]);
            }

            $wpdb->query("COMMIT");

            return $this->respond([
                'success' => true,
                'provider_id' => $pid,
            ]);

        } catch (\Throwable $e) {
            $wpdb->query("ROLLBACK");
            return $this->error($e->getMessage(), 400);
        }
    }

    /* ===============================================================
       UPDATE PROVIDER + REIMBURSEMENTS
    =============================================================== */
    public function update_provider_with_reimbursements(WP_REST_Request $req)
    {
        global $wpdb;

        $pid = (int)$req->get_param('id');

        $exists = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}zf_providers WHERE id=%d AND deleted_at IS NULL",
                $pid
            )
        );

        if (!$exists) {
            return $this->error("Provider not found", 404);
        }

        $wpdb->query("START TRANSACTION");

        try {
            $slug = sanitize_title($req->get_param('slug'))
                  ?: sanitize_title($req->get_param('provider'));

            $update = [
                'provider'          => sanitize_text_field($req->get_param('provider')),
                'slug'              => $slug,
                'target_genders'    => $this->encode_json($req->get_param('target_genders')),
                'target_age_groups' => $this->encode_json($req->get_param('target_age_groups')),
                'type_of_care'      => sanitize_text_field($req->get_param('type_of_care')),
                'indication_type'   => sanitize_text_field($req->get_param('indication_type')),
                'organization_type' => sanitize_text_field($req->get_param('organization_type')),
                'religion'          => sanitize_text_field($req->get_param('religion')),
                'has_hkz'           => (int)$req->get_param('has_hkz'),
                'address'           => sanitize_textarea_field($req->get_param('address')),
                'email'             => sanitize_email($req->get_param('email')),
                'phone'             => sanitize_text_field($req->get_param('phone')),
                'website'           => esc_url_raw($req->get_param('website')),
                'updated_at'        => current_time('mysql'),
            ];

            $wpdb->update("{$wpdb->prefix}zf_providers", $update, ['id' => $pid]);

            // Upsert reimbursements
            $reims = $req->get_param('reimbursements') ?: [];

            foreach ($reims as $r) {
                $type = sanitize_text_field($r['type']);

                $existing = $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT id FROM {$wpdb->prefix}zf_reimbursements 
                         WHERE provider_id=%d AND type=%s AND deleted_at IS NULL",
                        $pid, $type
                    )
                );

                $payload = [
                    'description' => sanitize_textarea_field($r['description'] ?? ''),
                    'coverage_details' => sanitize_textarea_field($r['coverage_details'] ?? ''),
                    'updated_at' => current_time('mysql'),
                ];

                if ($existing) {
                    $wpdb->update("{$wpdb->prefix}zf_reimbursements", $payload, ['id' => $existing]);
                } else {
                    $wpdb->insert("{$wpdb->prefix}zf_reimbursements", array_merge([
                        'provider_id' => $pid,
                        'type'        => $type,
                        'created_at'  => current_time('mysql'),
                        'deleted_at'  => null,
                    ], $payload));
                }
            }

            $wpdb->query("COMMIT");

            return $this->respond([
                'success' => true,
                'provider_id' => $pid,
            ]);

        } catch (\Throwable $e) {
            $wpdb->query("ROLLBACK");
            return $this->error($e->getMessage(), 400);
        }
    }

    /* ===============================================================
       PERMISSIONS
    =============================================================== */
    public function require_admin(): bool|WP_Error
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', 'You do not have permission.', ['status' => 403]);
        }
        return true;
    }
}
