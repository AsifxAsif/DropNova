<?php
session_start();
header('Content-Type: application/json');

// Check if a language is requested and is valid
if (isset($_GET['lang']) && in_array($_GET['lang'], ['en', 'bn'])) {
    $_SESSION['lang'] = $_GET['lang'];
}

// Set a default language if a session isn't active
if (!isset($_SESSION['lang'])) {
    $_SESSION['lang'] = 'en';
}

// Include the language file based on the session
require_once "../languages/{$_SESSION['lang']}.php";

// Output the language array as JSON
echo json_encode($lang);
?>