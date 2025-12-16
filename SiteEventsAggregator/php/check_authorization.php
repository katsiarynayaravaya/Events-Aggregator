<?php
session_start();

if (isset($_SESSION['user_id'])) {
    echo '{"logged_in":true,"user":{"name":"' . $_SESSION['user_name'] . '"}}';
} else {
    echo '{"logged_in":false}';
}
?>