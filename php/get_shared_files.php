<?php
session_start();
require 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    $stmt = $conn->prepare("
        SELECT
            sf.permission,
            sf.shared_at,
            uf.id AS file_id,
            uf.filename,
            uf.filepath,
            uf.upload_date,
            u.username AS shared_by_username
        FROM shared_files sf
        JOIN uploaded_files uf ON sf.file_id = uf.id
        JOIN users u ON sf.shared_by_user_id = u.id
        WHERE sf.shared_with_user_id = ?
        ORDER BY sf.shared_at DESC
    ");
    $stmt->execute([$userId]);
    $sharedFiles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'files' => $sharedFiles]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>