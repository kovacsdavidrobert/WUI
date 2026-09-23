<?php

interface IPageBase
{
    static function Run(?Template $template = null) : void;
}
