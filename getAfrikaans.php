<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$response = [];

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "newdatabase";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => "Connection failed: " . $conn->connect_error]);
        exit;
    }

    // Fetch word where status is 0
    $get_word_sql = $conn->prepare('SELECT id, meanings, word FROM merged_four_part WHERE status = 0 LIMIT 1');
    $get_word_sql->execute();
    $result = $get_word_sql->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();

        // Update the status to 1
        $update_sql = $conn->prepare('UPDATE merged_four_part SET status = 1 WHERE id = ? LIMIT 1');
        $update_sql->bind_param('i', $row['id']);
        $update_sql->execute();

        // Return the word data
        $response = [
            'id' => $row['id'],
            'meanings' => urlencode($row['meanings']),
            'word' => $row['word']
        ];
    }

    $conn->close();
}

echo json_encode($response);
?>
