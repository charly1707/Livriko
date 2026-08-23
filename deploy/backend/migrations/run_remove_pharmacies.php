<?php
// Usage: php run_remove_pharmacies.php [--yes]
// This script backs up affected rows to JSON then executes the migration SQL.

$config = require __DIR__ . '/../config/db.php';
$dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['host'], $config['database']);

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
} catch (Exception $e) {
    fwrite(STDERR, "DB connection failed: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

$force = in_array('--yes', $argv);

if (php_sapi_name() === 'cli' && !$force) {
    echo "This will remove any 'pharmacie'/'pharmacies' categories, product categories and role from the database.\n";
    echo "A JSON backup will be created in the migrations/backups folder. Type YES to proceed: ";
    $handle = fopen('php://stdin', 'r');
    $line = fgets($handle);
    if (trim($line) !== 'YES') {
        echo "Aborted by user.\n";
        exit(0);
    }
}

$backupDir = __DIR__ . '/backups/' . date('Ymd_His');
if (!is_dir($backupDir) && !mkdir($backupDir, 0755, true)) {
    fwrite(STDERR, "Failed to create backup directory: $backupDir\n");
    exit(1);
}

$toBackup = [
    'categories_restaurants' => "SELECT * FROM categories_restaurants WHERE LOWER(slug) = 'pharmacies' OR LOWER(nom) LIKE '%pharmaci%';",
    'categories_produits' => "SELECT * FROM categories_produits WHERE LOWER(nom) LIKE '%pharmaci%';",
    'produits_pharmacy_category_text' => "SELECT * FROM produits WHERE LOWER(category) LIKE '%pharmaci%';",
    'roles_pharmacy' => "SELECT * FROM roles WHERE LOWER(code) = 'pharmacie' OR LOWER(libelle) LIKE '%pharmaci%';",
];

foreach ($toBackup as $file => $sql) {
    try {
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll();
        file_put_contents($backupDir . '/' . $file . '.json', json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo "Backed up $file -> {$backupDir}/{$file}.json (" . count($rows) . " rows)\n";
    } catch (Exception $e) {
        fwrite(STDERR, "Backup query failed for $file: " . $e->getMessage() . PHP_EOL);
    }
}

// Read SQL file and execute statements (ignoring -- comments)
$sqlFile = __DIR__ . '/20260809_remove_pharmacies.sql';
if (!file_exists($sqlFile)) {
    fwrite(STDERR, "Migration file not found: $sqlFile\n");
    exit(1);
}

$sqlContent = file_get_contents($sqlFile);
$lines = preg_split('/\r?\n/', $sqlContent);
$clean = [];
foreach ($lines as $line) {
    $trim = trim($line);
    if ($trim === '' || strpos($trim, '--') === 0) continue;
    $clean[] = $line;
}
$cleanSql = implode("\n", $clean);
$statements = array_filter(array_map('trim', explode(';', $cleanSql)));

foreach ($statements as $stmt) {
    try {
        $pdo->exec($stmt);
        echo "Executed: " . (strlen($stmt) > 70 ? substr($stmt, 0, 70) . '...' : $stmt) . "\n";
    } catch (Exception $e) {
        fwrite(STDERR, "Failed to execute statement: " . $e->getMessage() . PHP_EOL);
    }
}

echo "Migration completed. Backups are in: $backupDir\n";
