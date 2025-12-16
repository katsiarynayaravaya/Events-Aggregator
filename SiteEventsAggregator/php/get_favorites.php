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
$user_id_escaped = $mysqli->real_escape_string($user_id);

try {
    $sql = "
        SELECT 
            e.id, 
            e.title, 
            e.location, 
            e.price, 
            e.min_age, 
            e.category, 
            e.image, 
            e.description, 
            e.audience,
            ed.date,
            et.start_time, 
            et.end_time,
            f.added_at as favorite_date
        FROM favorites f
        JOIN events e ON f.event_id = e.id
        LEFT JOIN event_dates ed ON e.id = ed.event_id
        LEFT JOIN event_times et ON ed.id = et.event_date_id
        WHERE f.user_id = '$user_id_escaped'
        GROUP BY e.id, ed.date, et.start_time
        ORDER BY ed.date ASC, et.start_time ASC
    ";
    
    $result = $mysqli->query($sql);
    
    if (!$result) {
        throw new Exception('Ошибка SQL запроса: ' . $mysqli->error);
    }
    
    $events = [];
    while ($row = $result->fetch_assoc()) {
        // Форматирование даты
        if (!empty($row['date'])) {
            $date = new DateTime($row['date']);
            $row['formatted_date'] = $date->format('d.m.Y');
        }
        
        // Форматирование времени
        if (!empty($row['start_time'])) {
            $time = new DateTime($row['start_time']);
            $row['start_time_formatted'] = $time->format('H:i');
        }
        
        if (!empty($row['end_time'])) {
            $end_time = new DateTime($row['end_time']);
            $row['end_time_formatted'] = $end_time->format('H:i');
        }
        
        // Продолжительность
        if (!empty($row['start_time']) && !empty($row['end_time'])) {
            $start = new DateTime($row['start_time']);
            $end = new DateTime($row['end_time']);
            $interval = $start->diff($end);
            $row['duration_minutes'] = $interval->h * 60 + $interval->i;
        }
        
        // Изображение по умолчанию
        if (empty($row['image'])) {
            $row['image'] = '/img/logo.jpg';
        }
        
        // Дата добавления в избранное
        if (!empty($row['favorite_date'])) {
            $favDate = new DateTime($row['favorite_date']);
            $row['favorite_date_formatted'] = $favDate->format('d.m.Y H:i');
        }
        
        $events[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'total' => count($events),
        'events' => $events
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Произошла ошибка',
        'error' => $e->getMessage()
    ]);
}

$mysqli->close();
?>