<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

$servername = "localhost";
$username = "root2";
$password = "#Kickward1a";
$dbname = "trial"; 



$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}


$get_word_sql = $conn->query('select count(*) as cnt from v3_simple_list_trial_store where status=2 and id BETWEEN 1 AND 40000');

$result = $get_word_sql->fetch_assoc();



echo $result['cnt'];

$conn->close();

?>
