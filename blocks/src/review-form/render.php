<?php
$provider_id = $attributes['providerId'] ?? 0;
$show_title  = $attributes['showTitle'] ?? true;
$title       = $attributes['titleText'] ?? "Submit a Review";

$nonce = wp_create_nonce('wp_rest');
$is_logged_in = is_user_logged_in();
?>

<div class="zf-review-form" data-nonce="<?= esc_attr($nonce) ?>">

  <?php if ($show_title): ?>
    <h3 class="zf-review-form-title"><?= esc_html($title) ?></h3>
  <?php endif; ?>

  <?php if (!$is_logged_in): ?>
    <p class="zf-login-warning">You must <a href="<?= wp_login_url() ?>">log in</a> to submit a review.</p>
  <?php else: ?>

  <form class="zf-review-form-inner">

    <?php if (!$provider_id): ?>
      <label>Choose Provider</label>
      <select class="zf-provider-id" required>
        <option value="">Select Provider</option>
        <?php
        global $wpdb;
        $providers = $wpdb->get_results("SELECT id, name FROM {$wpdb->prefix}zf_providers WHERE deleted_at IS NULL ORDER BY name ASC");
        foreach ($providers as $p):
        ?>
          <option value="<?= $p->id ?>"><?= esc_html($p->name) ?></option>
        <?php endforeach; ?>
      </select>
    <?php else: ?>
      <input type="hidden" class="zf-provider-id" value="<?= esc_attr($provider_id) ?>" />
    <?php endif; ?>

    <label>Rating</label>
    <div class="zf-stars" data-selected="0">
      <?php for ($i=1; $i<=5; $i++): ?>
        <span data-star="<?= $i ?>">★</span>
      <?php endfor; ?>
    </div>

    <input type="hidden" class="zf-rating" value="0" required />

    <label>Comment</label>
    <textarea class="zf-comment" rows="4" placeholder="Write your review…" required></textarea>

    <button type="submit" class="zf-submit-btn">Submit Review</button>

    <div class="zf-message"></div>
  </form>

  <?php endif; ?>
</div>