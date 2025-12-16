<?php
header('Content-Type: application/json');
session_start();
require_once 'db_connection.php';

if (!$mysqli) {
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка подключения к базе данных'
    ]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'logged_in' => false,
        'message' => 'Пользователь не авторизован'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['event_id']) || !is_numeric($input['event_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Не указан ID события'
        ]);
        exit;
    }
    
    $user_id_escaped = $mysqli->real_escape_string($user_id);
    $event_id = (int)$input['event_id'];
    
    $check_event = $mysqli->query("SELECT id FROM events WHERE id = $event_id");
    if (!$check_event || $check_event->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Событие не найдено'
        ]);
        exit;
    }
    
    $check_favorite = $mysqli->query("
        SELECT * FROM favorites 
        WHERE user_id = '$user_id_escaped' AND event_id = $event_id
    ");
    
    $is_favorite = $check_favorite && $check_favorite->num_rows > 0;
    
    if ($is_favorite) {
        $sql = "DELETE FROM favorites 
                WHERE user_id = '$user_id_escaped' AND event_id = $event_id";
        
        if ($mysqli->query($sql)) {
            echo json_encode([
                'success' => true,
                'action' => 'removed',
                'message' => 'Событие удалено из избранного'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Ошибка удаления: ' . $mysqli->error
            ]);
        }
    } else {
        $sql = "INSERT INTO favorites (user_id, event_id, added_at) 
                VALUES ('$user_id_escaped', $event_id, NOW())";
        
        if ($mysqli->query($sql)) {
            echo json_encode([
                'success' => true,
                'action' => 'added',
                'message' => 'Событие добавлено в избранное'
            ]);
        } else {
            if ($mysqli->errno == 1062) {
                echo json_encode([
                    'success' => true,
                    'action' => 'added',
                    'message' => 'Событие уже в избранном'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Ошибка добавления: ' . $mysqli->error
                ]);
            }
        }
    }
    
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['check'])) {
    if (!isset($_GET['event_id']) || !is_numeric($_GET['event_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Не указан ID события'
        ]);
        exit;
    }
    
    $user_id_escaped = $mysqli->real_escape_string($user_id);
    $event_id = (int)$_GET['event_id'];
    
    $sql = "SELECT * FROM favorites 
            WHERE user_id = '$user_id_escaped' AND event_id = $event_id";
    
    $result = $mysqli->query($sql);
    $is_favorite = $result && $result->num_rows > 0;
    
    echo json_encode([
        'success' => true,
        'logged_in' => true,
        'is_favorite' => $is_favorite
    ]);
    exit;
}

echo json_encode([
    'success' => false,
    'message' => 'Неизвестный метод запроса'
]);

$mysqli->close();
?>