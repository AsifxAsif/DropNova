<?php
session_start();
include 'db.php';

header('Content-Type: application/json');

// Check if the user is authenticated.
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated.']);
    exit();
}

$userId = $_SESSION['user_id'];

// Check if file_id is provided via the URL.
if (!isset($_GET['file_id'])) {
    echo json_encode(['success' => false, 'message' => 'File ID not provided.']);
    exit();
}

$fileId = $_GET['file_id'];

try {
    $conn->beginTransaction();

    // Verify that the file is actually shared with the current user.
    $checkStmt = $conn->prepare("SELECT COUNT(*) FROM shared_files WHERE file_id = :file_id AND shared_with_user_id = :user_id");
    $checkStmt->bindParam(':file_id', $fileId, PDO::PARAM_INT);
    $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $checkStmt->execute();

    if ($checkStmt->fetchColumn() == 0) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'File is not shared with this user.']);
        exit();
    }

    // Delete the shared file entry from the database.
    $deleteStmt = $conn->prepare("DELETE FROM shared_files WHERE file_id = :file_id AND shared_with_user_id = :user_id");
    $deleteStmt->bindParam(':file_id', $fileId, PDO::PARAM_INT);
    $deleteStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

    if ($deleteStmt->execute()) {
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'File unshared successfully.']);
    } else {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'Failed to unshare the file.']);
    }

} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Database error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again.']);
}
?>