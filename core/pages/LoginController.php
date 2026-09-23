<?php

abstract class LoginController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        global $cfg;
        if(PermissionHandler::GetUserLevel()->value > Permissions::Guest->value) //Be van már jelentkezve
        {
            if(View::$message == 'siker')
            {
                View::SetFinalHeaderWithCookies('Location: ?'.View::$pageKey.'=login');
            }
            else
            {
                View::SetFinalHeader('Location: ?'.View::$pageKey.'='.$cfg["defaultPage"]);
            }
        }
       else //Nincs bejelentkezve
        {
            if(isset(View::$postData['ok']))//Be akar jelentkezni
            {
                $pw = Model::GetPasswordOfUser(View::$postData['username']);
                if($pw !== false && ((hash("sha256", View::$postData['password']) == $pw) || (strlen($pw) == 0 && strlen(View::$postData['password']) == 0))) //Megfelelő bejelentkezési adatok
                {
                    PermissionHandler::SetLogin(View::$postData['username']);
                    if(View::$postData['password'] == "")
                    {
                        View::SetFinalHeaderWithCookies('Location: ?'.View::$pageKey.'=settings&'.View::$messageKey.'=first');
                    }
                    else
                    {
                        View::SetFinalHeaderWithCookies('Location: ?'.View::$pageKey.'=login&'.View::$messageKey.'=siker');
                    }
                }
                else //Hibás bejelentkezési adatok
                {
                    $template->AddData('RESPONSE', '<h4 class="error-text">Hibás bejelentkezési adatok!</h4>');
                    $template->AddData('TITLE', 'Kérem jelentkezzen be!');
                }
            }
            else //Most fog bejelentkezni
            {
                $template->AddData('TITLE', 'Kérem jelentkezzen be!');
            }
        }

    }
    
}
