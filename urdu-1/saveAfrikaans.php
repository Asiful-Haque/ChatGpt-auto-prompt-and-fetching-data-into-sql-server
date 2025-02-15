<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Allow CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === "POST") {
    $servername = "localhost";
    $username = "root2";
    $password = "#Kickward1a";
    $dbname = "trial";
    $table = "v3_simple_list_trial_store";

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => "Connection failed: " . $conn->connect_error]);
        exit;
    }

    // Validate POST request data
    if (!isset($_POST['ID']) || !isset($_POST['gptData']) || empty($_POST['ID']) || empty($_POST['gptData'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing ID or gptData']);
        exit;
    }

    $ID = filter_var($_POST['ID'], FILTER_VALIDATE_INT);
    $gptData = json_decode($_POST['gptData'], true);

    if (!$ID || !is_array($gptData) || !isset($gptData['ID']) || $gptData['ID'] != $ID) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ID or mismatched gptData']);
        exit;
    }

    // Convert gptData to JSON string for storage
    $meaning = json_encode($gptData, JSON_UNESCAPED_UNICODE);

    // Check for duplicates
    $existing_sql = $conn->prepare("SELECT COUNT(*) FROM $table WHERE meaning_urdu = ? AND id != ?");
    $existing_sql->bind_param('si', $meaning, $ID);
    $existing_sql->execute();
    $existing_sql->bind_result($count);
    $existing_sql->fetch();
    $existing_sql->close();

    if ($count > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Duplicate meaning found']);
        exit;
    }

    // Update the database
    $update_sql = $conn->prepare("UPDATE $table SET status = 2, meaning_urdu = ? WHERE id = ?");
    if (!$update_sql) {
        http_response_code(500);
        echo json_encode(['error' => 'SQL preparation failed: ' . $conn->error]);
        exit;
    }

    error_log("Debug - Meaning: " . $meaning);
    error_log("Debug - ID: " . $ID);
    $update_sql->bind_param('si', $meaning, $ID);
    echo $meaning;

    if ($update_sql->execute()) {
        echo json_encode(['success' => true, 'gptData' => $meaning]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => "Failed to update data: " . $update_sql->error]);
    }

    $update_sql->close();
    $conn->close();
}
?>
