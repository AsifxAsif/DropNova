<?php
session_start();
header('Content-Type: application/json');

$lang = isset($_SESSION['lang']) && $_SESSION['lang'] === 'bn' ? 'bn' : 'en';

include("../" . $lang . ".php");

if (isset($lang) && is_array($lang)) {
    echo json_encode($lang);
} else {
    echo json_encode(['error' => 'Language data not found.']);
}
?>