<?php

function livrikoRequiredDatabaseEnv(string $name): string
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        throw new RuntimeException('Configuration de production incomplète : variable serveur manquante.');
    }

    return $value;
}

$host = livrikoRequiredDatabaseEnv('DB_HOST');
if (in_array(strtolower($host), ['localhost', '127.0.0.1', '::1'], true)) {
    throw new RuntimeException('Configuration de production invalide : hôte MySQL local interdit.');
}

return [
    'host' => $host,
    'database' => livrikoRequiredDatabaseEnv('DB_NAME'),
    'username' => livrikoRequiredDatabaseEnv('DB_USER'),
    'password' => livrikoRequiredDatabaseEnv('DB_PASSWORD'),
    'port' => livrikoRequiredDatabaseEnv('DB_PORT'),
];