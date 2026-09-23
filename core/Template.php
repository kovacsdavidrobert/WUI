<?php

class Template
{
    private string $origHtml, $lastRender;
    private array $flagsData; //Minden flag-hez egy array-nyi data fog tartozni.
    private bool $modified;
    
    public function getFlags() : array
    {
        return array_keys($this->flagsData);
    }
    
    private function __construct(string $html)
    {
        $this->ReloadFromString($html);
    }

    public function ReloadFromString(string $html): void
    {
        global $cfg;
        $this->modified = true;
        $this->origHtml = $html;
        $this->flagsData = array();
        if(preg_match_all($cfg["flagPattern"], $this->origHtml, $flags))
        {
            foreach($flags[1] as $flag)
            {
                $this->flagsData[$flag] = array();
            }
        }
    }

    public function ReloadFromFile(string $filename) : void
    {
        if(is_file("template/".$filename))
        {
            $html = file_get_contents("template/".$filename);
        }
        else
        {
            throw new Exception("A template nem létezik: $filename");
        }
        $this->ReloadFromString($html);
    }

    public static function New() : Template
    {
        return new Template('');
    }
    
    public static function NewFromFile(string $filename) : Template
    {
        if(is_file("template/".$filename))
        {
            $html = file_get_contents("template/".$filename);
        }
        else
        {
            throw new Exception("A template nem létezik: $filename");
        }
        return new Template($html);
    }
    
    public static function NewFromString(string $html) : Template
    {
        return new Template($html);
    }


    public function AddData(string $flag, string|Template $data, bool $isHTML = true) : bool
    {
        if(array_key_exists($flag, $this->flagsData))
        {
            $this->flagsData[$flag][] = $isHTML ? $data : htmlspecialchars($data);
            $this->modified = true;
            return true;
        }
        return false;
    }
    
    public function ClearFlag(string $flag) : bool
    {
        if(array_key_exists($flag, $this->flagsData))
        {
            $this->flagsData[$flag] = array();
            $this->modified = true;
            return true;
        }
        return false;
    }
    
    public function GetFlagDataByKey(string $flag, string $dataKey) : Template|string|false
    {
        if(array_key_exists($flag, $this->flagsData) && array_key_exists($dataKey, $this->flagsData[$flag]))
        {
            return $this->flagsData[$flag][$dataKey];
        }
        return false;
    }
    
    public function Render(bool $force = false) : string
    {
        global $cfg;
        if(!$this->modified && !$force)
        {
            return $this->lastRender;
        }
        $this->lastRender = $this->origHtml;
        foreach ($this->flagsData as $flag=>$datas)
        {
            $tmp = "";
            foreach ($datas as $data)
            {
                if(is_a($data, "Template"))
                {
                    $tmp .= $data->Render();
                }
                else
                {
                    $tmp .= $data;
                }
            }
            $this->lastRender = str_replace($cfg["flagSign"].$flag.$cfg["flagSign"], $tmp, $this->lastRender);
        }
        $this->modified = false;
        return $this->lastRender;
    }
}
