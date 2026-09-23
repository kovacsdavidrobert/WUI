<?php

abstract class HeaderController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        global $cfg;
        $userLevel = PermissionHandler::GetUserLevel()->value;
        if ($userLevel >= Permissions::BlankPass->value)
        {
            $userData = Model::GetUserTokenData(View::$userToken);
            $group = Model::GetGroupOfUser($userData['user']);
            if ($userLevel >= Permissions::Engineer->value)
            {
                $template->ReloadFromFile($cfg["headerTemplateFile"]);
                if($userData['user'] == 'engineer')
                {
                    $template->AddData('USERNAME', $userData['user']." 🍺", false);
                }
                else
                {
                    $template->AddData('USERNAME', $userData['user'], false);
                }
                $template->AddData('GROUPNAME', $group, false);
                $template->AddData('ICON', '<img src="img/star.svg" class="icon" alt="engineer">');
            }
            elseif($userLevel >= Permissions::User->value)
            {
                $template->ReloadFromFile($cfg["headerTemplateFile"]);
                $template->AddData('USERNAME', $userData['user'], false);
                $template->AddData('GROUPNAME', $group, false);
                $template->AddData('ICON', '<img src="img/user.svg" class="icon" alt="user">');
            }
            else
            {
                $template->ReloadFromFile($cfg["headerTemplateFile"]);
                $template->AddData('USERNAME', $userData['user'], false);
                $template->AddData('GROUPNAME', $group, false);
            }
        }
        else
        {
            $template->ReloadFromString('Üdvözli a <b>WUI</b>! <a href="?'
                . View::$pageKey
                . '=login">Kérem jelentkezzen be</a>!');
        }
    }
}
