<?php

abstract class UseradminController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $nameRegX = '^[^\x22\x27<>!\?, \x2f\x5c]{1,20}$';
        $nameRequirementText = '<b>Min 1, max 20 hosszú.</b><br>Nem tartalmazhat:<br><code>" \' &lt; &gt; ! ? , \ / [szóköz]</code><br>karaktereket.';
        if(isset(View::$postData['todo'])) {
            if(View::$postData['todo'] == "modifyGroupPages" && isset(View::$postData['groupname']))
            {
                if(!isset(View::$postData['selfpages']))
                {
                    View::$postData['selfpages'] = array();
                }
                Model::SetWUIPagesOfGroup(View::$postData['selfpages'], View::$postData['groupname']);
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin');
                exit;
            }
            if(View::$postData['todo'] == "addGroup" && isset(View::$postData['groupname']) && preg_match("/$nameRegX/", View::$postData['groupname']))
            {
                if(Model::AddGroup(View::$postData['groupname']))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin');
                }
                else
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin&'.View::$messageKey.'=hibaadd');
                }
                exit;
            }
            if(View::$postData['todo'] == "delGroup" && isset(View::$postData['groupname']))
            {
                if(Model::RemoveGroup(View::$postData['groupname']))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin');
                }
                else
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin&'.View::$messageKey.'=hiba');
                }
                exit;
            }
            if(View::$postData['todo'] == "modifyUserGroup" && isset(View::$postData['username']) && isset(View::$postData['selfgroup']))
            {
                Model::SetGroupOfUser(View::$postData['username'], View::$postData['selfgroup']);
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin');
                exit;
            }
            if(View::$postData['todo'] == "delUser" && isset(View::$postData['username']) && preg_match("/$nameRegX/", View::$postData['username']))
            {
                Model::RemoveUser(View::$postData['username']);
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin');
                exit;
            }
            if(View::$postData['todo'] == "addUser" && isset(View::$postData['username']))
            {
                if(Model::AddUser(View::$postData['username']))
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin');
                }
                else
                {
                    View::SetFinalHeader('Location: ?'.View::$pageKey.'=useradmin&'.View::$messageKey.'=hibaadd');
                }
                exit;
            }

            View::SetFinalHeaderWithCookies('Location: ?'.View::$pageKey.'=useradmin&'.View::$messageKey.'=hiba');
            exit;
        }

        if(View::$message == 'hiba')
        {
            $template->AddData('RESPONSE', '<h4 class="error-text center">Hibás vagy hiányos adatokat adott meg, kérem próbálja újra!</h4>');
        }
        if(View::$message == 'hibaadd')
        {
            $template->AddData('RESPONSE', '<h4 class="error-text center">A hozzáadás sikertelen! Az érték már létezik?</h4>');
        }


        $template->AddData("REGEX", $nameRegX);
        $template->AddData("NAMEDESCRIPTION", $nameRequirementText);


        $groups = Model::GetAllGroups();
        $table = "";
        $i = 1;
        foreach($groups as $group)
        {
            $pagesMetaOfGroup = Model::GetWUIPagesMetaOfGroup($group);
            $pagesOfGroup = array();
            foreach($pagesMetaOfGroup as $pageMeta)
            {
                $pagesOfGroup[] = $pageMeta['name'];
            }
            $pagesStringPretty = htmlspecialchars(implode(', ', $pagesOfGroup));
            $pagesStringForJS = json_encode($pagesOfGroup);

            $tools = Template::NewFromFile('useradmin_grouptools.html');
            $tools -> AddData('PAGELIST', $pagesStringForJS);
            $tools -> AddData('GROUP', View::EscStrForJS($group));
            $toolsHTML = $tools -> Render(true);
            unset($tools);

            if($group == 'engineer')
            {
                $toolsHTML = "Az 'engineer' csoport nem módosítható.";
                $pagesStringPretty = "*";
            }

            $table .= '<tr><th>'.$i++."</th><td>"
              .htmlspecialchars($group)
              .'</td><td title="'.$pagesStringPretty.'">'.$pagesStringPretty."</td>"
              .'<td class="excel">'."\n".$toolsHTML
              .'</td></tr>';
            
        }
        $template -> AddData('GROUPSTABLE', $table);


        $dataOfUsers = Model::GetAllUsers();
        $table = "";
        $i = 1;
        foreach($dataOfUsers as $userData)
        {
            $tools = Template::NewFromFile('useradmin_usertools.html');
            $tools -> AddData('USER', View::EscStrForJS($userData['user']));
            $tools -> AddData('GROUP', View::EscStrForJS($userData['groupname']));
            $toolsHTML = $tools -> Render(true);
            unset($tools);

            if(in_array($userData['groupname'], $groups))
            {
                $groupname = htmlspecialchars($userData['groupname']);
            }
            else
            {
                $groupname = '<span class="secondary-text">'.htmlspecialchars($userData['groupname']).'</span>';
            }
            $table .= '<tr><th>'.$i++."</th><td>"
              .htmlspecialchars($userData['user'])
              .'</td><td>'.$groupname."</td>"
              .($userData['user'] == 'engineer' ? "<td>Az 'engineer' felhasználó nem módosítható" : '<td class="excel">'."\n".$toolsHTML)
              .'</td></tr>';
            
        }
        $template -> AddData('USERSTABLE', $table);


        $pages = Model::GetWUIPagesMeta();
        $pageOptions = '';
        foreach($pages as $page)
        {
            $pageOptions .= '<option value="'.htmlspecialchars($page['name']).'">'.htmlspecialchars($page['name'])."</option>\n";
        }
        $template -> AddData('PAGELISTOPTIONS', $pageOptions);

        $groupOptions = '';
        foreach($groups as $group)
        {
            $groupOptions .= '<option value="'.htmlspecialchars($group).'">'.htmlspecialchars($group)."</option>\n";
        }
        $template -> AddData('GROUPOPTIONS', $groupOptions);
    }
}