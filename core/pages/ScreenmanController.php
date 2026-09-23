<?php

abstract class ScreenmanController implements IPageBase
{
    #[\Override]
    public static function Run(?\Template $template = null): void
    {
        $pageRegX = '^[a-zA-Z0-9,_\-. öüóőúéáűíÖÜÓŐÚÉÁŰÍ]{1,32}$'; //§PAGEREGEX§
        $commentRegX = '^[^\x22\x27\x22]{1,512}$'; //§COMMENTREGEX§

        if(isset(View::$postData['pagename']) && preg_match("/$pageRegX/", View::$postData['pagename']) && isset(View::$postData['todo']))
        {
            if(View::$postData['todo'] == "modifyPage" && isset(View::$postData['newpagename']) && preg_match("/$pageRegX/", View::$postData['pagename']) &&
            isset(View::$postData['newcomment']) && (preg_match("/$commentRegX/", View::$postData['newcomment']) || View::$postData['newcomment'] == ''))
            {
                Model::MondifyWUIPageMeta(View::$postData['pagename'], View::$postData['newpagename'], View::$postData['newcomment']);
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=screenman');
                exit;
            }
            if(View::$postData['todo'] == "addPage" && isset(View::$postData['comment']) &&
            (preg_match("/$commentRegX/", View::$postData['comment']) || View::$postData['comment'] == ''))
            {
                Model::AddNewWUIPage(View::$postData['pagename'], View::$postData['comment']);
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=screenman');
                exit;
            }

            if(View::$postData['todo'] == "delPage")
            {
                Model::RemoveWUIPage(View::$postData['pagename']);
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=screenman');
                exit;
            }

            if(View::$postData['todo'] == "copyPage")
            {
                Model::CopyWUIPage(View::$postData['pagename']);
                View::SetFinalHeader('Location: ?'.View::$pageKey.'=screenman');
                exit;
            }
            View::SetFinalHeader('Location: ?'.View::$pageKey.'=screenman&'.View::$messageKey.'=hiba');
            exit;
        }

        if(View::$message == 'hiba')
        {
            $template->AddData('RESPONSE', '<h4 class="error-text center">Hibás vagy hiányos adatokat adott meg, kérem próbálja újra!</h4>');
        }

        $pages = Model::GetWUIPagesMeta();
        $i = 1;
        $screenTable = "";
        foreach($pages as $page)
        {
            $tools = Template::NewFromFile('screenman_tools.html');
            $tools -> AddData('NAME', $page['name']);
            $tools -> AddData('COMMENT', $page['comment']);
            $toolHTML = $tools -> Render();
            unset($tools);
            $screenTable .= "<tr><th>$i</th>"
            .'<td><a href="#" onclick="window.open(\'?'.View::$pageKey.'=editor&page='
            .urlencode($page['name']).'\', \'e_'.htmlspecialchars($page['name']).'\').focus()">'
            .htmlspecialchars($page['name']).'</a></td>'
            .'<td title="'.htmlspecialchars($page['comment']).'">'.$page['comment'].'</td>'
            ."<td class=\"excel\">$toolHTML</td>";
            $i++;
        }

        $template -> AddData("SCREENTABLE", $screenTable);
        $template -> AddData("PAGEREGEX", $pageRegX);
        $template -> AddData("COMMENTREGEX", $commentRegX);
    }
}