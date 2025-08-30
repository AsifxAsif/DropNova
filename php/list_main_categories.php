<?php
session_start();
require 'db.php'; // Ensure db.php establishes $conn PDO connection

header('Content-Type: application/json'); // Ensure the content type is JSON

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Select distinct main categories that have files for the current user
    $sql = "SELECT DISTINCT category FROM uploaded_files WHERE user_id = ?";

    // Exclude NULL or empty categories if they exist, and 'other' if you don't want it as a main folder
    $sql .= " AND category IS NOT NULL AND category != ''";

    $sql .= " ORDER BY category ASC"; // Order alphabetically

    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the output to just contain category names
    $mainFolderNames = [];
    foreach ($categories as $row) {
        $mainFolderNames[] = ['name' => $row['category']]; // Wrap in an object with 'name' key
    }

    echo json_encode($mainFolderNames);

} catch (PDOException $e) {
    error_log("Database error in list_main_categories.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>