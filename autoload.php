<?php

spl_autoload_register(function (string $type)
{
    if(strpos($type, "PHPMailer") !== false)
    {
        //$namespace = "PHPMailer\PHPMailer";
        $class = substr($type, strrpos($type, "\\") + 1);
        if(file_exists("core/extensions/PHPMailer/$class.php"))
        {
            require_once("core/extensions/PHPMailer/$class.php");
        }
    }
    if(strpos($type, "Exception") > 0 && file_exists("core/exceptions/$type.php"))
    {
        require_once("core/exceptions/$type.php");
    }
    elseif(strpos($type, "Controller") > 0 && file_exists("core/pages/$type.php"))
    {
        require_once("core/pages/$type.php");
    }
    elseif(file_exists("core/$type.php"))
    {
        require_once("core/$type.php");
    }
});