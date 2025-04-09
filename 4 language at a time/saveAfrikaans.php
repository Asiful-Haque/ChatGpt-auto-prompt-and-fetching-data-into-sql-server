<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Allow CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === "POST") {
    // Database connection details
    $servername = "localhost";
    $username = "root2";
    $password = "#Kickward1a";
    $dbname = "trial";
    $table = "v3_simple_list_trial_store";

    // Connect to MySQL
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => "Database connection failed: " . $conn->connect_error]);
        exit;
    }

    // Read the raw input JSON
    $inputJSON = file_get_contents("php://input");
    error_log("Raw JSON received: " . $inputJSON); // Log raw JSON for debugging

    // Decode JSON
    $decodedData = json_decode($inputJSON, true);

    // Validate JSON format
    if (!$decodedData || !isset($decodedData['ID']) || !isset($decodedData['gptData'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON format or missing ID/gptData']);
        exit;
    }

    $ID = filter_var($decodedData['ID'], FILTER_VALIDATE_INT);
    $gptData = $decodedData['gptData'];

    if (!$ID || !is_array($gptData) || !isset($gptData['languages'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ID or gptData format']);
        exit;
    }

    // Extract language meanings
    $meaning_afrikaans = "";
    $meaning_albanian = "";
    $meaning_amharic = "";
    $meaning_armenian = "";

    foreach ($gptData['languages'] as $language) {
        if (isset($language['Entries']) && is_array($language['Entries'])) {
            switch ($language['language']) {
                case 'Afrikaans':
                    $meaning_afrikaans = json_encode(['ID' => $ID, 'Entries' => $language['Entries']], JSON_UNESCAPED_UNICODE);
                    break;
                case 'Albanian':
                    $meaning_albanian = json_encode(['ID' => $ID, 'Entries' => $language['Entries']], JSON_UNESCAPED_UNICODE);
                    break;
                case 'Amharic':
                    $meaning_amharic = json_encode(['ID' => $ID, 'Entries' => $language['Entries']], JSON_UNESCAPED_UNICODE);
                    break;
                case 'Armenian':
                    $meaning_armenian = json_encode(['ID' => $ID, 'Entries' => $language['Entries']], JSON_UNESCAPED_UNICODE);
                    break;
            }
        }
    }

    // ✅ Function to check for duplicate meanings
    function checkDuplicate($conn, $table, $column, $value, $ID) {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM $table WHERE $column = ? AND id != ?");
        if (!$stmt) {
            error_log("SQL prepare error: " . $conn->error);
            return false;
        }

        $stmt->bind_param('si', $value, $ID);
        $stmt->execute();

        $count = 0; // Ensure $count is initialized
        $stmt->bind_result($count);
        $stmt->fetch();
        $stmt->close();

        return $count > 0;
    }

    // ✅ Check if any meaning is a duplicate
    if (checkDuplicate($conn, $table, "meaning_afrikaans", $meaning_afrikaans, $ID) ||
        checkDuplicate($conn, $table, "meaning_albanian", $meaning_albanian, $ID) ||
        checkDuplicate($conn, $table, "meaning_amharic", $meaning_amharic, $ID) ||
        checkDuplicate($conn, $table, "meaning_armenian", $meaning_armenian, $ID)) {
        http_response_code(400);
        echo json_encode(['error' => 'Duplicate meaning found']);
        exit;
    }

    // ✅ Save Data (No extra JSON encoding)
    $update_sql = $conn->prepare("UPDATE $table SET status = 2, meaning_afrikaans = ?, meaning_albanian = ?, meaning_amharic = ?, meaning_armenian = ? WHERE id = ?");
    $update_sql->bind_param('ssssi', $meaning_afrikaans, $meaning_albanian, $meaning_amharic, $meaning_armenian, $ID);

    if ($update_sql->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => "Failed to update data: " . $update_sql->error]);
    }

    $update_sql->close();
    $conn->close();
}
?>
