<?php
echo "<h2>Проверка mongodb без dl()</h2>";

// 1. Просто проверяем расширение
if (extension_loaded('mongodb')) {
    echo "<p style='color: green; font-size: 24px;'>✅ MONGODB РАБОТАЕТ!</p>";
    echo "<p>Версия: " . phpversion('mongodb') . "</p>";
    
    // Тест подключения
    echo "<hr><h3>Тест подключения к Atlas:</h3>";
    
    require_once '../vendor/autoload.php';
    
    $uri = trim(file_get_contents('.env'));
    $safeUri = preg_replace('/:(.*?)@/', ':****@', $uri);
    
    try {
        $client = new MongoDB\Client($uri);
        echo "✅ Клиент создан<br>";
        
        $db = $client->selectDatabase('admin');
        $result = $db->command(['ping' => 1]);
        
        echo "<p style='color: green;'>✅ MongoDB Atlas отвечает!</p>";
        
    } catch (Exception $e) {
        echo "❌ Ошибка подключения: " . $e->getMessage();
    }
    
} else {
    echo "<p style='color: red; font-size: 24px;'>❌ MONGODB НЕ ЗАГРУЖЕНО</p>";
    
    // Проверяем module.ini
    echo "<h3>Что проверить:</h3>";
    echo "1. Файл <code>E:\\OSPanel\\modules\\PHP-8.2\\module.ini</code> должен содержать:<br>";
    echo "<pre>[main]
profile = default
enabled = 1

[profile.default]
extension = mongodb</pre>";
    
    echo "2. Файл DLL должен быть в: <code>E:\\OSPanel\\modules\\PHP-8.2\\PHP\\ext\\php_mongodb.dll</code><br>";
    
    echo "3. Перезапустите OpenServer после изменений<br>";
}
?>