<?php

$url = 'countries_large.geo.json';

$countries = json_decode(file_get_contents($url), true);

$output = $countries['features'];

if($_REQUEST['type'] == 'code'){
    $selector = 'ISO_A3';
}else{
    $selector = 'ADMIN';
}

foreach($output as $key => $val ){
    if($val['properties'][$selector] == $_REQUEST['country']){
        echo json_encode($val);
        break;
    }
    
}

?>