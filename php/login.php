<?php
session_start();
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $_SESSION['login_error'] = "Invalid email format.";
        echo "<script>
            localStorage.setItem('login_error', '1');
            window.location.href = '../index.html';
        </script>";
        exit;
    }

    if (empty($password)) {
        $_SESSION['login_error'] = "Password is required.";
        echo "<script>
            localStorage.setItem('login_error', '1');
            window.location.href = '../index.html';
        </script>";
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['username']  = $user['username'];
        $_SESSION['user_role'] = $user['role'];

        // Redirect based on role
        if ($user['role'] === 'admin') {
            header("Location: ../admin.html");
        } else {
            header("Location: ../dashboard.html");
        }
        exit;
    } else {
        $_SESSION['login_error'] = "Invalid email or password.";
        echo "<script>
            localStorage.setItem('login_error', '1');
            window.location.href = '../index.html';
        </script>";
        exit;
    }
}
