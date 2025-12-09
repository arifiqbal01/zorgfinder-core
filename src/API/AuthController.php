<?php
namespace ZorgFinder\API;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

defined('ABSPATH') || exit;

class AuthController extends BaseController
{
    protected $namespace = 'zorg/v1';

    public function register_routes()
    {
        register_rest_route($this->namespace, '/auth/register', [
            'methods'  => 'POST',
            'callback' => [$this, 'register_user'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($this->namespace, '/auth/login', [
            'methods'  => 'POST',
            'callback' => [$this, 'login_user'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($this->namespace, '/auth/logout', [
            'methods'  => 'POST',
            'callback' => [$this, 'logout_user'],
            'permission_callback' => [$this, 'require_auth'],
        ]);

        register_rest_route($this->namespace, '/auth/me', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_current_user'],
            'permission_callback' => '__return_true', // we return null if not logged in
        ]);
    }

    /* ===============================================================
       REGISTER USER
    =============================================================== */
    public function register_user(WP_REST_Request $request)
    {
        $params = $request->get_json_params();

        $username   = sanitize_user($params['username'] ?? '');
        $email      = sanitize_email($params['email'] ?? '');
        $password   = $params['password'] ?? '';

        $first_name = sanitize_text_field($params['first_name'] ?? '');
        $last_name  = sanitize_text_field($params['last_name'] ?? '');
        $phone      = sanitize_text_field($params['phone'] ?? '');
        $language   = sanitize_text_field($params['language'] ?? '');
        $consent    = filter_var($params['consent'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (!$consent) {
            return $this->error('Consent is required.', 400);
        }
        if (!$username || !$email || !$password) {
            return $this->error('Username, email, and password are required.', 400);
        }
        if (username_exists($username)) {
            return $this->error('Username already exists.', 400);
        }
        if (email_exists($email)) {
            return $this->error('Email already registered.', 400);
        }

        $user_id = wp_create_user($username, $password, $email);
        if (is_wp_error($user_id)) {
            return $this->error($user_id->get_error_message(), 400);
        }

        $user = new \WP_User($user_id);
        $user->set_role('zf_client');

        wp_update_user([
            'ID' => $user_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => trim("$first_name $last_name") ?: $username,
        ]);

        if ($phone) update_user_meta($user_id, 'phone', $phone);
        if ($language) update_user_meta($user_id, 'language', $language);
        update_user_meta($user_id, 'registration_consent', $consent ? '1' : '0');

        // Ensure clean login cookie for this user
        wp_clear_auth_cookie();
        wp_set_current_user($user_id);
        wp_set_auth_cookie($user_id, true);

        return $this->respond([
            'success' => true,
            'message' => 'Registration successful.',
            'user'    => $this->format_user_response($user_id),
            'nonce'   => wp_create_nonce('wp_rest'),
        ], 201);
    }

    /* ===============================================================
       LOGIN USER
    =============================================================== */
    public function login_user(WP_REST_Request $request)
    {
        $params = $request->get_json_params();
        $username = sanitize_text_field($params['username'] ?? '');
        $password = $params['password'] ?? '';

        if (!$username || !$password) {
            return $this->error('Username and password are required.', 400);
        }

        wp_clear_auth_cookie();

        $user = wp_signon([
            'user_login' => $username,
            'user_password' => $password,
            'remember' => true,
        ]);

        if (is_wp_error($user)) {
            return $this->error('Invalid login credentials.', 403);
        }

        if (!in_array('zf_client', (array) $user->roles, true)) {
            wp_clear_auth_cookie();
            return $this->error('This login is for clients only.', 403);
        }

        // Set login cookie for this user
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true);

        return $this->respond([
            'success' => true,
            'message' => 'Login successful.',
            'user'    => $this->format_user_response($user->ID),
            'nonce'   => wp_create_nonce('wp_rest'),
        ]);
    }

    /* ===============================================================
       LOGOUT USER
    =============================================================== */
    public function logout_user(WP_REST_Request $request)
    {
        wp_clear_auth_cookie();
        wp_logout();

        return $this->respond([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /* ===============================================================
       GET CURRENT USER (frontend-friendly)
       Always returns a predictable object (or null).
    =============================================================== */
    public function get_current_user(WP_REST_Request $request)
    {
        if (!is_user_logged_in()) {
            return $this->respond([
                'success' => true,
                'user' => null,
            ]);
        }

        $id = get_current_user_id();
        return $this->respond([
            'success' => true,
            'user' => $this->format_user_response($id),
        ]);
    }

    /* ===============================================================
       Format unified user response
    =============================================================== */
    private function format_user_response(int $user_id): array
    {
        $u = get_userdata($user_id);

        return [
            'id'       => $u->ID,
            'name'     => $u->display_name,
            'email'    => $u->user_email,
            'role'     => $u->roles,
            'phone'    => get_user_meta($user_id, 'phone', true),
            'language' => get_user_meta($user_id, 'language', true),
        ];
    }
}
