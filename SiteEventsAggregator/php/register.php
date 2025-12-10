<?php
require_once 'db_connection.php';

$query = "INSERT INTO users (nickname, email, password_hash) VALUES ('qwer','qwert','123qwoyqr')";
$result=mysqli_query($mysqli,$query);



mysqli_close($mysqli);
?>