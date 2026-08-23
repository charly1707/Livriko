<?php

namespace Livriko\Services;

use RuntimeException;

final class MtnMomoProvider implements PaymentProvider
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
        foreach (['api_url', 'subscription_key', 'api_user', 'api_key'] as $key) {
            if (trim((string)($config[$key] ?? '')) === '') {
                throw new RuntimeException('MTN MoMo n’est pas configuré côté serveur.');
            }
        }
    }

    public function requestPayment(string $reference, float $amount, string $currency, string $phone): array
    {
        $token = $this->requestToken();
        $url = rtrim($this->config['api_url'], '/') . '/v1_0/requesttopay';
        $response = $this->request('POST', $url, [
            'Authorization: Bearer ' . $token,
            'Ocp-Apim-Subscription-Key: ' . $this->config['subscription_key'],
            'X-Reference-Id: ' . $reference,
            'X-Target-Environment: ' . ($this->config['target_environment'] ?? 'sandbox'),
            'Content-Type: application/json',
        ], [
            'amount' => number_format($amount, 2, '.', ''),
            'currency' => $currency,
            'externalId' => $reference,
            'payer' => ['partyIdType' => 'MSISDN', 'partyId' => $phone],
            'payerMessage' => 'Paiement Livriko',
            'payeeNote' => 'Commande Livriko ' . $reference,
        ]);

        if ($response['status'] !== 202) {
            throw new RuntimeException('Le fournisseur MTN MoMo a refusé la demande de paiement.');
        }

        return ['providerTransactionId' => $reference, 'status' => 'pending', 'raw' => $response['body']];
    }

    public function getPaymentStatus(string $providerTransactionId): array
    {
        $token = $this->requestToken();
        $response = $this->request('GET', rtrim($this->config['api_url'], '/') . '/v1_0/requesttopay/' . rawurlencode($providerTransactionId), [
            'Authorization: Bearer ' . $token,
            'Ocp-Apim-Subscription-Key: ' . $this->config['subscription_key'],
            'X-Target-Environment: ' . ($this->config['target_environment'] ?? 'sandbox'),
        ]);
        $status = strtolower((string)($response['body']['status'] ?? 'pending'));
        $mapped = match ($status) {
            'successful' => 'successful',
            'failed' => 'failed',
            'rejected', 'cancelled' => 'cancelled',
            default => 'pending',
        };

        return ['providerTransactionId' => $providerTransactionId, 'status' => $mapped, 'raw' => $response['body']];
    }

    private function requestToken(): string
    {
        $basic = base64_encode($this->config['api_user'] . ':' . $this->config['api_key']);
        $response = $this->request('POST', rtrim($this->config['api_url'], '/') . '/collection/token/', [
            'Authorization: Basic ' . $basic,
            'Ocp-Apim-Subscription-Key: ' . $this->config['subscription_key'],
            'Content-Type: application/json',
        ], []);
        $token = $response['body']['access_token'] ?? null;
        if (!$token) {
            throw new RuntimeException('Le fournisseur MTN MoMo n’a pas fourni de jeton.');
        }

        return $token;
    }

    private function request(string $method, string $url, array $headers, ?array $payload = null): array
    {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_POSTFIELDS => $payload === null ? null : json_encode($payload),
        ]);
        $raw = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);

        if ($raw === false || $error !== '') {
            throw new RuntimeException('Fournisseur de paiement indisponible.');
        }

        $body = json_decode($raw, true);
        if (!is_array($body)) {
            $body = [];
        }

        return ['status' => $status, 'body' => $body];
    }
}
