<?php
$provider_id = isset($attributes['providerId'])
  ? (int) $attributes['providerId']
  : 0;

$title = isset($attributes['title'])
  ? esc_attr($attributes['title'])
  : 'Submit a Review';

wp_enqueue_script('zorgfinder-reviews-frontend');
?>

<div
  class="zf-reviews"
  data-provider-id="<?php echo esc_attr($provider_id); ?>"
></div>

