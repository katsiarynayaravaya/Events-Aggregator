<?php
$mysqli = new mysqli('MySQL-8.4', 'root', '', 'events_aggregator');
if ($mysqli->connect_error) {
    die("Ошибка подключения к БД: " . $mysqli->connect_error);
}
?>