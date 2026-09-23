<?php

abstract class SettingsController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $pwRegX = '(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}';
        $pwRequirementText = '<b>Tartalmaznia kell:</b><br><b>NAGY</b> és <small>kisbetűt</small>, 52ám0t & $ρ€©!á|!$ κ@Γ@κ✝€Γ✝. Hossz: min. <b>6</b>.';
        $template->AddData('REGEX', $pwRegX);
        $template->AddData('PWDESCRIPTION', $pwRequirementText);

        if(View::$message == "first")
        {
            $template->AddData('HIDE', 'none');
            $template->AddData('TITLE', 'Első jelszó beállítása:');
        }
        elseif(View::$message == "siker")
        {
            $template->AddData("RESPONSE", '<p class="ok-text">Sikeres jelszó változtatás!</p>');
            $template->AddData('HIDE', 'block');
            $template->AddData('TITLE', 'Jelszó megváltoztatása:');
        }
        else
        {
            $template->AddData('HIDE', 'block');
            $template->AddData('TITLE', 'Jelszó megváltoztatása:');
        }

        if(isset(View::$postData['ok']))//Meg akarja változtatni a jelszót
        {
            $userData = Model::GetUserTokenData(View::$userToken);
            if($userData === false) //Gebasz van: Guest felhasználó került ide.
            {
                throw new PageException('settings', "A megadott oldal megtekintéséhez magasabb jog szükséges!");
            }

            $oldPw = Model::GetPasswordOfUser($userData['user']);
            if($oldPw === false) //A PermissionHeaderben kezelt probléma: törölt felhasználó, de még van token sütije
            {
                //De biztos, ami biztos:
                throw new PageException('settings', "A megadott oldal megtekintéséhez magasabb jog szükséges!");
            }

            //Mint a LoginControllerben:
            if($oldPw !== false && ((hash("sha256", View::$postData['oldpw']) == $oldPw) || (strlen($oldPw) == 0 && strlen(View::$postData['oldpw']) == 0))) //Megfelelő bejelentkezési adatok
            {
                //Régi jelszó megfelelő
                if(View::$postData['newpw'] == View::$postData['newpw2'])
                {
                    //Új jelszavak megegyeznek
                    if(preg_match("/$pwRegX/", View::$postData['newpw']))//Formátum OK
                    {
                        if(Model::SetPasswordOfUser($userData['user'], View::$postData['newpw']))
                        {
                            View::SetFinalHeaderWithCookies('Location: ?'.View::$pageKey.'=settings&'.View::$messageKey.'=siker');
                        }
                        else
                        {
                            $template->AddData("RESPONSE", '<p class="error-text">Sikertelen jelszócsere</p>');
                        }
                        
                    }
                    else
                    {
                        $template->AddData("RESPONSE", '<p class="error-text">Az új jelszó nem elégíti ki a követelményeket!</p><p class="warning-box">'.$pwRequirementText.'</p>');
                    }

                    
                }
                else
                {
                    //Új jelszavak különböznek
                    $template->AddData("RESPONSE", '<p class="error-text">Az új jelszavak nem egyeznek</p>');
                }
            }
            else
            {
                //Régi jelszó NEM megfelelő
                $template->AddData("RESPONSE", '<p class="error-text">A régi jelszó nem megfelelő.</p>');
            }
            
        }
    }
}
