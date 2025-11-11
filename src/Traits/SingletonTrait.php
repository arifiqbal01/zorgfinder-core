<?php
namespace ZorgFinder\Traits;

trait SingletonTrait {
    private static $instance = null;

    public static function get_instance() {
        if (null === static::$instance) {
            static::$instance = new static();
        }
        return static::$instance;
    }

    final private function __clone() {}

    final public function __wakeup() {
        throw new \Exception("Cannot unserialize singleton");
    }
}
