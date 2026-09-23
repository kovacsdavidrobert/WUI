<?php

abstract class NotFoundController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $template->AddData("PAGE", View::$desiredPage);
    }
}
