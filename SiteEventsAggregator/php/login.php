<?php
header('Content-Type: application/json');
session_set_cookie_params(30 * 24 * 60 * 60);
session_start(); 
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

$email = $mysqli->real_escape_string(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

$query = "SELECT id, nickname, email, password_hash FROM users WHERE email = '$email'";
$result = $mysqli->query($query);

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false, 
        'field' => 'email',
        'message' => 'Пользователь с таким email не найден'
    ]);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password_hash'])) {
    echo json_encode([
        'success' => false, 
        'field' => 'password',
        'message' => 'Неверный пароль'
    ]);
    exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_name'] = $user['nickname'];

echo json_encode([
    'success' => true, 
    'message' => 'Вход выполнен успешно!',
    'user' => [
        'id' => $user['id'],
        'name' => $user['nickname'],
        'email' => $user['email']
    ]
]);

$mysqli->close();
?>