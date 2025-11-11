<?php
namespace ZorgFinder\Database;

use ZorgFinder\Traits\SingletonTrait;

class DBManager {
    use SingletonTrait;

    /** @var \wpdb */
    private $db;

    public function __construct() {
        global $wpdb;
        $this->db = $wpdb;
    }

    public function fetch_all(string $table): array {
        $tbl = $this->db->prefix . esc_sql($table);
        $sql = "SELECT * FROM {$tbl}";
        return (array) $this->db->get_results( $sql, ARRAY_A );
    }

    public function fetch_one(string $table, int $id): array {
        $tbl = $this->db->prefix . esc_sql($table);
        $sql = $this->db->prepare( "SELECT * FROM {$tbl} WHERE id = %d", $id );
        return (array) $this->db->get_row( $sql, ARRAY_A );
    }

    public function get_favourites(int $user_id): array {
        $tbl = $this->db->prefix . 'zf_favourites';
        $sql = $this->db->prepare( "SELECT provider_id FROM {$tbl} WHERE user_id = %d", $user_id );
        return (array) $this->db->get_results( $sql, ARRAY_A );
    }

    public function add_favourite(int $user_id, int $provider_id): bool {
        $tbl = $this->db->prefix . 'zf_favourites';
        $result = $this->db->insert(
            $tbl,
            [
                'user_id'     => $user_id,
                'provider_id' => $provider_id,
                'created_at'  => current_time('mysql'),
            ],
            [
                '%d', '%d', '%s'
            ]
        );
        return (bool) $result;
    }

    public function remove_favourite(int $user_id, int $provider_id): bool {
        $tbl = $this->db->prefix . 'zf_favourites';
        $result = $this->db->delete(
            $tbl,
            [
                'user_id'     => $user_id,
                'provider_id' => $provider_id,
            ],
            [
                '%d', '%d'
            ]
        );
        return (bool) $result;
    }
}
