<?php

abstract class FooterController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        if(PermissionHandler::GetUserLevel()->value >= Permissions::Engineer->value)
        {
            $template->AddData('INFO', "(Engineer info: [SQL query count: ".Database::$count."])");
        }
    }
}
