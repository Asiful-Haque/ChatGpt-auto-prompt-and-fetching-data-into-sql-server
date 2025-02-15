<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Allow cross-origin requests from the specific domain (replace with your actual domain)
header('Access-Control-Allow-Origin: https://chatgpt.com'); // Replace with your domain
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// If this is a preflight OPTIONS request, just return a successful response
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    // Respond with 200 OK and the allowed headers
    http_response_code(200);
    exit; // Stop further script execution for preflight requests
}

// Default response message
$response = [
    'error' => 'An unexpected error occurred. Please try again later.'
];

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    // Database credentials
    $servername = "localhost";
    $username = "root2";
    $password = "#Kickward1a";
    $dbname = "trial"; 

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // Check connection
    if ($conn->connect_error) {
        $response = ['error' => "Connection failed: " . $conn->connect_error];
        echo json_encode($response);
        exit;
    }

    // Fetch word where status is 0
    $get_word_sql = $conn->prepare('SELECT id, meaning, word FROM v3_simple_list_trial_store WHERE status = 0 AND id BETWEEN 1 AND 40000 LIMIT 1');
    // $get_word_sql = $conn->prepare('SELECT id, meaning, word FROM v3_simple_list_trial_store WHERE status = 0 AND id BETWEEN 1 AND 10000 LIMIT 1');
    
    if (!$get_word_sql) {
        // Query preparation error
        $response = ['error' => 'Error preparing SQL query: ' . $conn->error];
        echo json_encode($response);
        exit;
    }

    $get_word_sql->execute();
    $result = $get_word_sql->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();

        // Update the status to 1
        $update_sql = $conn->prepare('UPDATE v3_simple_list_trial_store SET status = 1 WHERE id = ? LIMIT 1');
        // $update_sql = $conn->prepare('UPDATE v3_simple_list_trial_store SET status = 1 WHERE id = ? LIMIT 1');
        $update_sql->bind_param('i', $row['id']);
        $update_sql->execute();

        // Return the word data ----------------------------------
        $response = [
            'id' => $row['id'],
            'meaning' => urlencode($row['meaning']),
            'word' => $row['word']
        ];
    } else {
        // No word found
        $response = ['error' => 'No word found'];
    }

    $conn->close();
}

// Send response as JSON
echo json_encode($response);
?>
