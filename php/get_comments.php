<?php
session_start();
require 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$fileId = $_GET['file_id'] ?? null;

if (!$fileId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing file ID.']);
    exit();
}

try {
    $stmt = $conn->prepare("
        SELECT
            fc.comment,
            fc.created_at,
            u.username
        FROM file_comments fc
        JOIN users u ON fc.user_id = u.id
        WHERE fc.file_id = ?
        ORDER BY fc.created_at DESC
    ");
    $stmt->execute([$fileId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'comments' => $comments]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>