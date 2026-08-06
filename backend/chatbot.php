<?php
// backend/chatbot.php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$channel = $input['channel'] ?? 'assistant';
$senderRole = $input['senderRole'] ?? 'client';
$text = $input['text'] ?? '';
$history = $input['history'] ?? [];

$config = include __DIR__ . '/config/api.php';
$OPENAI_API_KEY = $config['OPENAI_API_KEY'] ?? '';

function fallback_reply($channel, $senderRole, $text) {
    $lower = strtolower(iconv('UTF-8', 'ASCII//TRANSLIT', $text));
    if ($channel === 'assistant') {
        if (strpos($lower, 'commande') !== false || strpos($lower, 'order') !== false) return 'Je peux vous aider à suivre une commande, vérifier votre panier ou expliquer les étapes de livraison.';
        if (strpos($lower, 'livreur') !== false || strpos($lower, 'course') !== false || strpos($lower, 'distance') !== false) return 'Le livreur est affecté une fois que le restaurant a confirmé la commande. La distance finale est validée au compteur.';
        if (strpos($lower, 'momo') !== false || strpos($lower, 'paiement') !== false) return 'Vous pouvez payer avec MoMo, Moov, Celtis Cash ou en espèces. Attachez le reçu si nécessaire.';
        if (strpos($lower, 'restaurant') !== false) return 'Le restaurant confirme d’abord la commande, puis demande un livreur après préparation.';
        return 'Je suis le robot assistant Livriko. Posez-moi une question sur votre commande, la livraison, ou le fonctionnement du site.';
    }
    return 'Message reçu. Nous revenons vers vous très vite.';
}

if (empty($OPENAI_API_KEY)) {
    echo json_encode(['reply' => fallback_reply($channel, $senderRole, $text)]);
    exit;
}

// Build messages for OpenAI chat completion
$messages = [];
$messages[] = [
    'role' => 'system',
    'content' => "You are Livriko assistant. Answer in French and be concise. Help users with orders, delivery, and site usage."
];

// include recent history
$maxHistory = 10;
$recent = array_slice($history, -$maxHistory);
foreach ($recent as $m) {
    $role = ($m['senderRole'] ?? '') === 'bot' ? 'assistant' : 'user';
    $messages[] = ['role' => $role, 'content' => ($m['text'] ?? '')];
}

// current user message
$messages[] = ['role' => 'user', 'content' => $text];

$payload = [
    'model' => 'gpt-3.5-turbo',
    'messages' => $messages,
    'max_tokens' => 250,
    'temperature' => 0.4,
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $OPENAI_API_KEY,
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
$response = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

if ($err || !$response) {
    echo json_encode(['reply' => fallback_reply($channel, $senderRole, $text)]);
    exit;
}

$decoded = json_decode($response, true);
if (!isset($decoded['choices'][0]['message']['content'])) {
    echo json_encode(['reply' => fallback_reply($channel, $senderRole, $text)]);
    exit;
}

$reply = trim($decoded['choices'][0]['message']['content']);

echo json_encode(['reply' => $reply]);
