<?php

abstract class View
{   
    public static array $cookiesToSet = [], $headersToSet = [];
    private static Template $base;
    public static string $desiredPage;
    public static string $desiredPageKey = 'dp';
    public static string $page;
    public static string $pageKey = 'p';
    public static string $wuipage;
    public static string $wuipageKey = 'page';
    public static string $userIdentCookieName = 'uid';
    public static string $userToken;
    public static string $redirectTo;
    public static string $redirectToKey = 'r';
    public static string $varPath;
    public static string $varPathKey = 'vp';
    public static string $pageNumber;
    public static string $pageNumberKey = 'pn';
    public static string $message;
    public static string $messageKey = 'msg';
    public static string $request;
    public static string $requestKey = 'req';
    public static string $from;
    public static string $fromKey = 'from';
    public static string $to;
    public static string $toKey = 'to';
    public static string $clientToken;
    public static string $clientTokenKey = 'token';
    public static string $node;
    public static string $nodeKey = 'nodeselected';
    public static string $client;
    public static string $clientKey = 'clientselected';
    public static string $onlineState;
    public static string $onlineStateKey = 'ostate';
    public static string $sort;
    public static string $sortKey = 'sort';
    public static array $postData = [];
    public static string $pageUploadTmpFilename = "";
    public static string $usersymbolUploadTmpFilename = "";
    public static string $usersymbolUploadFilename = "";
    public static mixed $jsonInput;
    
    public static function getBase(): Template {
        return self::$base;
    }

    public static function setBase(Template $base): void {
        self::$base = $base;
    }
    
    public static function Init(Template $base)
    {
        ob_start();
        self::setBase($base);

        self::$headersToSet = array("Content-type: text/html");

        //Bejövő sütik:
        self::$userToken = isset($_COOKIE[self::$userIdentCookieName]) ? addslashes($_COOKIE[self::$userIdentCookieName]) : '';

        //Szuperglobális tömbök kezelése:
        //GET:
        self::$desiredPage = isset($_GET[self::$desiredPageKey]) ? htmlspecialchars($_GET[self::$desiredPageKey]) : '';
        self::$page = isset($_GET[self::$pageKey]) ? trim(htmlspecialchars($_GET[self::$pageKey])) : '';
        self::$wuipage = isset($_GET[self::$wuipageKey]) ? trim(htmlspecialchars($_GET[self::$wuipageKey])) : '';
        self::$redirectTo = isset($_GET[self::$redirectToKey]) ? trim(htmlspecialchars($_GET[self::$redirectToKey])) : '';
        self::$message = isset($_GET[self::$messageKey]) ? htmlspecialchars($_GET[self::$messageKey]) : '';
        self::$client = isset($_GET[self::$clientKey]) ? htmlspecialchars($_GET[self::$clientKey]) : '';
        self::$node = isset($_GET[self::$nodeKey]) ? htmlspecialchars($_GET[self::$nodeKey]) : '';
        self::$sort = isset($_GET[self::$sortKey]) ? htmlspecialchars($_GET[self::$sortKey]) : '';
        self::$onlineState = isset($_GET[self::$onlineStateKey]) ? htmlspecialchars($_GET[self::$onlineStateKey]) : '';
        self::$request = isset($_GET[self::$requestKey]) ? htmlspecialchars($_GET[self::$requestKey]) : '';
        self::$clientToken = isset($_GET[self::$clientTokenKey]) ? htmlspecialchars($_GET[self::$clientTokenKey]) : '';
        self::$varPath = isset($_GET[self::$varPathKey]) ? htmlspecialchars($_GET[self::$varPathKey]) : '';
        self::$pageNumber = isset($_GET[self::$pageNumberKey]) ? htmlspecialchars($_GET[self::$pageNumberKey]) : '';
        self::$from = isset($_GET[self::$fromKey]) ? htmlspecialchars($_GET[self::$fromKey]) : '';
        self::$to = isset($_GET[self::$toKey]) ? htmlspecialchars($_GET[self::$toKey]) : '';

        //Files:
        self::$pageUploadTmpFilename = isset($_FILES["data"]["name"]) ? $_FILES["data"]["tmp_name"] : '';
        self::$usersymbolUploadTmpFilename = isset($_FILES["usersymbol"]["name"]) ? $_FILES["usersymbol"]["tmp_name"] : '';
        self::$usersymbolUploadFilename = isset($_FILES["usersymbol"]["name"]) ? $_FILES["usersymbol"]["name"] : '';

        if(isset($_SERVER["CONTENT_TYPE"]) && preg_match('/^application\/json/', $_SERVER["CONTENT_TYPE"]))
        {
            //JSON:
            if(isset($_SERVER["HTTP_CONTENT_ENCODING"]) && $_SERVER["HTTP_CONTENT_ENCODING"] == 'gzip')
            {
                self::$jsonInput = json_decode(gzdecode(file_get_contents('php://input')), true);
            }
            else
            {
                self::$jsonInput = json_decode(file_get_contents('php://input'), true);
            }
        }
        else
        {
            //POST:
            foreach($_POST as $key => $value)
            {
                self::$postData[$key] = self::CleanInput($value);
            }
        }

    }

    public static function PrintFinal() : void
    {
        ob_end_clean();
        foreach (self::$cookiesToSet as $cookie)
        {
            setcookie($cookie["key"], $cookie["value"], $cookie["time"]);
        }
        foreach (self::$headersToSet as $header)
        {
            header($header);
        }
        print(self::$base->Render(true));
    }
    
    public static function SetCookie(string $key, string $value, int $time = 0)
    {
        if($time < time())
        {
            $time = 0;
        }
        self::$cookiesToSet[] = ["key" => $key, "value" => $value, "time" => $time];
    }
    
    public static function SetFinalHeader(string $header)
    {
        ob_end_clean();
        header($header);
        exit();
    }

    public static function SetFinalHeaderWithCookies(string $header)
    {
        ob_end_clean();
        foreach (self::$cookiesToSet as $cookie)
        {
            setcookie($cookie["key"], $cookie["value"], $cookie["time"]);
        }
        header($header);
        exit();
    }

    public static function JSONresponse(array $json)
    {
        ob_end_clean();
        header('Content-Type: application/json');
        ini_set('serialize_precision', -1);
        echo json_encode($json);
        exit();
    }

    public static function JSONresponseFromString(string $json)
    {
        ob_end_clean();
        header('Content-Type: application/json');
        echo $json;
        exit();
    }

    public static function XMLresponseFromString(string $xmlString)
    {
        ob_end_clean();
        header('Content-Type: application/xml');
        echo $xmlString;
        exit();
    }

    public static function JsRedirect(string $location, $delayms = 2000) : string
    {
        return "<script>setTimeout(()=>{window.location = '$location'}, $delayms)</script>";
    }

    public static function CleanInput(string | array $userInput) : string | array
    {
        if(is_array($userInput))
        {
            $buffer = array();
            foreach($userInput as $elem)
            {
                $buffer[] = self::CleanInput($elem);
            }
            return $buffer;
        }
        
        $userInput = trim($userInput);
        $userInput = preg_replace('/[\x00-\x1f]/', "", $userInput);
        $userInput = preg_replace('/ {2,}/', " ", $userInput);
        return $userInput;
    }

    public static function EscStrForJS(string $strToEscapeForJS) : string
    {
        $strToEscapeForJS = json_encode($strToEscapeForJS, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT);
        return str_replace('"', '', $strToEscapeForJS);
    }
}
