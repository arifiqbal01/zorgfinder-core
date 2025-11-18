<?php
/**
 * Block render: Review submission form
 *
 * Expects attributes: providerId (int), showTitle (bool), titleText (string)
 */

$provider_id = isset($attributes['providerId']) ? intval($attributes['providerId']) : 0;
$show_title  = isset($attributes['showTitle']) ? boolval($attributes['showTitle']) : true;
$title       = isset($attributes['titleText']) ? $attributes['titleText'] : "Submit a Review";

$nonce = wp_create_nonce('wp_rest');
$is_logged_in = is_user_logged_in();
?>

<div class="zf-review-form" data-nonce="<?= esc_attr($nonce) ?>" <?php if ($provider_id): ?>data-provider-id="<?= esc_attr($provider_id) ?>"<?php endif; ?>>

  <?php if ($show_title): ?>
    <h3 class="zf-review-form-title"><?= esc_html($title) ?></h3>
  <?php endif; ?>

  <?php if (!$is_logged_in): ?>
    <p class="zf-login-warning">You must <a href="<?= esc_url(wp_login_url()) ?>">log in</a> to submit a review.</p>
  <?php else: ?>

  <form class="zf-review-form-inner" novalidate>

    <?php if (!$provider_id): ?>
      <label>Choose Provider</label>
      <select class="zf-provider-id" required>
        <option value="">Select Provider</option>
        <?php
        global $wpdb;
        $providers = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}zf_providers WHERE deleted_at IS NULL ORDER BY name ASC");
        foreach ($providers as $p):
        ?>
          <option value="<?= esc_attr($p->id) ?>"><?= esc_html($p->name) ?></option>
        <?php endforeach; ?>
      </select>
    <?php else: ?>
      <input type="hidden" class="zf-provider-id" value="<?= esc_attr($provider_id) ?>" />
    <?php endif; ?>

    <label>Rating</label>
    <select class="zf-rating" required>
      <option value="">Select Rating</option>
      <option value="1">★☆☆☆☆ — 1</option>
      <option value="2">★★☆☆☆ — 2</option>
      <option value="3">★★★☆☆ — 3</option>
      <option value="4">★★★★☆ — 4</option>
      <option value="5">★★★★★ — 5</option>
    </select>

    <label>Comment</label>
    <textarea class="zf-comment" rows="4" placeholder="Write your review…" required></textarea>

    <button type="submit" class="zf-submit-btn">Submit Review</button>

    <div class="zf-message" aria-live="polite"></div>
  </form>

  <?php endif; ?>
</div>
