<?php
namespace ZorgFinder\API;

use WP_REST_Request;
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
                'methods'  => ['PUT', 'PATCH'],
                'callback' => [$this, 'update_provider_with_reimbursements'],
                'permission_callback' => [$this, 'require_admin'],
            ],
        ]);
    }

    /* ===============================================================
       HELPERS
    =============================================================== */

    private function encode_json($val)
    {
        return wp_json_encode(
            is_array($val) ? array_values($val) : []
        );
    }

    private function decode_json($val): array
    {
        $decoded = json_decode($val ?? '[]', true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Normalize reimbursements payload.
     */
    private function normalize_reimbursements($raw): array
    {
        if (!is_array($raw)) return [];

        // associative → indexed
        if (array_keys($raw) !== range(0, count($raw) - 1)) {
            $out = [];
            foreach ($raw as $type => $data) {
                if (!is_array($data)) continue;
                $out[] = array_merge(['type' => $type], $data);
            }
            return $out;
        }

        return $raw;
    }

    /* ===============================================================
       GET PROVIDER + REIMBURSEMENTS
    =============================================================== */

    public function get_provider_with_reimbursements(WP_REST_Request $request)
    {
        global $wpdb;

        $id = (int) $request->get_param('id');

        $provider = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}zf_providers
                 WHERE id = %d AND deleted_at IS NULL",
                $id
            ),
            ARRAY_A
        );

        if (!$provider) {
            return $this->error('Provider not found', 404);
        }

        $provider['target_genders']    = $this->decode_json($provider['target_genders']);
        $provider['target_age_groups'] = $this->decode_json($provider['target_age_groups']);

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT type, description, coverage_details
                 FROM {$wpdb->prefix}zf_reimbursements
                 WHERE provider_id = %d AND deleted_at IS NULL",
                $id
            ),
            ARRAY_A
        );

        $reimbursements = [];
        foreach ($rows as $r) {
            $reimbursements[$r['type']] = [
                'type'             => $r['type'],
                'description'      => $r['description'] ?? '',
                'coverage_details' => $r['coverage_details'] ?? '',
            ];
        }

        return $this->respond([
            'provider'       => $provider,
            'reimbursements' => $reimbursements,
        ]);
    }

    /* ===============================================================
       CREATE (STRICT TRANSACTION)
    =============================================================== */

    public function create_provider_with_reimbursements(WP_REST_Request $req)
{
    global $wpdb;

    $wpdb->query('START TRANSACTION');

    try {
        $providerName = sanitize_text_field($req->get_param('provider'));
        if (!$providerName) {
            throw new \Exception('Provider name is required.');
        }

        // ✅ SLUG RULE:
        // use admin slug if provided, otherwise generate from provider name
        $rawSlug = $req->get_param('slug');
        $slug = ($rawSlug !== null && trim($rawSlug) !== '')
            ? sanitize_title($rawSlug)
            : sanitize_title($providerName);

        $inserted = $wpdb->insert("{$wpdb->prefix}zf_providers", [
            'provider'          => $providerName,
            'slug'              => $slug,
            'target_genders'    => $this->encode_json($req->get_param('target_genders')),
            'target_age_groups' => $this->encode_json($req->get_param('target_age_groups')),
            'type_of_care'      => sanitize_text_field($req->get_param('type_of_care')),
            'indication_type'   => sanitize_text_field($req->get_param('indication_type')),
            'organization_type' => sanitize_text_field($req->get_param('organization_type')),
            'religion'          => sanitize_text_field($req->get_param('religion')),
            'has_hkz'           => (int) $req->get_param('has_hkz'),
            'address'           => sanitize_textarea_field($req->get_param('address')),
            'email'             => sanitize_email($req->get_param('email')),
            'phone'             => sanitize_text_field($req->get_param('phone')),
            'website'           => esc_url_raw($req->get_param('website')),
            'created_at'        => current_time('mysql'),
            'updated_at'        => current_time('mysql'),
            'deleted_at'        => null,
        ]);

        $pid = (int) $wpdb->insert_id;

        // 🔒 HARD STOP — provider MUST exist
        if (!$inserted || $pid <= 0) {
            throw new \Exception('Provider could not be created.');
        }

        $reimbursements = $this->normalize_reimbursements(
            $req->get_param('reimbursements')
        );

        // 🔒 Require at least one reimbursement on create
        if (empty($reimbursements)) {
            throw new \Exception('At least one reimbursement is required.');
        }

        foreach ($reimbursements as $r) {
            if (empty($r['type'])) continue;

            $wpdb->insert("{$wpdb->prefix}zf_reimbursements", [
                'provider_id'      => $pid,
                'type'             => sanitize_text_field($r['type']),
                'description'      => sanitize_textarea_field($r['description'] ?? ''),
                'coverage_details' => sanitize_textarea_field($r['coverage_details'] ?? ''),
                'created_at'       => current_time('mysql'),
                'updated_at'       => current_time('mysql'),
                'deleted_at'       => null,
            ]);
        }

        $wpdb->query('COMMIT');

        // ✅ IMPORTANT: inject route param manually
        $get = new WP_REST_Request(
            'GET',
            "/{$this->namespace}/providers-with-reimbursements/{$pid}"
        );
        $get->set_param('id', $pid);

        return $this->get_provider_with_reimbursements($get);

    } catch (\Throwable $e) {
        $wpdb->query('ROLLBACK');
        return $this->error($e->getMessage(), 400);
    }
}


    /* ===============================================================
       UPDATE (SAFE)
    =============================================================== */

    public function update_provider_with_reimbursements(WP_REST_Request $req)
{
    global $wpdb;

    $pid = (int) $req->get_param('id');

    if (!$wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}zf_providers
             WHERE id=%d AND deleted_at IS NULL",
            $pid
        )
    )) {
        return $this->error('Provider not found', 404);
    }

    $wpdb->query('START TRANSACTION');

    try {
        // ✅ SLUG RULE (same as create)
        $rawSlug = $req->get_param('slug');
        $rawName = $req->get_param('provider');

        $slug = ($rawSlug !== null && trim($rawSlug) !== '')
            ? sanitize_title($rawSlug)
            : sanitize_title($rawName);

        $wpdb->update("{$wpdb->prefix}zf_providers", [
            'provider'          => sanitize_text_field($rawName),
            'slug'              => $slug,
            'target_genders'    => $this->encode_json($req->get_param('target_genders')),
            'target_age_groups' => $this->encode_json($req->get_param('target_age_groups')),
            'type_of_care'      => sanitize_text_field($req->get_param('type_of_care')),
            'indication_type'   => sanitize_text_field($req->get_param('indication_type')),
            'organization_type' => sanitize_text_field($req->get_param('organization_type')),
            'religion'          => sanitize_text_field($req->get_param('religion')),
            'has_hkz'           => (int) $req->get_param('has_hkz'),
            'address'           => sanitize_textarea_field($req->get_param('address')),
            'email'             => sanitize_email($req->get_param('email')),
            'phone'             => sanitize_text_field($req->get_param('phone')),
            'website'           => esc_url_raw($req->get_param('website')),
            'updated_at'        => current_time('mysql'),
        ], ['id' => $pid]);

        $reimbursements = $this->normalize_reimbursements(
            $req->get_param('reimbursements')
        );

        foreach ($reimbursements as $r) {
            if (empty($r['type'])) continue;

            $type = sanitize_text_field($r['type']);

            $existing = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT id FROM {$wpdb->prefix}zf_reimbursements
                     WHERE provider_id=%d AND type=%s AND deleted_at IS NULL",
                    $pid,
                    $type
                )
            );

            $payload = [
                'description'      => sanitize_textarea_field($r['description'] ?? ''),
                'coverage_details' => sanitize_textarea_field($r['coverage_details'] ?? ''),
                'updated_at'       => current_time('mysql'),
            ];

            if ($existing) {
                $wpdb->update(
                    "{$wpdb->prefix}zf_reimbursements",
                    $payload,
                    ['id' => $existing]
                );
            } else {
                $wpdb->insert(
                    "{$wpdb->prefix}zf_reimbursements",
                    array_merge(
                        [
                            'provider_id' => $pid,
                            'type'        => $type,
                            'created_at'  => current_time('mysql'),
                            'deleted_at'  => null,
                        ],
                        $payload
                    )
                );
            }
        }

        $wpdb->query('COMMIT');

        // ✅ IMPORTANT: inject route param manually
        $get = new WP_REST_Request(
            'GET',
            "/{$this->namespace}/providers-with-reimbursements/{$pid}"
        );
        $get->set_param('id', $pid);

        return $this->get_provider_with_reimbursements($get);

    } catch (\Throwable $e) {
        $wpdb->query('ROLLBACK');
        return $this->error($e->getMessage(), 400);
    }
}


    /* ===============================================================
       PERMISSIONS
    =============================================================== */

    public function require_admin(): bool|WP_Error
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error(
                'rest_forbidden',
                'You do not have permission.',
                ['status' => 403]
            );
        }
        return true;
    }
}
