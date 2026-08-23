<?php

namespace Livriko\Controllers;

use Livriko\Services\MapsService;

final class MapsController
{
    public function route(): void
    {
        if (!isset($_SESSION['utilisateur']['id'])) {
            $this->json(['success' => false, 'message' => 'Non authentifié.'], 401);
            return;
        }
        $payload = $_GET ?: json_decode(file_get_contents('php://input'), true) ?: [];
        $values = ['fromLat', 'fromLng', 'toLat', 'toLng'];
        foreach ($values as $value) {
            if (!isset($payload[$value]) || !is_numeric($payload[$value])) {
                $this->json(['success' => false, 'message' => 'Coordonnées GPS invalides.'], 400);
                return;
            }
        }
        try {
            $config = require __DIR__ . '/../config/production.php';
            $maps = new MapsService($config['maps']);
            $this->json(['success' => true, 'route' => $maps->route((float)$payload['fromLat'], (float)$payload['fromLng'], (float)$payload['toLat'], (float)$payload['toLng'])]);
        } catch (\Throwable $exception) {
            $this->json(['success' => false, 'message' => $exception->getMessage()], 503);
        }
    }

    private function json(array $data, int $status = 200): void { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data); exit(); }
}
