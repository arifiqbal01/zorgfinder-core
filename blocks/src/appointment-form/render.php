<?php
/**
 * Server-side render for Appointment Form block
 */

$provider_id = isset($attributes['providerId'])
  ? (int) $attributes['providerId']
  : 0;

$title = isset($attributes['title'])
  ? esc_attr($attributes['title'])
  : 'Request appointment';
?>

<div
  class="zf-appointment-form-wrapper"
  data-provider="<?php echo esc_attr($provider_id); ?>"
  data-title="<?php echo esc_attr($title); ?>"
></div>
