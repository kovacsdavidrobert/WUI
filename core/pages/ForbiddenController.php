<?php

abstract class ForbiddenController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $template->AddData("PAGE", View::$desiredPage);
    }

}
