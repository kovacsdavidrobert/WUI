<?php

abstract class ViewController implements IPageBase
{
    #[\Override]
    public static function Run(Template $template = null): void
    {
        $userData = Model::GetUserTokenData(View::$userToken);
        $userLevel = PermissionHandler::GetUserLevel()->value;
        $group = Model::GetGroupOfUser($userData['user']);
        $pages = Model::GetWUIPagesMetaOfGroup($group);
        $pagesOfGroup = array();
        foreach($pages as $pageMeta)
        {
            $pagesOfGroup[] = $pageMeta['name'];
        }

        if(View::$request == 'crc')
        {
            if(strlen(View::$wuipage) > 0 && in_array(View::$wuipage, $pagesOfGroup))
            {
                $crc32 = Model::GetWUIPageCRC32(View::$wuipage);
                View::JSONresponse(['crc' => $crc32, 'page' => View::$wuipage]);
                exit;
            }
            else
            {
                View::JSONresponse(['state' => 'error']);
                exit;
            }
        }

        if(strlen(View::$wuipage) == 0 || !in_array(View::$wuipage, $pagesOfGroup))
        {
            throw new PageException(View::$wuipage, "A megadott oldal megtekintéséhez magasabb jog szükséges!");
        }

        $pagelist = "";
        foreach($pages as $page)
        {
            if(!preg_match('/^-/', $page['name']))
            {
                $pagelist .= '<a href="?'.View::$pageKey.'=view&page='.urlencode($page['name']).'"><li title="'.htmlspecialchars($page['comment']).'">'
                .htmlspecialchars($page['name'])."</li></a>\n";
            }
        }

        $view = View::getBase();
        $view -> AddData('PAGELIST', $pagelist);

        if($userLevel >= Permissions::Engineer->value)
        {
            $view -> AddData('EDITLINK', '<hr><ul class="menu">'
            ."<li onclick=\"window.open('?p=editor&page=".urlencode(View::$wuipage)."', 'e_".View::$wuipage."').focus()\">"
            .'<img src="img/star.svg" class="icon" alt="engineer">Edit this screen</li></ul>');
        }

        $pagedata = Model::GetWUIPageData(View::$wuipage);
        if($pagedata == '')
        {
            $pagedata = EditorController::$blankPage;
        }
        $pagedata = preg_replace_callback('/(data-tag-connection=")(\d+)(")/', 'Controller::PregGetVariablePathfromID', $pagedata);
        $view -> AddData('PAGEDATA', $pagedata);

    }
}