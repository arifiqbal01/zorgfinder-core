<?php
// attributes available as $attributes
$provider = $attributes['providerId'] ?? 0;
$limit = $attributes['limit'] ?? 5;
$approved = $attributes['approvedOnly'] ?? true;
$ratingFilter = $attributes['ratingFilter'] ?? 'all';
$withComments = $attributes['withComments'] ?? false;

$params = [];

if ($provider) $params['provider_id'] = $provider;
if ($approved) $params['approved'] = 1;

// Fetch from Rest API
$url = add_query_arg($params, home_url("/wp-json/zorg/v1/reviews"));
$response = wp_remote_get($url);

$reviews = [];
if (!is_wp_error($response)) {
    $json = json_decode(wp_remote_retrieve_body($response), true);
    if ($json && $json['success']) {
        $reviews = $json['data'];
    }
}

// Filtering
$reviews = array_filter($reviews, function($r) use ($ratingFilter, $withComments) {
    if ($ratingFilter === '5' && $r['rating'] != 5) return false;
    if ($ratingFilter === '4' && $r['rating'] != 4) return false;
    if ($ratingFilter === '4-5' && $r['rating'] < 4) return false;
    if ($withComments && empty($r['comment'])) return false;
    return true;
});

$reviews = array_slice($reviews, 0, $limit);

?>
<div class="zf-reviews-block">
  <?php if (empty($reviews)) : ?>
    <p>No reviews found.</p>
  <?php else: ?>
    <?php foreach ($reviews as $r): ?>
      <div class="zf-review-item">
        <div class="zf-rating"><?= esc_html($r['rating']) ?> ⭐</div>
        <div class="zf-comment"><?= esc_html($r['comment']) ?></div>
        <div class="zf-date"><?= esc_html($r['created_at']) ?></div>
      </div>
    <?php endforeach; ?>
  <?php endif; ?>
</div>
