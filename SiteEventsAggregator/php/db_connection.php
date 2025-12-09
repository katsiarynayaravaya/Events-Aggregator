<?php
$mysqli=new mysqli('MySQL-8.4','root','','events_aggregator');
if ($mysqli->connect_error) {
    die("Ошибка подключения к БД: " . $mysqli->connect_error);
    echo "error";
}
else{
    echo " db connected <br>";
}

$result = $mysqli -> query('SELECT * FROM events');
while($row=$result -> fetch_assoc()){
    echo "Title: ".$row['title']." location: ".$row['location'].'<br>';
}
    
?>