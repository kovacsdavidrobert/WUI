<?php

abstract class EditorController implements IPageBase
{
    public static $blankPage = '<div id="editor"></div>';
    #[\Override]
    public static function Run(Template $template = null): void
    {
        global $cfg;
        if(strlen(View::$pageUploadTmpFilename) && isset(View::$postData['name']) && strlen(View::$postData['name']))
        {
            $file = file_get_contents(View::$pageUploadTmpFilename);
            if(preg_match('/^<div id="editor"/', $file))
            {
                //A változó felhasználóbarát elérési útját id-vé alakítjuk:
                $file = preg_replace_callback('|(data-tag-connection=")([a-zA-Z0-9,_.]+/[a-zA-Z0-9,_.]+/[a-zA-Z0-9,_.]+)(")|',
                'Controller::PregGetVariableIDfromPath', $file);
                
                //most összeszedjük a variableid-ket, majd a pageid-t a név alapján:
                preg_match_all('/data-tag-connection="(\d+)"/', $file, $m);
                $pageid = Model::GetWUIPageIDbyName(View::$postData['name']);

                //Ha mnden ok, akkor bejegyezzük az oldal által használt változók azonosítóját
                if($pageid >= 0 && count($m[1]) > 0)
                {
                    Model::SetVariablesOfPage($pageid, $m[1]);
                }

                if(Model::SetWUIPageData(View::$postData['name'], $file))
                {
                    View::JSONresponse(['state' => 'ok']);
                }
                else
                {
                    View::JSONresponse(['state' => 'error']);
                    exit;
                }
            }
            View::JSONresponse(['state' => 'error']);
            exit;
        }
        if(isset(View::$postData['symbol']))
        {
            $path = $cfg["symbolPath"];
            if(View::$postData['symbol'] == 'del' && isset(View::$postData['file']) &&
            (!preg_match('/\.\./', View::$postData['file'])) && is_file("$path/user/".View::$postData['file']))
            {
                unlink("$path/user/".View::$postData['file']);
            }

            if(View::$postData['symbol'] == 'upload' && strlen(View::$usersymbolUploadTmpFilename) && 
            mime_content_type(View::$usersymbolUploadTmpFilename) && preg_match('/^image/', mime_content_type(View::$usersymbolUploadTmpFilename)))
            {
                $filename = View::$usersymbolUploadFilename;
                while(is_file("$path/user/".$filename))
                {
                    $filename = '_'.$filename;
                    if(strlen($filename) > 100)
                    {
                        die;
                    }
                }
                move_uploaded_file(View::$usersymbolUploadTmpFilename, "$path/user/".$filename);
            }
            if(View::$postData['symbol'] == 'get' || View::$postData['symbol'] == 'upload' || View::$postData['symbol'] == 'del')
            {
                $files = scandir("$path/");
                sort($files);
                $k = 0;
                for($i = 0; $i < count($files); $i++)
                {
                    if(preg_match("/svg$/i", pathinfo($files[$i], PATHINFO_EXTENSION)))
                    {
                        $json1[$k++] = $files[$i];
                    }
                }

                $k=0;
                $files = scandir("$path/user");
                for($i = 0; $i < count($files); $i++)
                {
                    if(preg_match("/svg$|jpg$|png$/i", pathinfo($files[$i], PATHINFO_EXTENSION)))
                    {
                        $json2[$k++] = $files[$i];
                    }
                }
                $json['lib'] = $json1;
                $json['user'] = $json2;
                View::JSONresponse($json);
            }


            View::JSONresponse(['state' => 'error']);
            exit;
        }
        
        if(isset(View::$postData['taglist']))
        {
            View::XMLresponseFromString(self::GetTaglist());
            exit;
        }
        
        $editor = View::getBase();
        if(strlen(View::$wuipage))
        {
            $pages = Model::GetWUIPagesMeta();
            $pagenames = array();
            foreach($pages as $page)
            {
                $pagenames[] = $page['name'];
            }

            if(in_array(View::$wuipage, $pagenames))
            {
                $pagedata = Model::GetWUIPageData(View::$wuipage);
                if(strlen($pagedata) > 0)
                {
                    $pagedata = preg_replace_callback('/(data-tag-connection=")(\d+)(")/', 'Controller::PregGetVariablePathfromID', $pagedata);
                    $editor -> AddData('EDITORCONTENT', $pagedata);
                }
                else
                {
                    $editor -> AddData('EDITORCONTENT', self::$blankPage);
                }
                $editor -> AddData('PAGE', View::$wuipage);
                $editor -> AddData('PAGEURL', urlencode(View::$wuipage));
            }
            else
            {
                $editor -> AddData('EDITORCONTENT', '<div class="warning-box" style="margin: 1rem;">'
                .'Ez az oldal nem létezik! Hozza létre a Screen Manager-ben!</div>');
            }
        }
        else
        {
            $editor -> AddData('EDITORCONTENT', '<div class="warning-box" style="margin: 1rem;">'
            .'Először hozza létre az oldalt a Screen Manager-ben!</div>');
        }

        $editor -> AddData('TAGLIST', self::GetTaglist());
    }

    private static function GetTaglist() : string
    {
        $xml = "";
        $tags = Model::GetVariablesByID();
        foreach($tags as $tag)
        {
            $varPath = $tag['clientname'].'/'.$tag['nodename'].'/'.$tag['symbol'];
            $xml .= '<option value="'.$varPath.'" title="'.$varPath.'" data-type="'.$tag['datatype']
            .'" data-comment="'.$tag['comment'].'">'.$varPath."</option>\n";
        }
        return $xml;
    }

}