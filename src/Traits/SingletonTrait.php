<?php
namespace ZorgFinder\Traits;

/**
 * Provides a strict, reusable singleton pattern for all ZorgFinder core classes.
 *
 * Usage:
 *   class Core {
 *       use SingletonTrait;
 *   }
 *   $core = Core::get_instance();
 */
trait SingletonTrait
{
    /**
     * The single instance of the class.
     *
     * @var static|null
     */
    private static ?self $instance = null;

    /**
     * Returns the single instance of the class.
     *
     * @return static
     */
    final public static function get_instance(): static
    {
        if (null === static::$instance) {
            static::$instance = new static();

            if (method_exists(static::$instance, 'boot')) {
                static::$instance->boot();
            }
        }

        return static::$instance;
    }

    /**
     * Protected constructor — prevents direct instantiation.
     */
    final protected function __construct() {}

    /**
     * Prevent cloning the singleton instance.
     */
    final private function __clone(): void {}

    /**
     * Prevent unserializing the singleton instance.
     */
    final public function __wakeup(): void
    {
        throw new \Exception(static::class . ' is a singleton. Cannot unserialize.');
    }
}
