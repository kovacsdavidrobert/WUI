<?php

abstract class ScreensController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $userData = Model::GetUserTokenData(View::$userToken);
        $group = Model::GetGroupOfUser($userData['user']);
        $pages = Model::GetWUIPagesMetaOfGroup($group);
        $i = 1;
        $screenTable = "";
        foreach($pages as $page)
        {
            if(!preg_match('/^\-/', $page['name']))
            {
                $screenTable .= "<tr><th>$i</th>"
                .'<td><a href="#" onclick="window.open(\'?'.View::$pageKey.'=view&page='
                .urlencode($page['name']).'\').focus()">'.htmlspecialchars($page['name']).'</a></td>'
                .'<td class="w50" title="'.htmlspecialchars($page['comment']).'">'.$page['comment'].'</td>';
                $i++;
            }
        }

        $template -> AddData("SCREENTABLE", $screenTable);
    }
}