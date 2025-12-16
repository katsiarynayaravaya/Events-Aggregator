<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Не авторизован']);
    exit;
}

$user_id = $_SESSION['user_id'];
$check_user = $mysqli->query("SELECT role FROM users WHERE id = $user_id");
if ($check_user->num_rows === 0) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
    exit;
}

$user = $check_user->fetch_assoc();
if (($user['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Только для администраторов']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Только POST запрос']);
    exit;
}

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Некорректный JSON']);
    exit;
}

$errors = [];

$required = ['title', 'category', 'location', 'dates'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        $errors[] = "Поле '{$field}' обязательно для заполнения";
    }
}

$allowedCategories = ['Концерты', 'Театр', 'Выставки', 'Кино', 'Спорт', 'Образование', 'Вечеринки', 'Дети', 'Еда', 'Отдых', 'Юмор', 'Другое'];
if (!empty($data['category']) && !in_array($data['category'], $allowedCategories)) {
    $errors[] = 'Недопустимая категория';
}

$allowedAges = ['0+', '6+', '12+', '16+', '18+'];
if (!empty($data['min_age']) && !in_array($data['min_age'], $allowedAges)) {
    $errors[] = 'Недопустимое возрастное ограничение';
}

if (isset($data['price']) && (!is_numeric($data['price']) || $data['price'] < 0)) {
    $errors[] = 'Цена должна быть неотрицательным числом';
}

if (!empty($data['dates']) && is_array($data['dates'])) {
    foreach ($data['dates'] as $dateIndex => $dateItem) {
        if (empty($dateItem['date']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateItem['date'])) {
            $errors[] = "Некорректная дата #" . ($dateIndex + 1);
        }
        
        $eventDate = new DateTime($dateItem['date']);
        $today = new DateTime('today');
        if ($eventDate < $today) {
            $errors[] = "Дата #" . ($dateIndex + 1) . " не может быть в прошлом";
        }
        
        if (empty($dateItem['time_blocks']) || !is_array($dateItem['time_blocks'])) {
            $errors[] = "Добавьте хотя бы одно время для даты #" . ($dateIndex + 1);
        } else {
            foreach ($dateItem['time_blocks'] as $timeIndex => $timeBlock) {
                if (empty($timeBlock['start_time']) || !preg_match('/^\d{2}:\d{2}$/', $timeBlock['start_time'])) {
                    $errors[] = "Укажите время начала для даты #" . ($dateIndex + 1) . ", блок " . ($timeIndex + 1);
                }
                
                if (!empty($timeBlock['end_time']) && $timeBlock['start_time'] >= $timeBlock['end_time']) {
                    $errors[] = "Время окончания должно быть позже времени начала (дата #" . ($dateIndex + 1) . ", блок " . ($timeIndex + 1) . ")";
                }
            }
        }
    }
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

$mysqli->begin_transaction();

try {
    $title = $mysqli->real_escape_string(trim($data['title']));
    $category = $mysqli->real_escape_string($data['category']);
    $location = $mysqli->real_escape_string(trim($data['location']));
    $price = floatval($data['price']);
    $min_age = isset($data['min_age']) ? $mysqli->real_escape_string($data['min_age']) : '0+';
    $description = isset($data['description']) ? $mysqli->real_escape_string(trim($data['description'])) : '';
    
    $image = isset($data['image_url']) ? $mysqli->real_escape_string(trim($data['image_url'])) : '';
    
    $audience = '';
    if (!empty($data['audience']) && is_array($data['audience'])) {
        $audience_array = array_map(function($item) use ($mysqli) {
            return $mysqli->real_escape_string($item);
        }, $data['audience']);
        $audience = implode(', ', $audience_array);
    }
    
    $query_events = "INSERT INTO events 
                    (title, category, location, price, min_age, description, image, audience, creation_time) 
                    VALUES 
                    ('$title', '$category', '$location', $price, '$min_age', '$description', '$image', '$audience', NOW())";
    
    if (!$mysqli->query($query_events)) {
        throw new Exception('Ошибка при сохранении события: ' . $mysqli->error);
    }
    
    $event_id = $mysqli->insert_id;
    
    foreach ($data['dates'] as $dateItem) {
        $date = $mysqli->real_escape_string($dateItem['date']);
        $query_dates = "INSERT INTO event_dates (event_id, date) 
                       VALUES ($event_id, '$date')";
        
        if (!$mysqli->query($query_dates)) {
            throw new Exception('Ошибка при сохранении даты: ' . $mysqli->error);
        }
        
        $event_date_id = $mysqli->insert_id;
        
        foreach ($dateItem['time_blocks'] as $timeBlock) {
            $start_time = $mysqli->real_escape_string($timeBlock['start_time']);
            $end_time = !empty($timeBlock['end_time']) ? "'" . $mysqli->real_escape_string($timeBlock['end_time']) . "'" : 'NULL';
            
            $duration = 'NULL';
            if (!empty($timeBlock['end_time'])) {
                $start = new DateTime($timeBlock['start_time']);
                $end = new DateTime($timeBlock['end_time']);
                $diff = $start->diff($end);
                $duration_minutes = $diff->h * 60 + $diff->i;
                $duration = $duration_minutes;
            }
            
            $query_times = "INSERT INTO event_times 
                           (event_date_id, event_id, start_time, end_time, duration) 
                           VALUES 
                           ($event_date_id, $event_id, '$start_time', $end_time, $duration)";
            
            if (!$mysqli->query($query_times)) {
                throw new Exception('Ошибка при сохранении времени: ' . $mysqli->error);
            }
        }
    }
    
    $mysqli->commit();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Событие успешно добавлено',
        'event_id' => $event_id
    ]);
    
} catch (Exception $e) {
    $mysqli->rollback();
    
    error_log("Ошибка добавления события: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Ошибка сервера: ' . $e->getMessage()
    ]);
}
?>