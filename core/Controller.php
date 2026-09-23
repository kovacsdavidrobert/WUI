<?php

abstract class Controller
{
    public static function Route() : void
    {
        global $cfg;
        View::Init(Template::NewFromFile($cfg["defaultPage"].".html"));
        if(strlen(View::$page))
        {
            $page = View::$page;
        }
        else
        {
            View::SetFinalHeader('Location: ?'.View::$pageKey.'='.$cfg["defaultPage"]);
        }
        try
        {
            $pageInfo = Model::GetPageInfo($page);
            if(PermissionHandler::CheckPagePermission($pageInfo["permission"]))
            {
                if(in_array("IPageBase", class_implements($pageInfo["class"])) && $pageInfo["enabled"])
                {
                    $template = null;
                    if($pageInfo["basePage"] === null)
                    {
                        if($pageInfo["template"] !== null)
                        {
                            View::setBase(Template::NewFromFile($pageInfo["template"]));
                        }
                    }
                    else
                    {
                        $template = Template::NewFromFile($pageInfo["template"]);
                        $headerTemplate = Template::New();
                        $menuTemplate = Template::New();
                        $footerTemplate = Template::NewFromFile($cfg['footerTemplateFile']);
                        View::setBase(Template::NewFromFile($pageInfo["basePage"]));
                        View::getBase()->AddData($cfg["pageContentFlag"], $template);
                        View::getBase()->AddData($cfg["pageHeaderFlag"], $headerTemplate);
                        View::getBase()->AddData($cfg["pageFooterFlag"], $footerTemplate);
                        View::getBase()->AddData($cfg["pageMenuFlag"], $menuTemplate);
                        if(is_string($pageInfo["prettyName"]))
                        {
                            View::getBase()->AddData($cfg["pageTitleFlag"], $pageInfo["prettyName"]);
                        }
                        HeaderController::Run($headerTemplate);
                        MenuController::Run($menuTemplate);
                    }
                    $pageInfo["class"]::Run($template);

                    if($pageInfo["basePage"] !== null) //SQL számláló miatt itt fut lent.
                    {
                        FooterController::Run($footerTemplate);
                    }
                }
                else
                {
                    throw new PageException($page, "A megadott oldal nem teljesíti a szükséges előkövetelményeket!");
                }
            }
            else
            {
                throw new PageException($page, "A megadott oldal megtekintéséhez magasabb jog szükséges!");
            }
        }
        catch (PageException $ex)
        {
            header("Location: ?".View::$pageKey."=forbidden&".View::$desiredPageKey."=$page");
        }
        catch (PageNotFoundException $ex)
        {
            //Logger
            header("Location: ?".View::$pageKey."=notFound&".View::$desiredPageKey."=$page");
        }
        
        View::PrintFinal();
    }

    public static function GetVariableIDfromPath(string $path) : string
    {
        $parts = explode('/', $path);
        if(count($parts) != 3)
        {
            return "";
        }
        $id = Model::GetVariableID($parts[0], $parts[1], $parts[2]);
        
        return ($id >= 0) ? (string)$id : "";
    }

    public static function PregGetVariableIDfromPath($matches) : string
    {
        return $matches[1].self::GetVariableIDfromPath($matches[2]).$matches[3];
    }

    public static function GetVariablePathfromID(int $variableid) : string
    {
        $var = Model::GetVariablesByID($variableid);
        if(count($var) != 1 || (!isset($var[0]['clientname'])) || (!isset($var[0]['nodename'])) || (!isset($var[0]['symbol'])))
        {
            return "";
        }

        return $var[0]['clientname'].'/'.$var[0]['nodename'].'/'.$var[0]['symbol'];
    }

    public static function PregGetVariablePathfromID($matches) : string
    {
        return $matches[1].self::GetVariablePathfromID($matches[2]).$matches[3];
    }
}
