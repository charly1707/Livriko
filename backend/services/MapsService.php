<?php

namespace Livriko\Services;

use RuntimeException;

final class MapsService
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
        if (trim((string)($config['api_url'] ?? '')) === '') {
            throw new RuntimeException('Le fournisseur cartographique n’est pas configuré côté serveur.');
        }
    }

    /** Returns the provider route response; provider-specific mapping belongs in its adapter. */
    public function route(float $fromLat, float $fromLng, float $toLat, float $toLng): array
    {
        $url = rtrim($this->config['api_url'], '/') . '/route/v1/driving/' . $fromLng . ',' . $fromLat . ';' . $toLng . ',' . $toLat . '?overview=full&geometries=geojson';
        $headers = ['Accept: application/json'];
        if (!empty($this->config['api_key'])) {
            $headers[] = 'Authorization: Bearer ' . $this->config['api_key'];
        }

        $curl = curl_init($url);
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 15]);
        $raw = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);

        if ($raw === false || $error !== '' || $status < 200 || $status >= 300) {
            throw new RuntimeException('API GPS indisponible.');
        }

        $body = json_decode($raw, true);
        if (!is_array($body)) {
            throw new RuntimeException('Réponse cartographique invalide.');
        }

        return $body;
    }
}
