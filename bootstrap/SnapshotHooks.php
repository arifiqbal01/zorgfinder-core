<?php
namespace ZorgFinder\Bootstrap;

use ZorgFinder\Snapshot\ProviderSnapshotGenerator;

class SnapshotHooks {

    public static function register(): void {

        /* ------------------------------------------------------
           PROVIDER CHANGED (create or update)
        ------------------------------------------------------ */
        add_action('zf_provider_updated', function ($provider_id) {
            ProviderSnapshotGenerator::update_provider((int)$provider_id);
        });

        /* ------------------------------------------------------
           REVIEWS CHANGED (new, approved, update, delete)
        ------------------------------------------------------ */
        add_action('zf_review_changed', function ($provider_id) {
            ProviderSnapshotGenerator::update_provider((int)$provider_id);
        });

        /* ------------------------------------------------------
           REIMBURSEMENTS CHANGED
        ------------------------------------------------------ */
        add_action('zf_reimbursement_changed', function ($provider_id) {
            ProviderSnapshotGenerator::update_provider((int)$provider_id);
        });

        /* ------------------------------------------------------
           NEW: COMBINED PROVIDER + REIMBURSEMENTS UPDATE
           Used by your ProvidersExtendedController
        ------------------------------------------------------ */
        add_action('zf_provider_reimbursements_updated', function ($provider_id) {

            // ProvidersExtendedController updates both provider + reimbursements,
            // so run two hooks but avoid duplicate DB reads.
            ProviderSnapshotGenerator::update_provider((int)$provider_id);
        });

        /* ------------------------------------------------------
           NEW: BULK UPDATE HOOK (optional)
           Can be used for background tasks or CLI rebuilds
        ------------------------------------------------------ */
        add_action('zf_snapshot_rebuild_many', function ($provider_ids) {
            if (is_array($provider_ids)) {
                foreach ($provider_ids as $pid) {
                    ProviderSnapshotGenerator::update_provider((int)$pid);
                }
            }
        });
    }
}
