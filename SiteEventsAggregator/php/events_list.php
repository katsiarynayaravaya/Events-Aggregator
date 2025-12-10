<?php
require_once 'db_connection.php';

$result = $mysqli -> query('SELECT * FROM events');
while($row=$result -> fetch_assoc()){
    echo "Title: ".$row['title']." location: ".$row['location'].'<br>';
}

?>