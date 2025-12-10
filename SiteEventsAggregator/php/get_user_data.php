<?php
header('Content-Type: application/json');
session_start();

require_once 'db_connection.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Пользователь не авторизован'
    ]);
    exit;
}

$user_id = $mysqli->real_escape_string($_SESSION['user_id']);

$query = "SELECT nickname, email, DATE(creation_time) as reg_date FROM users WHERE id = '$user_id'";
$result = $mysqli->query($query);

if (!$result || $result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Пользователь не найден в базе данных'
    ]);
    exit;
}

$user = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'user' => [
        'name' => $user['nickname'],
        'email' => $user['email'],
        'reg_date' => $user['reg_date']
    ]
]);

$mysqli->close();
?>