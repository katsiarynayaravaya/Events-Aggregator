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
    
    // Для детальной страницы - получаем все данные
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
    
    $event_data = null;
    $dates = [];
    $times = [];
    
    while ($row = $result->fetch_assoc()) {
        if (!$event_data) {
            // Сохраняем основную информацию о событии
            $event_data = $row;
        }
        
        // Собираем все даты
        if (!empty($row['date'])) {
            $dates[] = $row['date'];
        }
        
        // Собираем все времена с правильным форматированием
        if (!empty($row['start_time'])) {
            $start_time = $row['start_time'];
            $end_time = $row['end_time'];
            
            // Форматируем время всегда в HH:MM
            if (strlen($start_time) <= 2) {
                // Если только часы (например "17")
                $start_time = str_pad($start_time, 2, '0', STR_PAD_LEFT) . ':00';
            } elseif (strlen($start_time) > 5) {
                // Если в формате HH:MM:SS
                $start_time = substr($start_time, 0, 5);
            }
            
            if (!empty($end_time)) {
                if (strlen($end_time) <= 2) {
                    $end_time = str_pad($end_time, 2, '0', STR_PAD_LEFT) . ':00';
                } elseif (strlen($end_time) > 5) {
                    $end_time = substr($end_time, 0, 5);
                }
            }
            
            $times[] = [
                'date' => $row['date'],
                'start_time' => $start_time,
                'end_time' => $end_time
            ];
        }
    }
    
    if ($event_data) {
        // Уникальные даты
        $unique_dates = array_unique($dates);
        sort($unique_dates);
        
        // Добавляем информацию о всех датах
        if (!empty($unique_dates)) {
            $event_data['all_dates'] = implode('|', $unique_dates);
            $event_data['date'] = $unique_dates[0]; // Первая дата для основного отображения
        }
        
        // Форматируем все временные слоты для отображения
        $time_slots = [];
        $formatted_time_slots = []; // Для человекочитаемого формата
        
        foreach ($times as $time) {
            if ($time['date'] && $time['start_time']) {
                // Формат для хранения
                $slot = $time['date'] . ':' . $time['start_time'];
                if (!empty($time['end_time']) && $time['end_time'] !== $time['start_time']) {
                    $slot .= '-' . $time['end_time'];
                }
                $time_slots[] = $slot;
                
                // Человекочитаемый формат для отображения в карточке
                $formatted_start = $time['start_time'];
                $formatted_end = !empty($time['end_time']) ? $time['end_time'] : $time['start_time'];
                $time_display = $formatted_start === $formatted_end ? 
                    $formatted_start : 
                    $formatted_start . ' - ' . $formatted_end;
                
                $formatted_time_slots[] = [
                    'date' => $time['date'],
                    'display' => $time_display
                ];
            }
        }
        
        $event_data['all_time_slots'] = implode('|', array_unique($time_slots));
        $event_data['formatted_time_slots'] = $formatted_time_slots; // Для отображения в карточке
        
        // Форматируем первую дату
        if (!empty($unique_dates[0])) {
            $date = new DateTime($unique_dates[0]);
            $event_data['formatted_date'] = $date->format('d.m.Y');
        }
        
        // Форматируем первое время
        if (!empty($times[0])) {
            $event_data['start_time'] = $times[0]['start_time'];
            $event_data['first_start_time'] = $times[0]['start_time'];
            
            if (!empty($times[0]['end_time'])) {
                $event_data['end_time'] = $times[0]['end_time'];
                $event_data['first_end_time'] = $times[0]['end_time'];
            }
        }
        
        // Дефолтное изображение
        if (empty($event_data['image'])) {
            $event_data['image'] = '/img/logo.jpg';
        }
        
        // Возраст - оставляем как есть из базы
        if (isset($event_data['min_age'])) {
            $event_data['min_age'] = trim($event_data['min_age']);
        }
        
        echo json_encode([
            'success' => true,
            'event' => $event_data
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
    
    // Для списков событий - используем DISTINCT чтобы избежать дублирования
    $sql = "
        SELECT DISTINCT
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
            et.start_time
        FROM events e
        LEFT JOIN event_dates ed ON e.id = ed.event_id
        LEFT JOIN event_times et ON ed.id = et.event_date_id
        WHERE 1=1
    ";
    
    // Фильтры по дате
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
    
    // Фильтр по категории
    if (isset($_GET['cat']) && !empty($_GET['cat'])) {
        $category = urldecode($mysqli->real_escape_string($_GET['cat']));
        $sql .= " AND e.category = '$category'";
    }
    
    // Поиск
    if (isset($_GET['q']) && !empty($_GET['q'])) {
        $search = urldecode($mysqli->real_escape_string($_GET['q']));
        $sql .= " AND (e.title LIKE '%$search%' OR e.description LIKE '%$search%' OR e.location LIKE '%$search%')";
    }
    
    // Фильтр по продолжительности
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
    
    // Фильтр по времени суток
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
    
    // Фильтр по цене
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
    
    // Фильтр по возрасту
    if (isset($_GET['min_age'])) {
        $min_age = preg_replace('/[^0-9]/', '', $_GET['min_age']);
        if (is_numeric($min_age)) {
            $sql .= " AND e.min_age <= $min_age";
        }
    }
    
    // Фильтр по аудитории
    if (isset($_GET['audience'])) {
        $audience = urldecode($mysqli->real_escape_string($_GET['audience']));
        $sql .= " AND e.audience LIKE '%$audience%'";
    }
    
    // Исключить событие (для похожих событий)
    if (isset($_GET['exclude'])) {
        $exclude_id = (int)$_GET['exclude'];
        $sql .= " AND e.id != $exclude_id";
    }
    
    // Сортируем
    $sql .= " ORDER BY ed.date ASC, et.start_time ASC";
    
    // Лимит
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
    $processed_events = [];
    
    while ($row = $result->fetch_assoc()) {
        // Пропускаем дубликаты событий
        if (in_array($row['id'], $processed_events)) {
            continue;
        }
        
        // Форматируем дату
        if (!empty($row['date'])) {
            $date = new DateTime($row['date']);
            $row['formatted_date'] = $date->format('d.m.Y');
        }
        
        // Форматируем время всегда в HH:MM
        if (!empty($row['start_time'])) {
            $start_time = $row['start_time'];
            
            if (strlen($start_time) <= 2) {
                // Если только часы
                $row['start_time_formatted'] = str_pad($start_time, 2, '0', STR_PAD_LEFT) . ':00';
                $row['start_time'] = $row['start_time_formatted'];
            } elseif (strlen($start_time) > 5) {
                // Если в формате HH:MM:SS
                $row['start_time_formatted'] = substr($start_time, 0, 5);
                $row['start_time'] = $row['start_time_formatted'];
            } else {
                $row['start_time_formatted'] = $start_time;
            }
        }
        
        // Дефолтное изображение
        if (empty($row['image'])) {
            $row['image'] = '/img/logo.jpg';
        }
        
        $events[] = $row;
        $processed_events[] = $row['id'];
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
    ], JSON_UNESCAPED_UNICODE);
}

if (isset($mysqli) && $mysqli instanceof mysqli) {
    $mysqli->close();
}
?>