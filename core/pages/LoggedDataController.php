<?php

abstract class LoggedDataController implements IPageBase
{
    #[\Override]
    public static function Run(Template $template = null): void
    {
        if(strlen(View::$varPath) && preg_match('~[^/]+/[^/]+/[^/]+~', View::$varPath))
        {
            $userLevel = PermissionHandler::GetUserLevel()->value;
            $userData = Model::GetUserTokenData(View::$userToken);
            $groupname = ($userLevel >= Permissions::Engineer->value) ? "" : Model::GetGroupOfUser($userData['user']);

            $clientname = explode('/', View::$varPath)[0];
            $nodename = explode('/', View::$varPath)[1];
            $symbol = explode('/', View::$varPath)[2];
            $limit = 50;
            $act = (is_numeric(View::$pageNumber) && View::$pageNumber > 0) ? View::$pageNumber : 0;

            if(View::$pageNumber == 'export')
            {
                $export = Model::GetLoggedDataOfClientNode($clientname, $nodename, $symbol, INF, 1, $groupname);
                View::JSONresponse($export);
                exit;
            }

            
            if(View::$request == 'get')
            {
                if((is_numeric(View::$from) && is_numeric(View::$to)))
                {
                    $response = Model::GetLoggedDataOfClientNodeByTime($clientname, $nodename, $symbol, View::$from, View::$to, $groupname);

                    $jsonData = [];
                    foreach($response as $row)
                    {
                        $jsonData[] = ['data' => floatval($row['data']), 'time' => ($row['time'])];
                    }
                    View::JSONresponse(['symbol' => $symbol, 'data' => $jsonData]);
                    exit;
                }
                View::JSONresponse(['error' => true]);
                exit;
            }

            $table = Model::GetLoggedDataOfClientNode($clientname, $nodename, $symbol, $act, $limit, $groupname);
            $actPage = intval(($act == 0 || $act > $table['max']) ? $table['max'] : $act);

            if(isset($table['data']) && count($table['data']))
            {
                $tableHTML = "";
                foreach($table['data'] as $row)
                {
                    $tableHTML .= "<tr><th>{$row['time']}</th><td>{$row['symbol']}</td><td>{$row['data']}</td></tr>\n";
                }

                $template->AddData("VARPATH", View::$varPath, false);
                $template->AddData("SHOWARR", 'block');
                $template->AddData("VARIABLETABLE", $tableHTML);
                $template->AddData("PAGE", $actPage);
                $template->AddData("MAXPAGE", $table['max']);
            }
            else
            {
                $template->AddData("VARPATH", View::$varPath, false);
                $template->AddData("VARIABLETABLE", "<tr><th>☹</th><td colspan=\"2\">A változó nem elérhető.</td></tr>");       
                $template->AddData("SHOWARR", 'none');         
            }

        }
        else
        {
            $template->AddData("VARPATH", View::$varPath, false);
            $template->AddData("VARIABLETABLE", "<tr><th>☹</th><td colspan=\"2\">Nincs kiválasztva változó.</td></tr>");
            $template->AddData("SHOWARR", 'none');
        }
    }
}