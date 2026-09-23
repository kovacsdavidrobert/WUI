<?php

abstract class ClientCommandRestController implements IPageBase
{
    #[\Override]
    public static function Run(Template $template = null): void
    {
        error_reporting(0);
        
        if(strlen(View::$clientToken))
        {
            $client = Model::GetClientByToken(View::$clientToken);
            if($client !== false)
            {
                //itt végezzük a karbantartást:
                Model::RemoveOldLoggedData(168);
                $clientname = $client['clientname'];
                Model::UpdateClientTime($clientname);
                for($i = 0; $i < 100; $i++)
                {
                    $commands= Model::GetClientCommand($clientname);
                    if(count($commands))
                    {
                        Model::RemoveClientCommand((int)$commands[0]['id']);
                        View::JSONresponseFromString($commands[0]['json']);
                        exit;
                    }
                    usleep(200 * 1000); //100 * 200 * 1000 us = 20s
                }
                exit;
            }
            else
            {
                View::JSONresponse(['error' => 'INVALID TOKEN']);
                exit;
            }
        }
        else
        {
            View::JSONresponse(['error' => 'NO TOKEN']);
            exit;
        }
    }
}