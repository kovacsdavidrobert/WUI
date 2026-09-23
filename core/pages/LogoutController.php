<?php

abstract class LogoutController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void 
    {
        global $cfg;
        PermissionHandler::Logout();
        View::SetCookie(View::$userIdentCookieName, '');
        View::SetFinalHeaderWithCookies('Location: ?'.View::$pageKey.'='.$cfg['defaultPage']);
    }
}
