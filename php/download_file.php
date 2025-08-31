<?php
session_start();
require 'db.php';

// Check for authenticated user
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not authenticated.']);
    exit();
}

$fileId = $_GET['id'];
$downloaderId = $_SESSION['user_id'];

try {
    // Re-establish a PDO connection if not already connected
    $conn = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // This is the corrected query. Instead of joining with 'shared_files',
    // it now directly selects the file data from the 'uploaded_files' table,
    // as this table contains all files.
    $stmt = $conn->prepare("SELECT filepath, filename, user_id FROM uploaded_files WHERE id = :file_id");
    $stmt->bindParam(':file_id', $fileId, PDO::PARAM_INT);
    $stmt->execute();
    $file_data = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check if the file exists and the path is valid
    if (!$file_data || !file_exists('../uploads/' . $file_data['filepath'])) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found.']);
        exit();
    }

    // Log the download with both the uploader's user_id and the downloader's user_id
    $insertStmt = $conn->prepare("INSERT INTO file_downloads (file_id, user_id, downloader_id) VALUES (:file_id, :user_id, :downloader_id)");
    $insertStmt->bindParam(':file_id', $fileId, PDO::PARAM_INT);
    $insertStmt->bindParam(':user_id', $file_data['user_id'], PDO::PARAM_INT); // This is the uploader's ID from uploaded_files
    $insertStmt->bindParam(':downloader_id', $downloaderId, PDO::PARAM_INT);
    $insertStmt->execute();

    // Prepare headers for download
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($file_data['filename']) . '"');
    header('Content-Length: ' . filesize('../uploads/' . $file_data['filepath']));
    header('Pragma: public');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    readfile('../uploads/' . $file_data['filepath']);
    exit();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit();
}
