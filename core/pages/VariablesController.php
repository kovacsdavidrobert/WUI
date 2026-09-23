<?php

abstract class VariablesController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $symbolRegX = '^[a-zA-Z0-9,_.]{1,32}$';
        $addressRegX = '^[a-zA-Z0-9,_.]{1,32}$';
        $commentRegX = '^[^\x22\x27\x22]{1,512}$';
        if(isset(View::$postData['todo']))
        {
            if(isset(View::$postData['symbol']) && isset(View::$postData['client']) && isset(View::$postData['nodename']) &&
            View::$postData['client'] == View::$client && View::$postData['nodename'] == View::$node && preg_match("/$symbolRegX/", View::$postData['symbol']) &&
            strlen(View::$client) && strlen(View::$node))
            {
                if(isset(View::$postData['datatype']) && isset(View::$postData['address']) && isset(View::$postData['comment']) &&
                preg_match("/$addressRegX/", View::$postData['address']) &&
                (preg_match("/$commentRegX/", View::$postData['comment']) || View::$postData['comment'] == ''))
                {
                    if(View::$postData['todo'] == 'insert')
                    {
                        $vardata = ['symbol' => View::$postData['symbol'],
                        'address' => View::$postData['address'],
                        'comment' => View::$postData['comment'],
                        'readonly' => View::$postData['readonly'],
                        'datatype' => View::$postData['datatype']];
                        $r = Model::AddVariableToNode(View::$postData['client'], View::$postData['nodename'], $vardata);
                        View::JSONresponse(['ok' => $r, 'details' => 'insert']);
                    }
                    elseif(View::$postData['todo'] == 'update' && preg_match("/$symbolRegX/", View::$postData['newsymbol']))
                    {
                        $vardata = ['symbol' => View::$postData['symbol'],
                        'newsymbol' => View::$postData['newsymbol'],
                        'address' => View::$postData['address'],
                        'comment' => View::$postData['comment'],
                        'readonly' => View::$postData['readonly'],
                        'datatype' => View::$postData['datatype']];
                        $r = Model::ModifyVariableInNode(View::$postData['client'], View::$postData['nodename'], $vardata);
                        View::JSONresponse(['ok' => $r, 'details' => 'update']);
                    }
                }
                elseif(View::$postData['todo'] == 'delete')
                {
                    $r = Model::RemoveVariableInNode(View::$postData['client'], View::$postData['nodename'], View::$postData['symbol']);
                    View::JSONresponse(['ok' => $r, 'details' => 'delete']);
                }
            }
            View::JSONresponse(['ok' => false, 'details' => 'dataError']);
        }

        $nodes = Model::GetAllNode();
        $nodeTable = "";
        $i = 1;
        if(count($nodes))
        {
            $ok = false;
            foreach($nodes as $node)
            {
                if($node['clientname'] == View::$client && $node['nodename'] == View::$node)
                {
                    $checked = ' checked';
                    $ok = true;
                }
                else
                {
                    $checked = '';
                }
                $nodeTable .=
                    "<tr><th>$i</th>"
                    ."<td>".htmlspecialchars($node['clientname'])."</td>"
                    ."<td>".htmlspecialchars($node['nodename'])."</td>"
                    .'<td><input type="radio" name="noderadio" data-client="'.View::EscStrForJS($node['clientname'])
                        .'" data-node="'.View::EscStrForJS($node['nodename']).'"'
                        .$checked.' onclick="SubmitNodeSelect()"></td>'
                    ."</tr>\n";
                $i++;
            }
            if(strlen(View::$client) && strlen(View::$node) && (!$ok)) //valaki kamu PLC-t adott meg
            {
                View::SetFinalHeader('Location: ?'.View::$pageKey.'='.View::$page);
            }
        }
        else
        {
            $nodeTable = '<tr><td colspan=4>Nincs még kliens és csomópont felvéve.</td></tr>';
        }

        if(!$ok)
        {
            $template->AddData("EXPORTDISABLED", 'disabled');
        }
        $template->AddData("PLCLIST", $nodeTable);
        $template->AddData("NODE", View::EscStrForJS(View::$node));
        $template->AddData("CLIENT", View::EscStrForJS(View::$client));

        if(strlen(View::$client) && strlen(View::$node))//ki van választva egy valid kliens és node
        {
            $template -> AddData('DISPLAYTITLE', 'block');
            $variableTable = "";
            $i = 1;
            $variables = Model::GetVariablesOfNode(View::$client, View::$node, View::$sort);

            if(count($variables))
            {
                foreach($variables as $variable)
                {
                    $row = Template::NewFromFile('variables_table.html');
                    $row -> AddData('INDEX', $i);
                    $row -> AddData('SYMBOLREGEX',$symbolRegX);
                    $row -> AddData('SYMBOL',htmlspecialchars($variable['symbol']));
                    $row -> AddData('DATATYPE',htmlspecialchars($variable['datatype']));
                    $row -> AddData('ADDRESSREGEX',$addressRegX);
                    $row -> AddData('COMMENTREGEX',$commentRegX);
                    $row -> AddData('ADDRESS', htmlspecialchars($variable['address']));
                    $row -> AddData('COMMENT', htmlspecialchars($variable['comment']));
                    $row -> AddData('ROTRUE', htmlspecialchars($variable['readonly']));
                    $row -> AddData('ROCHECKED', ($variable['readonly'] == 1) ? 'checked' : '');
                    $row -> AddData(strtoupper($variable['datatype']), " selected");

                    $variableTable .= $row -> Render(true);
                    unset($row);
                    $i++;
                }
                if(View::$sort == 'address')
                {
                    $template -> AddData('SORTADDRESS', '▼');
                }
                elseif(View::$sort == 'datatype')
                {
                    $template -> AddData('SORTDATATYPE', '▼');
                }
                elseif(View::$sort == 'symbol')
                {
                    $template -> AddData('SORTSYMBOL', '▼');
                }

                $template -> AddData("VARIABLETABLE", $variableTable);
            }
            else
            {
                $row = Template::NewFromFile('variables_table.html');
                $row -> AddData('INDEX', $i);
                $row -> AddData('DATASETSQL', ' data-sql="insert"');
                $row -> AddData('SYMBOLREGEX',$symbolRegX);
                $row -> AddData('ADDRESSREGEX',$addressRegX);
                $row -> AddData('COMMENTREGEX',$commentRegX);

                $variableTable .= $row -> Render(true);
                unset($row);

                $template -> AddData("VARIABLETABLE", $variableTable);
            }
        }
        else
        {
            $template -> AddData("VARIABLETABLE", '<tr><th>☹</th><td colspan=6>Nincs csomópont kiválasztva.</td></tr>');
            $template -> AddData('DISPLAYTITLE', 'none');
        }
    }
}