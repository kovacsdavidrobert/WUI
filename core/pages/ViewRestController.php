<?php

abstract class ViewRestController implements IPageBase
{
    #[\Override]
    public static function Run(Template $template = null): void
    {
        $userLevel = PermissionHandler::GetUserLevel()->value;
        $userData = Model::GetUserTokenData(View::$userToken);
        $groupname = Model::GetGroupOfUser($userData['user']);

        if(View::$request == "get" && isset(View::$jsonInput["clientname"]) && isset(View::$jsonInput["nodename"]) &&
        isset(View::$jsonInput["data"]))
        {
            $scanTime = Model::GetNodeData(View::$jsonInput["clientname"], View::$jsonInput["nodename"])['scantime'];
            $scanTime *= 0.003;
            $scanTime < 5 ? 5 : $scanTime;
            if($userLevel >= Permissions::Engineer->value)
            {
                $values = Model::GetRealtimeDataOfClientNode(View::$jsonInput["clientname"], View::$jsonInput["nodename"]);
            }
            else
            {
                $values = Model::GetRealtimeDataOfClientNode(View::$jsonInput["clientname"], View::$jsonInput["nodename"], $groupname);
            }
            $json = View::$jsonInput;
            foreach($json['data'] as &$var)
            {
                foreach($values as $value)
                {
                    if($value['symbol'] == $var['symbol'] && ((time() - strtotime($value['time'])) <= $scanTime))
                    {
                        $var['value'] = (float)$value['data'];
                        break;
                    }
                }
                if(!isset($var['value']))
                {
                    $var['value'] = null;//rand(0, 900000)/1000.0;
                }
            }

            View::JSONresponse($json);
            exit;
        }

        if(View::$request == "set" && isset(View::$jsonInput["clientname"]) && isset(View::$jsonInput["nodename"]) &&
        isset(View::$jsonInput["symbol"]) && isset(View::$jsonInput["value"]) && is_numeric(View::$jsonInput["value"]))
        {
            $variableid = Model::GetVariableID(View::$jsonInput["clientname"], View::$jsonInput["nodename"], View::$jsonInput["symbol"]);
            $valid = (Model::IsVariableOfGroup($groupname, $variableid)) || ($userLevel >= Permissions::Engineer->value);
            if($valid && (!Model::IsVariableReadonly($variableid)))
            {
                if(Model::WriteTagInNode(View::$jsonInput["clientname"], View::$jsonInput["nodename"], View::$jsonInput["symbol"],
                (float)View::$jsonInput["value"]))
                {
                    View::JSONresponse(['state' => 'ok']);
                    exit;
                }
                else
                {
                    View::JSONresponse(['state' => 'error']);
                    exit;
                }
            }
            else
            {
                View::JSONresponse(['state' => 'error']);
                exit;
            }
            
        }

    }
}