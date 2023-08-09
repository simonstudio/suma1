<?php
header('Content-Type: application/json; charset=utf-8');
// echo json_encode(array(
//     "post" => $_POST
// ));

$Settings['spender'] = "";

$Settings = json_decode(file_get_contents("settings.json"), true) or die(json_encode(array('status' => false, "error" => "settings not found")));

function saveSettings($settings = [])
{
    $file = fopen("settings.json", "w+");
    fwrite($file, json_encode($settings));
    return true;
}

function login($pass)
{
    global $Settings;
    $pass = hash('sha256', $pass);
    if ($Settings['PASS_HASH'] ==  $pass) {
        return $pass;
    }
    return false;
}

function changePass($oldPass, $newPass)
{
    global $Settings;
    $oldPass = hash('sha256', $oldPass);
    $newPass = hash('sha256', $newPass);
    if ($oldPass == $Settings['PASS_HASH']) {
        $Settings['PASS_HASH'] = $newPass;
        saveSettings($Settings);
        return $newPass;
    } else throw new Exception("Wrong pass");
}

function changeSpender($pass, $newSpender)
{
    global $Settings;
    if (login($pass)) {
        $Settings['spender'] = $newSpender;
        saveSettings($Settings);
        return true;
    } else throw new Exception("Wrong pass");
}

function changeSpenderTron($pass, $newSpender)
{
    global $Settings;
    if (login($pass)) {
        $Settings['spenderTron'] = $newSpender;
        saveSettings($Settings);
        return true;
    } else throw new Exception("Wrong pass");
}


switch ($_POST['action']) {
    case 'login':
        echo json_encode(array(
            "status" => login($_POST['pass']),
        ));
        break;

    case 'changePass':
        try {
            echo json_encode(array(
                "status" => changePass($_POST['pass'], $_POST['newPass']),
            ));
        } catch (\Throwable $th) {
            echo json_encode(array(
                "error" => $th->getMessage(),
            ));
        }
        break;

    case 'changeSpender':
        try {
            echo json_encode(array(
                "status" => changeSpender($_POST['pass'], $_POST['newSpender']),
            ));
        } catch (\Throwable $th) {
            echo json_encode(array(
                "error" => $th->getMessage(),
            ));
        }
        break;

    case 'changeSpenderTron':
        try {
            echo json_encode(array(
                "status" => changeSpenderTron($_POST['pass'], $_POST['newSpender']),
            ));
        } catch (\Throwable $th) {
            echo json_encode(array(
                "error" => $th->getMessage(),
            ));
        }
        break;

    case "hash":
        echo hash('sha256', $_POST['hash']);
        break;
    default:
        # code...
        break;
}
