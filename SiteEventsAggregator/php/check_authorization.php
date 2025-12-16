<?php
session_start();

$response = [
    'logged_in' => false
];

if (isset($_SESSION['user_id'])) {
    $response['logged_in'] = true;
    $response['user_id'] = $_SESSION['user_id'];
    $response['user_name'] = $_SESSION['user_name'] ?? '';
}

if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    if ($response['logged_in']) {
        echo '{"logged_in":true,"user":{"name":"' . $response['user_name'] . '"}}';
    } else {
        echo '{"logged_in":false}';
    }
}
?>