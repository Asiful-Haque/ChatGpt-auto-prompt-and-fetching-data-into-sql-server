<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "newdatabase";
    $table = "merged_four_part";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => "Connection failed: " . $conn->connect_error]);
        exit;
    }

    // Check if 'id' parameter is provided
    if (!isset($_REQUEST['id']) || empty($_REQUEST['id'])) {
        echo json_encode(['error' => 'Missing id']);
        http_response_code(400);
        exit;
    }

    // Validate 'id'
    $id = filter_var($_REQUEST['id'], FILTER_VALIDATE_INT);
    if (!$id) {
        echo json_encode(['error' => 'Invalid id']);
        http_response_code(400);
        exit;
    }

    // Update the status back to 0 to retry later
    $update_sql = $conn->prepare("UPDATE $table SET status = 0 WHERE id = ?");
    $update_sql->bind_param('i', $id);

    if ($update_sql->execute()) {
        echo json_encode(['success' => true, 'message' => "Status updated to 0 for retry."]);
    } else {
        echo json_encode(['error' => "Failed to update status: " . $update_sql->error]);
    }

    $update_sql->close(); // Close the statement
    $conn->close(); // Close the connection
}
?>
