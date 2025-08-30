<?php
session_start();
require 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$fileId = $_GET['file_id'] ?? null;

if (!$fileId) {
    echo json_encode(['success' => false, 'message' => 'File ID not provided.']);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT 
            u.email,
            sf.permission
        FROM shared_files sf
        JOIN users u ON sf.shared_with_user_id = u.id
        WHERE sf.file_id = ? AND sf.shared_by_user_id = ?
    ");
    $stmt->execute([$fileId, $_SESSION['user_id']]);
    $sharedUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'users' => $sharedUsers]);

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred.']);
}
?>