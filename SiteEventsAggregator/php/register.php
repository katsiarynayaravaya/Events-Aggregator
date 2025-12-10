<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Только POST запрос']);
    exit;
}

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Нет данных']);
    exit;
}

$username = $mysqli->real_escape_string(trim($data['username'] ?? ''));
$email = $mysqli->real_escape_string(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

$check_email = $mysqli->query("SELECT id FROM users WHERE email = '$email'");
if ($check_email->num_rows > 0) {
    echo json_encode([
        'success' => false, 
        'field' => 'email',
        'message' => 'Пользователь с таким email уже существует'
    ]);
    exit;
}

$check_username = $mysqli->query("SELECT id FROM users WHERE nickname = '$username'");
if ($check_username->num_rows > 0) {
    echo json_encode([
        'success' => false, 
        'field' => 'username',
        'message' => 'Такое имя пользователя уже занято'
    ]);
    exit;
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);
$query = "INSERT INTO users (nickname, email, password_hash) 
          VALUES ('$username', '$email', '$password_hash')";

if ($mysqli->query($query)) {
    echo json_encode([
        'success' => true, 
        'message' => 'Регистрация успешна!'
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'message' => 'Ошибка при сохранении: ' . $mysqli->error
    ]);
}

$mysqli->close();
?>