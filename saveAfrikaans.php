<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "newdatabase";
    $table = "merged_four_part";

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => "Connection failed: " . $conn->connect_error]);
        exit;
    }

    if (!isset($_REQUEST['id']) || !isset($_REQUEST['gptData']) || empty($_REQUEST['id']) || empty($_REQUEST['gptData'])) {
        echo json_encode(['error' => 'Missing id or gptData']);
        http_response_code(400);
        exit;
    }

    $id = filter_var($_REQUEST['id'], FILTER_VALIDATE_INT);
    if (!$id) {
        echo json_encode(['error' => 'Invalid id']);
        http_response_code(400);
        exit;
    }

    // Prepare the update statement
    $update_sql = $conn->prepare("UPDATE $table SET status = 2, cust_meanings = ? WHERE id = ?");
    if ($update_sql === false) {
        echo json_encode(['error' => "Failed to prepare statement: " . $conn->error]);
        $conn->close();
        exit;
    }

    $update_sql->bind_param('si', $_REQUEST['gptData'], $id); // Correct binding of parameters

    if ($update_sql->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => "Failed to update data: " . $update_sql->error]);
    }

    $update_sql->close(); // Close the statement
    $conn->close();
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Invalid request method.']);
}
?>
