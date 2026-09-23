<?php

class KeyNotFoundException extends Exception
{
    #[\Override]
    public function __construct(string $message)
    {
        return parent::__construct($message);
    }

}
