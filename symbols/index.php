<?php
require "../include/user.php";

//Törlés, ha engineer, ha létezik, ha nem akar felsőbb könyvtárra mutatni, ha a user -ben van:
if(isset($_GET['del']) && is_file('../'.$_GET['del']) && preg_match('/\/user\//', $_GET['del']) && !preg_match('/\.\./', $_GET['del'])){
  unlink('../'.$_GET['del']);
}

if($_GET['upload'] == '1' && strlen($_FILES["data"]["name"]) > 0){
  $newname = $_FILES["data"]["name"];
  while(is_file('user/'.$newname)) {
    $newname = "_".$newname;
    if(strlen($newname) > 100){
      exit;
    }
  }
  
  move_uploaded_file($_FILES["data"]["tmp_name"],'user/'.$newname);
}




//https://www.opto22.com/support/resources-tools/demos/svg-image-library
$files = scandir("./");
sort($files);
$k = 0;
for($i = 0; $i < count($files); $i++){
 if(preg_match("/svg$/i", pathinfo($files[$i], PATHINFO_EXTENSION)))
  {
  $json1[$k++] = "symbols/".$files[$i];
  }
 
}

$k=0;
$files = scandir("./user");
for($i = 0; $i < count($files); $i++){
 if(preg_match("/svg$|jpg$|png$/i", pathinfo($files[$i], PATHINFO_EXTENSION)))
  {
  $json2[$k++] = "symbols/user/".$files[$i];
  }
 
}
$json['lib'] = $json1;
$json['user'] = $json2;
header('Content-Type: application/json; charset=utf-8');
echo json_encode($json);
?>
