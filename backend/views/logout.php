<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/UserModel.php';

use Livriko\Models\UserModel;

$userModel = new UserModel();
if (!empty(session_id())) {
    $userModel->deleteSession(session_id());
}

$_SESSION = [];
setcookie(session_name(), '', time() - 3600, '/');
session_destroy();

header('Location: /login');
exit();
