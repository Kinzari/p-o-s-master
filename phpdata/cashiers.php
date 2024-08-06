<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Connect to the database
$servername = "localhost";
$username = "your_db_user";
$password = "your_db_password";
$dbname = "pos_system";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

// Fetch cashiers data
$sql = "SELECT id, username, fullname, role FROM cashiers";
$result = $conn->query($sql);

$cashiers = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $cashiers[] = $row;
    }
    echo json_encode($cashiers);
} else {
    echo json_encode([]);
}

$conn->close();
?>
