<?php
namespace ZorgFinder\Services;

use ZorgFinder\Traits\SingletonTrait;
use ZorgFinder\Database\DBManager;

class ProviderService {
    use SingletonTrait;

    private DBManager $db;

    public function __construct() {
        $this->db = DBManager::get_instance();
    }

    public function get_all(): array {
        return $this->db->fetch_all('zf_providers');
    }

    public function get_one(int $id): array {
        return $this->db->fetch_one('zf_providers', $id);
    }

    public function compare(array $ids): array {
        $providers = [];
        foreach ($ids as $id) {
            $providers[] = $this->get_one($id);
        }
        return $providers;
    }
}
