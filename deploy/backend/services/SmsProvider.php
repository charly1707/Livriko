<?php

namespace Livriko\Services;

use RuntimeException;

final class SmsProvider
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
        if (trim((string)($config['api_url'] ?? '')) === '' || trim((string)($config['api_key'] ?? '')) === '') {
            throw new RuntimeException('Le fournisseur SMS n’est pas configuré côté serveur.');
        }
    }

    public function send(string $phone, string $message): array
    {
        $curl = curl_init($this->config['api_url']);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $this->config['api_key'], 'Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode(['to' => $phone, 'message' => $message, 'sender' => $this->config['sender_id']]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $raw = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if ($raw === false || $error !== '' || $status < 200 || $status >= 300) {
            throw new RuntimeException('SMS impossible à envoyer via le fournisseur configuré.');
        }
        return json_decode($raw, true) ?: [];
    }
}
