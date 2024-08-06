<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
$bq = $_GET['barcodes'];

$products = [
    ["barcode" => "1001", "p_name" => "Bulad", "price" => 10],
    ["barcode" => "1002", "p_name" => "Mantika", "price" => 30],
    ["barcode" => "1003", "p_name" => "Noodles", "price" => 20],
    ["barcode" => "1004", "p_name" => "Sabon", "price" => 35],
    ["barcode" => "1005", "p_name" => "Shampoo", "price" => 15]
];

$filteredProducts = array_filter($products, function($product) use ($bq) {
    return $product['barcode'] == $bq || $product['p_name'] == $bq;
});

$matchingProduct = reset($filteredProducts);

file_put_contents('log.log', $bq . PHP_EOL, FILE_APPEND);
file_put_contents('log.log', json_encode($matchingProduct) . PHP_EOL, FILE_APPEND);

echo json_encode($matchingProduct ?: []);
?>