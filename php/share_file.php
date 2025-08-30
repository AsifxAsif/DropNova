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
$sharedWithEmail = $_POST['shared_with_email'] ?? null;
$permission = $_POST['permission'] ?? 'view';

if (!$fileId || !$sharedWithEmail) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing file ID or user email.']);
    exit();
}

try {
    // 1. Verify the file belongs to the current user
    $stmt = $conn->prepare("SELECT user_id FROM uploaded_files WHERE id = ? AND user_id = ?");
    $stmt->execute([$fileId, $_SESSION['user_id']]);
    if ($stmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to share this file.']);
        exit();
    }

    // 2. Get the ID of the user to share with
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$sharedWithEmail]);
    $sharedWithUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$sharedWithUser) {
        http_response_code(404);
        echo json_encode(['error' => 'Recipient user not found.']);
        exit();
    }
    $sharedWithUserId = $sharedWithUser['id'];

    // 3. Check if the file is already shared. If so, update the permission.
    $stmt = $conn->prepare("SELECT id FROM shared_files WHERE file_id = ? AND shared_with_user_id = ?");
    $stmt->execute([$fileId, $sharedWithUserId]);
    if ($stmt->rowCount() > 0) {
        // Update the existing permission
        $updateStmt = $conn->prepare("UPDATE shared_files SET permission = ? WHERE file_id = ? AND shared_with_user_id = ?");
        $updateStmt->execute([$permission, $fileId, $sharedWithUserId]);
        echo json_encode(['success' => true, 'message' => 'Permission updated successfully.']);
    } else {
        // Otherwise, insert a new sharing record
        $insertStmt = $conn->prepare("INSERT INTO shared_files (file_id, shared_by_user_id, shared_with_user_id, permission) VALUES (?, ?, ?, ?)");
        $insertStmt->execute([$fileId, $_SESSION['user_id'], $sharedWithUserId, $permission]);
        echo json_encode(['success' => true, 'message' => 'File shared successfully.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>