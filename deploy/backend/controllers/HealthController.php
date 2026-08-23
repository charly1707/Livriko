<?php

namespace Livriko\Controllers;

use Livriko\Config\Database;

final class HealthController
{
    public function database(): void
    {
        $expectedToken = (string)(getenv('HEALTHCHECK_TOKEN') ?: '');
        $providedToken = (string)($_SERVER['HTTP_X_HEALTHCHECK_TOKEN'] ?? '');
        if ($expectedToken === '' || $providedToken === '' || !hash_equals($expectedToken, $providedToken)) {
            http_response_code(404);
            return;
        }

        try {
            Database::getInstance()->query('SELECT 1');
            $this->respond(['status' => 'Database connection: OK']);
        } catch (\Throwable $exception) {
            error_log('Database health check failed: ' . $exception->getMessage());
            $this->respond(['status' => 'Database connection: FAILED'], 503);
        }
    }

    private function respond(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload);
    }
}
