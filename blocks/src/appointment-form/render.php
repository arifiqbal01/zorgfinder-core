<?php
/**
 * Dynamic render template for Appointment Form block
 */

$provider_id = isset($attributes['providerId']) ? intval($attributes['providerId']) : 0;
$title = $attributes['title'] ?? 'Book an Appointment';

?>

<div 
    class="zf-appointment-form-wrapper"
    data-provider="<?php echo esc_attr($provider_id); ?>"
    data-title="<?php echo esc_attr($title); ?>"
></div>
