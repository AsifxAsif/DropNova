<?php
session_start();
require 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$fileId = $_POST['file_id'] ?? null;
$comment = $_POST['comment'] ?? null;
$userId = $_SESSION['user_id'];

if (!$fileId || !$comment) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing file ID or comment.']);
    exit();
}

try {
    // Check if the user is the owner or has a 'view' or higher permission on the file
    $isOwner = false;
    $stmt = $conn->prepare("SELECT user_id FROM uploaded_files WHERE id = ? AND user_id = ?");
    $stmt->execute([$fileId, $userId]);
    if ($stmt->rowCount() > 0) {
        $isOwner = true;
    }

    $hasPermission = false;
    $stmt = $conn->prepare("SELECT permission FROM shared_files WHERE file_id = ? AND shared_with_user_id = ?");
    $stmt->execute([$fileId, $userId]);
    if ($stmt->rowCount() > 0) {
        $hasPermission = true;
    }

    if (!$isOwner && !$hasPermission) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to comment on this file.']);
        exit();
    }

    // Insert the comment
    $stmt = $conn->prepare("INSERT INTO file_comments (file_id, user_id, comment) VALUES (?, ?, ?)");
    $stmt->execute([$fileId, $userId, $comment]);

    echo json_encode(['success' => true, 'message' => 'Comment added successfully.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>