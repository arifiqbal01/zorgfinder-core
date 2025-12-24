<?php
namespace ZorgFinder\Database\Migrations;

// Import the migration classes you want to run
use ZorgFinder\Database\Migrations\CreateProvidersTable;
use ZorgFinder\Database\Migrations\CreateFavouritesTable;
use ZorgFinder\Database\Migrations\CreateReimbursementsTable;
use ZorgFinder\Database\Migrations\CreateReviewsTable;
use ZorgFinder\Database\Migrations\CreateAppointmentsTable;
use ZorgFinder\Database\Migrations\CreateProviderSnapshotTable;
use ZorgFinder\Database\Migrations\CreateSavedComparesTable;
use ZorgFinder\Database\Migrations\CreateReviewInvitesTable;

/**
 * Handles running all ZorgFinder database migrations.
 * Each migration must have an `up()` method.
 */
class MigrationRunner {

    /**
     * Run all migrations in the correct order.
     */
    public function run(): void {
        // List of migrations (order matters!)
        $migrations = [
            new CreateProvidersTable(),
            new CreateReimbursementsTable(),
            new CreateFavouritesTable(),
            new CreateReviewsTable(),
            new CreateAppointmentsTable(),
            new CreateProviderSnapshotTable(),
            new CreateSavedComparesTable(),
            new CreateReviewInvitesTable(),
        ];

        foreach ($migrations as $migration) {
            if (method_exists($migration, 'up')) {
                try {
                    $migration->up();
                } catch (\Throwable $e) {
                    error_log('[ZorgFinder Migration Error] ' . $e->getMessage());
                }
            }
        }
    }
}
