<?php

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/UserModel.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/RegisterController.php';

use Livriko\Controllers\AuthController;
use Livriko\Controllers\RegisterController;

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

switch ($path) {
    case '/login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new AuthController();
            $controller->seConnecter();
        }
        include __DIR__ . '/views/login.php';
        break;

    case '/register':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new RegisterController();
            $controller->register();
        }
        include __DIR__ . '/views/register.php';
        break;

    case '/dashboard/client':
        include __DIR__ . '/views/dashboard_client.php';
        break;

    case '/dashboard/restaurant':
        include __DIR__ . '/views/dashboard_restaurant.php';
        break;

    case '/dashboard/livreur':
        include __DIR__ . '/views/dashboard_livreur.php';
        break;

    case '/dashboard/admin':
        include __DIR__ . '/views/dashboard_admin.php';
        break;

    default:
        include __DIR__ . '/views/login.php';
        break;
}
