<?php

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/UserModel.php';
require_once __DIR__ . '/models/ProductModel.php';
require_once __DIR__ . '/models/RestaurantModel.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/RegisterController.php';
require_once __DIR__ . '/controllers/ChatController.php';
require_once __DIR__ . '/controllers/ApiAuthController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/ReviewController.php';
require_once __DIR__ . '/controllers/OrderController.php';
require_once __DIR__ . '/controllers/PaymentController.php';
require_once __DIR__ . '/controllers/MapsController.php';
require_once __DIR__ . '/controllers/ServiceExpressController.php';
require_once __DIR__ . '/controllers/SubscriptionController.php';
require_once __DIR__ . '/controllers/RestaurantController.php';
require_once __DIR__ . '/controllers/HealthController.php';

use Livriko\Controllers\AuthController;
use Livriko\Controllers\RegisterController;
use Livriko\Controllers\ChatController;
use Livriko\Controllers\ApiAuthController;
use Livriko\Controllers\ProductController;
use Livriko\Controllers\OrderController;
use Livriko\Controllers\PaymentController;
use Livriko\Controllers\MapsController;
use Livriko\Controllers\ServiceExpressController;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$path = $uri;

if ($scriptName && strpos($path, $scriptName) === 0) {
    $path = substr($path, strlen($scriptName));
} elseif ($scriptName) {
    $indexPath = rtrim(dirname($scriptName), '/') . '/index.php';
    if (strpos($path, $indexPath) === 0) {
        $path = substr($path, strlen($indexPath));
    } elseif (strpos($path, dirname($scriptName)) === 0) {
        $path = substr($path, strlen(dirname($scriptName)));
    }
}

if ($path === '') {
    $path = '/';
}

if (strpos($path, '/api/') === 0) {
    header('Content-Type: application/json; charset=utf-8');
}

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

    case '/dashboard':
        if (!isset($_SESSION['utilisateur'])) {
            header('Location: /login');
            exit();
        }

        $role = $_SESSION['utilisateur']['role'] ?? '';
        $redirect = match ($role) {
            'client' => '/dashboard/client',
            'restaurant', 'vendeur' => '/dashboard/restaurant',
            'livreur' => '/dashboard/livreur',
            'administrateur' => '/dashboard/admin',
            default => '/login',
        };

        header('Location: ' . $redirect);
        exit();

    case '/logout':
        include __DIR__ . '/views/logout.php';
        break;

    // Chat API endpoints
    case '/api/chat/create':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ChatController();
            $orderId = (int)($_POST['order_id'] ?? 0);
            $controller->getOrCreateConversationForOrder($orderId);
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/chat/messages':
        $controller = new ChatController();
        $controller->getMessages();
        exit();

    case '/api/chat/send':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ChatController();
            $controller->sendMessage();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/chat/add_participant':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ChatController();
            $controller->addParticipant();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/chat/mark_read':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ChatController();
            $controller->markRead();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/chat/upload':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ChatController();
            $controller->uploadImage();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/auth/login':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ApiAuthController();
            $controller->login();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/auth/register':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ApiAuthController();
            $controller->register();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/auth/logout':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ApiAuthController();
            $controller->logout();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/auth/me':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $controller = new ApiAuthController();
            $controller->me();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/subscriptions':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            (new \Livriko\Controllers\SubscriptionController())->subscribe();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/products/upload-image':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ProductController();
            $controller->uploadImage();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/products':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $controller = new ProductController();
            $controller->listAllProducts();
            exit();
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ProductController();
            $controller->createProduct();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/restaurants':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            (new \Livriko\Controllers\RestaurantController())->list();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/health/db':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            (new \Livriko\Controllers\HealthController())->database();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/orders':
        $controller = new OrderController();
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $controller->list();
            exit();
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->create();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/orders/status':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new OrderController();
            $controller->updateStatus();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/payments/transactions':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            (new PaymentController())->createTransaction();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/payments/status':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            (new PaymentController())->status();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/maps/route':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            (new MapsController())->route();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/service-express':
        $controller = new ServiceExpressController();
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $controller->list();
            exit();
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller->create();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/service-express/status':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ServiceExpressController();
            $controller->updateStatus();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/reviews/create':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new \Livriko\Controllers\ReviewController();
            $controller->create();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/reviews/driver':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $controller = new \Livriko\Controllers\ReviewController();
            $controller->listForDriver();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/reviews/admin':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $controller = new \Livriko\Controllers\ReviewController();
            $controller->adminList();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/reviews/report':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new \Livriko\Controllers\ReviewController();
            $controller->createReport();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/products/update':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ProductController();
            $controller->updateProduct();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/products/delete':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $controller = new ProductController();
            $controller->deleteProduct();
            exit();
        }
        http_response_code(405);
        exit();

    case '/api/products/restaurant':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $controller = new ProductController();
            $controller->listProducts();
            exit();
        }
        http_response_code(405);
        exit();

    default:
        if (strpos($path, '/api/') === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            exit();
        }

        include __DIR__ . '/views/login.php';
        break;
}
