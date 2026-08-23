<?php

namespace Livriko\Controllers;

use Livriko\Models\RestaurantModel;

final class RestaurantController
{
    public function list(): void
    {
        try {
            $restaurants = (new RestaurantModel())->findAll();
            $this->json(['success' => true, 'restaurants' => array_map(static function (array $restaurant): array {
                return [
                    'id' => (int)$restaurant['id'],
                    'name' => $restaurant['nom'],
                    'ownerId' => (string)$restaurant['proprietaire_id'],
                    'address' => $restaurant['adresse'],
                    'city' => $restaurant['ville'],
                    'phone' => $restaurant['telephone'],
                    'momoPhone' => $restaurant['momo_phone'],
                    'logo' => $restaurant['logo'],
                    'isOpen' => $restaurant['statut'] === 'approuve',
                    'isCertified' => (bool)$restaurant['est_certifie'],
                    'description' => $restaurant['description'],
                ];
            }, $restaurants)]);
        } catch (\Throwable $exception) {
            error_log('Restaurant listing error: ' . $exception->getMessage());
            $this->json(['success' => false, 'message' => 'Impossible de récupérer les boutiques.'], 503);
        }
    }

    private function json(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload);
    }
}
