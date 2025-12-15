<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once 'db_connection.php';

if (!$mysqli) {
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка подключения к базе данных',
        'error' => isset($mysqli->connect_error) ? $mysqli->connect_error : 'Неизвестная ошибка'
    ]);
    exit;
}

if (isset($_GET['id'])) {
    $event_id = (int)$_GET['id'];
    
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
            et.end_time
        FROM events e
        LEFT JOIN event_dates ed ON e.id = ed.event_id
        LEFT JOIN event_times et ON ed.id = et.event_date_id
        WHERE e.id = ?
        ORDER BY ed.date ASC, et.start_time ASC
        LIMIT 1
    ";
    
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Ошибка подготовки запроса',
            'error' => $mysqli->error
        ]);
        exit;
    }
    
    $stmt->bind_param("i", $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        if (!empty($row['date'])) {
            $date = new DateTime($row['date']);
            $row['formatted_date'] = $date->format('d.m.Y');
        }
        
        if (!empty($row['start_time'])) {
            $time = new DateTime($row['start_time']);
            $row['formatted_time'] = $time->format('H:i');
        }
        
        if (!empty($row['end_time'])) {
            $end_time = new DateTime($row['end_time']);
            $row['end_time_formatted'] = $end_time->format('H:i');
        }
        
        if (empty($row['image'])) {
            $row['image'] = '/img/logo.jpg';
        }
        
        if (!empty($row['start_time']) && !empty($row['end_time'])) {
            $start = new DateTime($row['start_time']);
            $end = new DateTime($row['end_time']);
            $interval = $start->diff($end);
            $row['duration_minutes'] = $interval->h * 60 + $interval->i;
        }
        
        echo json_encode([
            'success' => true,
            'event' => $row
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Событие не найдено'
        ]);
    }
    
    $stmt->close();
    $mysqli->close();
    exit;
}

if (isset($_GET['test'])) {
    echo json_encode([
        'success' => true,
        'message' => 'Тестовый запрос работает',
        'php_version' => phpversion(),
        'mysqli_loaded' => extension_loaded('mysqli')
    ]);
    exit;
}

try {
    $check_table = $mysqli->query("SHOW TABLES LIKE 'events'");
    if ($check_table->num_rows === 0) {
        throw new Exception('Таблица events не найдена в базе данных');
    }
    
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
            et.end_time
        FROM events e
        LEFT JOIN event_dates ed ON e.id = ed.event_id
        LEFT JOIN event_times et ON ed.id = et.event_date_id
        WHERE 1=1
    ";
    
    if (isset($_GET['date_from']) && !empty($_GET['date_from'])) {
        $date_from = $mysqli->real_escape_string($_GET['date_from']);
        $sql .= " AND ed.date >= '$date_from'";
    }
    
    if (isset($_GET['date_to']) && !empty($_GET['date_to'])) {
        $date_to = $mysqli->real_escape_string($_GET['date_to']);
        $sql .= " AND ed.date <= '$date_to'";
    }
    
    if (isset($_GET['date']) && !empty($_GET['date'])) {
        $date = $mysqli->real_escape_string($_GET['date']);
        $sql .= " AND ed.date = '$date'";
    }
    
    if (isset($_GET['cat']) && !empty($_GET['cat'])) {
        $category = urldecode($mysqli->real_escape_string($_GET['cat']));
        $sql .= " AND e.category = '$category'";
    }
    
    if (isset($_GET['q']) && !empty($_GET['q'])) {
        $search = urldecode($mysqli->real_escape_string($_GET['q']));
        $sql .= " AND (e.title LIKE '%$search%' OR e.description LIKE '%$search%' OR e.location LIKE '%$search%')";
    }
    
    if (isset($_GET['duration_type'])) {
        $duration_types = explode(',', $_GET['duration_type']);
        $duration_conditions = [];
        
        foreach ($duration_types as $duration) {
            switch ($duration) {
                case 'short':
                    $duration_conditions[] = "TIMESTAMPDIFF(MINUTE, et.start_time, et.end_time) <= 60";
                    break;
                case 'medium':
                    $duration_conditions[] = "TIMESTAMPDIFF(MINUTE, et.start_time, et.end_time) BETWEEN 61 AND 180";
                    break;
                case 'long':
                    $duration_conditions[] = "TIMESTAMPDIFF(MINUTE, et.start_time, et.end_time) > 180";
                    break;
                case 'all_day':
                    $duration_conditions[] = "TIMESTAMPDIFF(HOUR, et.start_time, et.end_time) >= 6";
                    break;
            }
        }
        
        if (!empty($duration_conditions)) {
            $sql .= " AND (" . implode(' OR ', $duration_conditions) . ")";
        }
    }
    
    if (isset($_GET['time_of_day'])) {
        $time_of_day = explode(',', $_GET['time_of_day']);
        $time_conditions = [];
        
        foreach ($time_of_day as $time) {
            switch ($time) {
                case 'morning':
                    $time_conditions[] = "TIME(et.start_time) BETWEEN '06:00:00' AND '11:59:59'";
                    break;
                case 'day':
                    $time_conditions[] = "TIME(et.start_time) BETWEEN '12:00:00' AND '17:59:59'";
                    break;
                case 'evening':
                    $time_conditions[] = "TIME(et.start_time) BETWEEN '18:00:00' AND '22:59:59'";
                    break;
                case 'night':
                    $time_conditions[] = "(TIME(et.start_time) >= '23:00:00' OR TIME(et.start_time) <= '05:59:59')";
                    break;
            }
        }
        
        if (!empty($time_conditions)) {
            $sql .= " AND (" . implode(' OR ', $time_conditions) . ")";
        }
    }
    
    if (isset($_GET['price_type'])) {
        switch ($_GET['price_type']) {
            case 'free':
                $sql .= " AND e.price = 0";
                break;
            case 'paid':
                $sql .= " AND e.price > 0";
                break;
            case 'donation':
                $sql .= " AND e.price = -1";
                break;
        }
    }
    
    if (isset($_GET['min_age'])) {
        $min_age = preg_replace('/[^0-9]/', '', $_GET['min_age']);
        if (is_numeric($min_age)) {
            $sql .= " AND e.min_age <= $min_age";
        }
    }
    
    if (isset($_GET['audience'])) {
        $audience = urldecode($mysqli->real_escape_string($_GET['audience']));
        $sql .= " AND e.audience LIKE '%$audience%'";
    }
    
    if (isset($_GET['exclude'])) {
        $exclude_id = (int)$_GET['exclude'];
        $sql .= " AND e.id != $exclude_id";
    }
    
    $sql .= " ORDER BY ed.date ASC, et.start_time ASC";
    
   
    if (isset($_GET['limit'])) {
        $limit = (int)$_GET['limit'];
        $sql .= " LIMIT $limit";
    } else {
        $sql .= " LIMIT 50";
    }
    
    $result = $mysqli->query($sql);
    
    if (!$result) {
        throw new Exception('Ошибка SQL запроса: ' . $mysqli->error . ' SQL: ' . $sql);
    }
    
    $events = [];
    while ($row = $result->fetch_assoc()) {
        
        if (!empty($row['date'])) {
            $date = new DateTime($row['date']);
            $row['formatted_date'] = $date->format('d.m.Y');
        }
        
        if (!empty($row['start_time'])) {
            $time = new DateTime($row['start_time']);
            $row['start_time_formatted'] = $time->format('H:i');
        }
        
        if (!empty($row['end_time'])) {
            $end_time = new DateTime($row['end_time']);
            $row['end_time_formatted'] = $end_time->format('H:i');
        }
        
        
        if (!empty($row['start_time']) && !empty($row['end_time'])) {
            $start = new DateTime($row['start_time']);
            $end = new DateTime($row['end_time']);
            $interval = $start->diff($end);
            $row['duration_minutes'] = $interval->h * 60 + $interval->i;
            $row['duration_hours'] = $interval->h;
        }
        
        
        if (empty($row['image'])) {
            $row['image'] = '/img/logo.jpg';
        }
        
        $events[] = $row;
    }
    
    
    echo json_encode([
        'success' => true,
        'total' => count($events),
        'events' => $events,
        'query_info' => [
            'sql' => $sql,
            'filters' => $_GET
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    
    echo json_encode([
        'success' => false,
        'message' => 'Произошла ошибка',
        'error' => $e->getMessage(),
        'debug' => [
            'filters' => $_GET
        ]
    ], JSON_UNESCAPED_UNICODE);
}


if (isset($mysqli) && $mysqli instanceof mysqli) {
    $mysqli->close();
}
?>