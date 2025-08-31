<?php
session_start();
require 'db.php';

// check if logged in user is admin
function isAdmin($conn, $userId)
{
    if (!$conn || !$userId) {
        return false;
    }
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $role = $stmt->fetchColumn();
    return $role === 'admin';
}

if (!isset($_SESSION['user_id']) || !isAdmin($conn, $_SESSION['user_id'])) {
    http_response_code(403);
    die(json_encode(["error" => "Forbidden"]));
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_all':
        $data = [];

        // Users
        $stmt = $conn->query("SELECT id, username, email, role, created_at FROM users");
        $data['users'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Files
        $stmt = $conn->query("
            SELECT f.id, f.filename, f.filepath, f.category, f.upload_date, u.username AS owner
            FROM uploaded_files f
            JOIN users u ON f.user_id = u.id
        ");
        $data['files'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Shared files
        $stmt = $conn->query("
            SELECT s.id, f.filename, u1.username AS shared_by, u2.username AS shared_with, s.permission, s.shared_at
            FROM shared_files s
            JOIN uploaded_files f ON s.file_id = f.id
            JOIN users u1 ON s.shared_by_user_id = u1.id
            JOIN users u2 ON s.shared_with_user_id = u2.id
        ");
        $data['shared_files'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Downloads
        $stmt = $conn->query("
            SELECT d.id, f.filename, u.username AS owner, u2.username AS downloader_name, d.downloaded_at
            FROM file_downloads d
            JOIN uploaded_files f ON d.file_id = f.id
            JOIN users u ON d.user_id = u.id
            JOIN users u2 ON d.downloader_id = u2.id
        ");
        $data['downloads'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Comments
        $stmt = $conn->query("
            SELECT c.id, f.filename, u.username AS commenter, c.comment, c.created_at
            FROM file_comments c
            JOIN uploaded_files f ON c.file_id = f.id
            JOIN users u ON c.user_id = u.id
        ");
        $data['comments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($data);
        break;

    default:
        echo json_encode(["error" => "Invalid action"]);
}
