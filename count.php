<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

$servername = "localhost";
$username = "root2";
$password = "#Kickward1a";
$dbname = "merged_four_part";



$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}


$get_word_sql = $conn->query('select count(*) as cnt from merged_four_part where status=2 and id BETWEEN 30001 AND 34000');

$result = $get_word_sql->fetch_assoc();



echo $result['cnt'];

$conn->close();

?>
