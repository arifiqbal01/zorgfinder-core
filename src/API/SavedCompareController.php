<?php
namespace ZorgFinder\API;

use WP_REST_Request;

defined('ABSPATH') || exit;

class SavedCompareController extends BaseController
{
    public function register_routes()
    {
        register_rest_route($this->namespace, '/compare/save', [
            'methods'  => 'POST',
            'callback' => [$this, 'toggle_save'],
            'permission_callback' => [$this, 'require_auth'],
        ]);

        register_rest_route($this->namespace, '/compare/saved', [
            'methods'  => 'GET',
            'callback' => [$this, 'list_saved'],
            'permission_callback' => [$this, 'require_auth'],
        ]);
    }

    /**
     * CREATE / TOGGLE saved compare
     */
    public function toggle_save(WP_REST_Request $request)
    {
        global $wpdb;

        $table  = $wpdb->prefix . 'zf_saved_compares';
        $userId = get_current_user_id();

        if (!$userId) {
            return $this->error('Authentication required.', 401);
        }

        $params = $request->get_json_params();
        $ids = $params['provider_ids'] ?? null;

        if (!is_array($ids) || count($ids) < 2) {
            return $this->error('At least two providers are required.', 400);
        }

        // Normalize IDs
        $ids = array_values(array_unique(array_map('intval', $ids)));
        sort($ids);

        if (count($ids) < 2) {
            return $this->error('Invalid provider list.', 400);
        }

        $compare_key = implode(',', $ids);
        $json_ids    = wp_json_encode($ids);

        // Check last record
        $existing = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, deleted_at
                 FROM $table
                 WHERE user_id = %d AND compare_key = %s
                 ORDER BY id DESC
                 LIMIT 1",
                $userId,
                $compare_key
            ),
            ARRAY_A
        );

        // Toggle OFF
        if ($existing && $existing['deleted_at'] === null) {
            $wpdb->update(
                $table,
                ['deleted_at' => current_time('mysql')],
                ['id' => $existing['id']]
            );

            return $this->respond(['success' => true, 'action' => 'removed']);
        }

        // Restore
        if ($existing && $existing['deleted_at'] !== null) {
            $wpdb->update(
                $table,
                ['deleted_at' => null],
                ['id' => $existing['id']]
            );

            return $this->respond(['success' => true, 'action' => 'restored']);
        }

        // Create new
        $wpdb->insert($table, [
            'user_id'      => $userId,
            'provider_ids' => $json_ids,
            'compare_key'  => $compare_key,
            'created_at'   => current_time('mysql'),
        ]);

        return $this->respond(['success' => true, 'action' => 'created']);
    }

    /**
     * LIST saved comparisons
     */
    public function list_saved()
    {
        global $wpdb;

        $userId = get_current_user_id();

        if (!$userId) {
            return $this->error('Authentication required.', 401);
        }

        $table = $wpdb->prefix . 'zf_saved_compares';

        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT compare_key
                 FROM $table
                 WHERE user_id = %d
                   AND deleted_at IS NULL",
                $userId
            ),
            ARRAY_A
        );

        return $this->respond([
            'success' => true,
            'data'    => array_column($rows, 'compare_key'),
        ]);
    }
}
