<?php

abstract class ClientUploadRestController implements IPageBase
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
                if(isset(View::$jsonInput['nodename']) && isset(View::$jsonInput['data']) && is_array(View::$jsonInput['data']))
                {
                    $clientname = $client['clientname'];
                    foreach(View::$jsonInput['data'] as $data)
                    {
                        if(!Model::SetRealtimeDataByClient($clientname, View::$jsonInput['nodename'], $data))
                        {
                            View::JSONresponse(['error' => 'TAG WRITE ERROR']);
                            exit;
                        }
                    }
                    View::JSONresponse(['state' => 'ok']);
                    exit;
                }
                else
                {
                    View::JSONresponse(['error' => 'INVALID REQUEST']);
                    exit;
                }
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