<?php

abstract class PermissionHandler
{
    public static function CheckPagePermission(int $pagePermission) : bool
    {
        if(Permissions::from($pagePermission) == Permissions::Guest)
        {
            return true;
        }
        $permissionOfUser = self::GetUserLevel();
        return $permissionOfUser->value >= Permissions::from($pagePermission)->value;
    }


    public static function GetUserLevel() : Permissions
    {
        if(View::$userToken == '')
        {
            return Permissions::Guest;
        }

        $userData = Model::GetUserTokenData(View::$userToken);
        if($userData)
        {
            $userPassword = Model::GetPasswordOfUser($userData['user']);
        }
        else
        {
            $userPassword = false;
        }

        if($userData !== false && $userPassword === false)//Törölt felhasználó
        {
            Model::RemoveAllTokenOfUser($userData['user']);
            return Permissions::Guest;
        }

        if($userData === false) //Guest
        {
            return Permissions::Guest;
        }

        if($userPassword == '')
        {
            return Permissions::BlankPass;
        }
        elseif(Model::GetGroupOfUser($userData['user']) == 'engineer')
        {
            return Permissions::Engineer;
        }
        else
        {
            return Permissions::User;
        }
    }
    

    public static function SetLogin(string $user) : void
    {
        global $cfg;
        //Model::RemoveAllTokenOfUser($user);
        $newToken = Model::AddNewTokenToUser($user);
        View::SetCookie(View::$userIdentCookieName, $newToken, time() + $cfg["maxSessionTime"]);
    }

    
    public static function Logout() : void
    {
        Model::RemoveUserToken(View::$userToken);
    }
}
