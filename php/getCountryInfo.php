<?php

$url = "https://restcountries.eu/rest/v2/alpha/".$_REQUEST['countryCode'];

$ch = curl_init();

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $result=curl_exec($ch);

	curl_close($ch);

    $decode = json_decode($result,true);	
    
    $output['status']['code'] = "200";
	$output['status']['name'] = "ok";

	
    $output['data'] = $decode;
    
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>