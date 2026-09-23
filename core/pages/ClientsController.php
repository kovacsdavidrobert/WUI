<?php

abstract class ClientsController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $nameRegX = '^[a-zA-Z0-9,_.]{1,32}$';
        $nameDescription = "Engedélyezett:<br>A-Z a-z 0-9 , _ . ";
        if(View::$onlineState == 'get' && strlen(View::$client))
        {
            $client = Model::GetClientByName(View::$client);
            $ol = time() - strtotime($client['time']) <= 22 ? "online" : "offline";
            View::JSONresponse(['state' => $ol]);
            exit;
        }

        if(isset(View::$postData['todo']))
        {
            if(View::$postData['todo'] == "downloadClient" && strlen(View::$postData['clientname']))
            {
                if(Model::WriteVariablesToClient(View::$postData['clientname']))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients&'.View::$messageKey.'=sikerletolt');
                }
                else
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients&'.View::$messageKey.'=hibaletolt');
                }
                exit;
            }
            if(View::$postData['todo'] == "delClient" && strlen(View::$postData['clientname']))
            {
                if(Model::RemoveClient(View::$postData['clientname']))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients');
                    exit;
                }
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients&'.View::$messageKey.'=hibaaltalanos');
                exit;

            }
            if(View::$postData['todo'] == "addClient" && preg_match("/$nameRegX/", View::$postData['clientname']))
            {
                if(Model::AddClient(View::$postData['clientname']))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients');
                    exit;
                }
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients&'.View::$messageKey.'=hibaaltalanos');
                exit;

            }
            if(View::$postData['todo'] == "renameClient" && preg_match("/$nameRegX/", View::$postData['clientname']) &&
            preg_match("/$nameRegX/", View::$postData['newclientname']))
            {
                if(Model::RenameClient(View::$postData['clientname'], View::$postData['newclientname']))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients');
                    exit;
                }
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients&'.View::$messageKey.'=hibaatnevez');
                exit;

            }
            if(View::$postData['todo'] == "modNode" && preg_match("/$nameRegX/", View::$postData['clientname']) &&
            preg_match("/$nameRegX/", View::$postData['nodename']) && preg_match("/$nameRegX/", View::$postData['newnodename']) &&
            preg_match("/$nameRegX/", View::$postData['ip']) && preg_match("/$nameRegX/", View::$postData['driver']) &&
            is_numeric(View::$postData['scantime']) && View::$postData['scantime'] < 100000 && View::$postData['scantime'] > 100
            )
            {
                $nodedata = array();
                $nodedata['newnodename'] = View::$postData['newnodename'];
                $nodedata['ip'] =          View::$postData['ip'];
                $nodedata['driver'] =      View::$postData['driver'];
                $nodedata['scantime'] =    View::$postData['scantime'];
                if(Model::ModifyNode(View::$postData['clientname'], View::$postData['nodename'], $nodedata))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients&'.View::$messageKey.'=oknode');
                    exit;
                }
            }
            if(View::$postData['todo'] == "addNode" && preg_match("/$nameRegX/", View::$postData['clientname']) &&
            preg_match("/$nameRegX/", View::$postData['newnodename']) &&
            preg_match("/$nameRegX/", View::$postData['ip']) && preg_match("/$nameRegX/", View::$postData['driver']) &&
            is_numeric(View::$postData['scantime']) && View::$postData['scantime'] < 100000 && View::$postData['scantime'] > 100
            )
            {
                $nodedata = array();
                $nodedata['nodename'] = View::$postData['newnodename'];
                $nodedata['ip'] =          View::$postData['ip'];
                $nodedata['driver'] =      View::$postData['driver'];
                $nodedata['scantime'] =    View::$postData['scantime'];
                if(Model::AddNode(View::$postData['clientname'], $nodedata))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients');
                    exit;
                }
            }
            if(View::$postData['todo'] == "delNode" && preg_match("/$nameRegX/", View::$postData['clientname']) &&
            preg_match("/$nameRegX/", View::$postData['nodename'])
            )
            {
                if(Model::RemoveNode(View::$postData['clientname'], View::$postData['nodename']))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients');
                    exit;
                }
            }

            View::SetFinalHeader('Location: ?'.View::$pageKey.'=clients&'.View::$messageKey.'=hiba');
            exit;
        }

        if(View::$message == 'hiba')
        {
            $template->AddData('RESPONSE', '<h4 class="error-text center">Hibás vagy hiányos adatokat adott meg, kérem próbálja újra!</h4>');
        }
        if(View::$message == 'hibaletolt')
        {
            $template->AddData('RESPONSE', '<h4 class="error-text center">Letöltés sikertelen.</h4>');
        }
        if(View::$message == 'hibaatnevez')
        {
            $template->AddData('RESPONSE', '<h4 class="error-text center">Átnevezés sikertelen.
            Átnevezés nem lehetséges, amíg letöltés van folyamatban, vagy ha a név ütközik.</h4>');
        }
        if(View::$message == 'sikerletolt')
        {
            $template->AddData('RESPONSE', '<h4 class="ok-text center">A konfiguráció rögzítésre került. Ha a kliens elérhető, letöltésre kerül.</h4>');
        }
        if(View::$message == 'oknode')
        {
            $template->AddData('RESPONSE', '<h4 class="ok-text center">Sikeres módosítás. Ha változott a csomópont neve, ne felejtse el letölteni a kliensbe!</h4>');
        }
        if(View::$message == 'hibaaltalanos')
        {
            $template->AddData('RESPONSE', '<h4 class="error-text center">Művelet sikertelen!</h4>');
        }



        $clients = Model::GetAllClient();
        $clientTable = '';
        $clientSelect = '';
        $i = 1;
        foreach($clients as $client)
        {
            $clientTable .= "<tr>";
            $clientTable .= "<th>$i</th>";

            $clientTools = Template::NewFromFile('clients_clienttools.html');
            $clientTools -> AddData('CLIENTNAME', View::EscStrForJS($client['clientname']));
            if($client['nodesCount'] > 0)
            {
                $clientTools -> AddData('FIRSTDELNODES', 'disabled title="Először törölje a kliens csomópontjait!"');
                $clientTable .= "<td>".htmlspecialchars($client['clientname'])."</td>";
            }
            else
            {
                $clientTools -> AddData('NONODESDISABLE', 'disabled title="Letöltés csak hozzáadott csomópontok esetén lehetséges."');
                $clientTable .= "<td><i>".htmlspecialchars($client['clientname'])."</i></td>";
            }
            $clientToolsHTML = $clientTools->Render();
            unset($clientTools);
            
            $clientTable .= '<td class="hide" title="'.$client['token'].'"><span>'.$client['token'].'</span></td>';
            $clientTable .= "</td><td class='center ostate' data-client='".View::EscStrForJS($client['clientname'])."'>...</td>";
            $clientTable .= "<td class='excel'>$clientToolsHTML</td></tr>";

            $clientSelect .= '<option value="'.$client['clientname'].'">'.$client['clientname'].'</option>';

            $i++;
        }

        $nodes = Model::GetAllNode();
        $i=1;
        $nodeTable = "";
        $lastClientName = isset($nodes[0]) ? $nodes[0]['clientname'] : '';
        foreach($nodes as $node)
        {
            $nodeTools = Template::NewFromFile('clients_nodetools.html');
            $nodeTools -> AddData("CLIENTNAME", View::EscStrForJS($node['clientname']));
            $nodeTools -> AddData("NODENAME", View::EscStrForJS($node['nodename']));
            $nodeTools -> AddData("IP", View::EscStrForJS($node['ip']));
            $nodeTools -> AddData("DRIVER", View::EscStrForJS($node['driver']));
            $nodeTools -> AddData("SCANTIME", View::EscStrForJS($node['scantime']));
            if($node['vars'] > 0)
            {
                $nodeTools -> AddData("FIRSTDELVARS", 'disabled title="Először a csomópont változóit törölje!"');
            }
            $nodeToolsHTML = $nodeTools -> Render();
            unset($nodeTools);
            if($node['clientname'] != $lastClientName)
            {
                $nodeTable .= '<tr style="border-top: 3px solid black">';
            }
            else
            {
                $nodeTable .= '<tr>';
            }
            $lastClientName = $node['clientname'];
            $nodeTable .= "<th>$i</th>";
            $nodeTable .= "<td>{$node['clientname']}</td>";
            $nodeTable .= "<td>{$node['nodename']}</td>";
            $nodeTable .= "<td>{$node['ip']}</td>";
            $nodeTable .= "<td>{$node['driver']}</td>";
            $nodeTable .= "<td>{$node['scantime']}</td>";
            $nodeTable .= "<td class='excel'>$nodeToolsHTML</td></tr>";
            $i++;
        }

        $template -> AddData('CLIENTTABLE', $clientTable);
        $template -> AddData('NAMEREGEX', $nameRegX);
        $template -> AddData('NAMEDESCRIPTION', $nameDescription);
        $template -> AddData('NODETABLE', $nodeTable);
        $template -> AddData('CLIENTSELECT', $clientSelect);

    }
}