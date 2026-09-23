<?php

class PageException extends Exception
{
    private string $page;
    
    public function getPage(): string {
        return $this->page;
    }

    #[\Override]
    public function __construct(string $page, string $message = "", int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->page = $page;
    }
}
