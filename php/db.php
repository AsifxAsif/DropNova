<?php
$host = 'localhost';
$db = 'dropnova';
$user = 'root';
$pass = '';

header('Content-Type: application/json');

try {
    $conn = new PDO("mysql:host=$host;charset=utf8", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if database exists, otherwise create it
    $stmt = $conn->prepare("SHOW DATABASES LIKE :db_name");
    $stmt->execute([':db_name' => $db]);

    if ($stmt->rowCount() == 0) {
        $conn->exec("CREATE DATABASE `$db`");
    }

    $conn->exec("USE `$db`");

    // Users table with role support
    $createUsersTable = "
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ";
    $conn->exec($createUsersTable);

    // Uploaded files table
    $createFilesTable = "
    CREATE TABLE IF NOT EXISTS uploaded_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(512) NOT NULL,
        category VARCHAR(100) DEFAULT NULL,
        subfolder VARCHAR(100) DEFAULT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ";
    $conn->exec($createFilesTable);

    // File sharing table
    $createSharedFilesTable = "
    CREATE TABLE IF NOT EXISTS shared_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        shared_by_user_id INT NOT NULL,
        shared_with_user_id INT NOT NULL,
        permission VARCHAR(50) NOT NULL, -- e.g., 'view', 'edit', 'delete'
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ";
    $conn->exec($createSharedFilesTable);

    // File downloads table
    $createFileDownloadsTable = "
    CREATE TABLE IF NOT EXISTS file_downloads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        user_id INT NOT NULL,
        downloader_id INT,
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (downloader_id) REFERENCES users(id) ON DELETE SET NULL
    );
    ";
    $conn->exec($createFileDownloadsTable);

    // File comments table
    $createFileCommentsTable = "
    CREATE TABLE IF NOT EXISTS file_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ";
    $conn->exec($createFileCommentsTable);

    // Ensure role column exists even if table was created earlier without it
    $checkRoleColumn = $conn->query("SHOW COLUMNS FROM users LIKE 'role'");
    if ($checkRoleColumn->rowCount() == 0) {
        $conn->exec("ALTER TABLE users ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER password");
    }
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
}
