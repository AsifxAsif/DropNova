<?php
session_start();
header('Content-Type: application/json');
require 'db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'User not authenticated.']);
    exit();
}

$user_id = $_SESSION['user_id'];

try {
    $conn = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Prepare an array to hold all insights
    $insights = [];

    // Query 1: Total Files
    $stmt = $conn->prepare("SELECT COUNT(*) AS total_files FROM uploaded_files WHERE user_id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $insights['totalFiles'] = $result['total_files'];

    // Query 2: Total Downloads
    $stmt = $conn->prepare("SELECT COUNT(*) AS total_downloads FROM file_downloads WHERE user_id = :user_id OR downloader_id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $insights['totalDownloads'] = $result['total_downloads'];

    // Query 3: Files Shared
    $stmt = $conn->prepare("SELECT COUNT(*) AS files_shared FROM shared_files WHERE shared_by_user_id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $insights['filesShared'] = $result['files_shared'];

    // Query 4: File Type Distribution
    // We use SUBSTRING_INDEX to get the file extension from the filename
    $stmt = $conn->prepare("
        SELECT SUBSTRING_INDEX(filename, '.', -1) AS file_extension, COUNT(*) as count 
        FROM uploaded_files 
        WHERE user_id = :user_id 
        GROUP BY file_extension
    ");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $fileTypeData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $insights['fileTypeDistribution'] = $fileTypeData;

    // Query 5: Activity Trend (Last 7 Days)
    $stmt = $conn->prepare("
        SELECT DATE(upload_date) AS date, COUNT(*) AS count 
        FROM uploaded_files 
        WHERE user_id = :user_id 
        AND upload_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
        GROUP BY date 
        ORDER BY date ASC
    ");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $activityData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $insights['activityTrend'] = $activityData;

    // Return all data as a single JSON object
    echo json_encode($insights);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
