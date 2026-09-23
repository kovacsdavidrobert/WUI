<?php
abstract class MenuController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $linkList = "";
        $pages = Model::GetBrowsablePages();
        $template->ReloadFromFile("menu.html");
        $pageKey = View::$pageKey;
        $lastLevel = $pages[0]['permission'];
        $userLevel = PermissionHandler::GetUserLevel()->value;

        foreach($pages as $page)
        {
            if($page['page'] == View::$page)
            {
                $actual = 'actual';
            }
            else
            {
                $actual = '';
            }
            if($userLevel >= $page['permission']){
                $actualLevel = ($page['permission'] == Permissions::BlankPass->value ? Permissions::User->value : $page['permission']);
                if($lastLevel != $actualLevel)
                {
                    $lastLevel = $actualLevel;
                    $linkList .= "<hr>\n";
                }

                if($page['permission'] >= Permissions::Engineer->value)
                {
                    $linkList .= <<<LISTEND

                        <a href="?$pageKey={$page['page']}">
                            <li class="engineertool $actual"><img src="img/{$page['icon']}" class="icon" alt="">
                                {$page['name']}
                            </li>
                        </a>
                    LISTEND;
                }
                else
                {
                    if(!($userLevel > Permissions::Guest->value && $page['page'] == 'login') && !($userLevel == Permissions::Guest->value && $page['page'] == 'logout'))
                    {
                        $linkList .= <<<LISTEND

                            <a href="?$pageKey={$page['page']}">
                                <li class="$actual">
                                    <div class="active">
                                        <img src="img/{$page['icon']}" class="icon" alt="">
                                        {$page['name']}
                                    </div>
                                </li>
                            </a>
                        LISTEND;
                    }
                }
            }

        }

        $template->AddData('LIST', $linkList);
        //$template->AddData('PAGE', View::$pageKey);
    }
}
