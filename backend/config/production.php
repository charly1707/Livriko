<?php

/**
 * Production configuration loaded from server environment variables only.
 * Never expose this file or its values to the frontend.
 */
return [
    'app' => [
        'public_base_url' => rtrim((string)(getenv('PUBLIC_BASE_URL') ?: ''), '/'),
        'webhook_base_url' => rtrim((string)(getenv('WEBHOOK_BASE_URL') ?: getenv('PUBLIC_BASE_URL') ?: ''), '/'),
    ],
    'payment' => [
        'provider' => (string)(getenv('PAYMENT_PROVIDER') ?: ''),
        'currency' => (string)(getenv('PAYMENT_CURRENCY') ?: 'XOF'),
        'mtn' => [
            'api_url' => rtrim((string)(getenv('MTN_MOMO_API_URL') ?: ''), '/'),
            'subscription_key' => (string)(getenv('MTN_MOMO_SUBSCRIPTION_KEY') ?: ''),
            'api_user' => (string)(getenv('MTN_MOMO_API_USER') ?: ''),
            'api_key' => (string)(getenv('MTN_MOMO_API_KEY') ?: ''),
            'target_environment' => (string)(getenv('MTN_MOMO_TARGET_ENVIRONMENT') ?: 'sandbox'),
            'callback_secret' => (string)(getenv('MTN_MOMO_CALLBACK_SECRET') ?: ''),
        ],
        'moov' => [
            'api_url' => rtrim((string)(getenv('MOOV_MONEY_API_URL') ?: ''), '/'),
            'api_key' => (string)(getenv('MOOV_MONEY_API_KEY') ?: ''),
            'callback_secret' => (string)(getenv('MOOV_MONEY_CALLBACK_SECRET') ?: ''),
        ],
    ],
    'maps' => [
        'provider' => (string)(getenv('MAPS_PROVIDER') ?: 'osrm'),
        'api_url' => rtrim((string)(getenv('MAPS_API_URL') ?: ''), '/'),
        'api_key' => (string)(getenv('MAPS_API_KEY') ?: ''),
    ],
    'sms' => [
        'provider' => (string)(getenv('SMS_PROVIDER') ?: ''),
        'api_url' => rtrim((string)(getenv('SMS_API_URL') ?: ''), '/'),
        'api_key' => (string)(getenv('SMS_API_KEY') ?: ''),
        'sender_id' => (string)(getenv('SMS_SENDER_ID') ?: 'LIVRIKO'),
    ],
];
