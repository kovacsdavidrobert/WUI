<?php

abstract class Model
{

    private static array $cache;
    private static bool $sqlInited = false;

    /////////////////////////////////////////////////////
    // Adatok MySQL-ből                                //
    /////////////////////////////////////////////////////

    public static function GetPageInfo(string $name) : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT * FROM `SystemPages` WHERE `name` = \e$name\e;");
        if(count($resp))
        {
            return $resp[0];
        }
        throw new PageNotFoundException("A megadott oldal nem található!");
    }
 
    public static function GetBrowsablePages() : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT * FROM `SystemPages` ORDER BY `no`;");
        foreach($resp as $value)
        {
            if(isset($value['prettyName']) && $value['prettyName'] !== null && $value['enabled'] && $value['showInMenu'])
            {
                $list[] = ['page' => $value['name'], 'name' => $value['prettyName'], 'icon' => $value['icon'], 'permission' => $value['permission']];
            }
        }

        return $list;
    }

    public static function GetUserTokenData(string $userToken, bool $force = false) : array | false
    {
        global $cfg;
        if($userToken == '')
        {
            return false;
        }

        if(isset(self::$cache[__FUNCTION__.$userToken]) && $force == false)
        {
            return self::$cache[__FUNCTION__.$userToken];
        }

        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT * FROM UserTokens WHERE token = \e$userToken\e;");

        if($resp === false || empty($resp))
        {
            return false;
        }

        if(time() - strtotime($resp[0]['time']) > $cfg["maxSessionTime"])
        {
            return false;
        }

        self::$cache[__FUNCTION__.$userToken] = ['user' => $resp[0]['user'], 'time' => $resp[0]['time'], 'lastvisit' => $resp[0]['lastvisit']];
        return self::$cache[__FUNCTION__.$userToken];
    }

    public static function RemoveUserToken(string $userToken) : void
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $sql->query("DELETE FROM UserTokens WHERE UserTokens.token = \e$userToken\e;");
    }

    public static function RemoveUser(string $username) : void
    {
        self::RemoveAllTokenOfUser($username);
        $sql = Database::getInstance();
        if($username != "engineer")
        {
            $sql->query("DELETE FROM Users WHERE `user` = \e$username\e;");
        }
    }

    public static function RemoveAllTokenOfUser(string $username) : void
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $sql->query("DELETE FROM UserTokens WHERE UserTokens.user = \e$username\e;");
    }

    public static function AddNewTokenToUser(string $username) : string | false
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $sql->query("INSERT INTO UserTokens (user) VALUES (\e$username\e);");
        $resp = $sql->query("SELECT token FROM UserTokens WHERE id = ".$sql->GetLastID().";");

        if($resp === false || (!isset($resp[0]['token'])))
        {
            return false;
        }

        return $resp[0]['token'];
    }

    public static function GetUserData(string $username, bool $force = false) : array | false
    {
        if(isset(self::$cache[__FUNCTION__.$username]) && $force == false)
        {
            return self::$cache[__FUNCTION__.$username];
        }

        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT * FROM Users WHERE user = \e$username\e;");

        if($resp === false || empty($resp))
        {
            return false;
        }

        foreach($resp as &$elem)
        {
            $elem['groupname'] = $elem['groupname'] == null ? 'NO_GROUP' : $elem['groupname'];
        }

        self::$cache[__FUNCTION__.$username] = $resp[0];
        return self::$cache[__FUNCTION__.$username];
    }

    public static function GetGroupOfUser(string $username, bool $force = false) : string | false
    {
        $userData = self::GetUserData($username, $force);

        if($userData == false)
        {
            return false;
        }

        return $userData['groupname'];
    }

    public static function GetPasswordOfUser(string $username, bool $force = false) : string | false
    {
        $userData = self::GetUserData($username, $force);

        if($userData == false)
        {
            return false;
        }

        return $userData['password'];
    }

    public static function SetPasswordOfUser(string $username, string $newPassword) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $newPassword = hash("sha256", $newPassword);
        $sql->query("UPDATE Users SET password = '$newPassword' WHERE Users.user = \e$username\e;");
        $newSavedPassword = self::GetPasswordOfUser($username, true);


        return $newSavedPassword == $newPassword;
    }

    public static function SetGroupOfUser(string $username, string $groupname) : void
    {
        $validGroups = self::GetAllGroups();
        self::InitSQL();
        $sql = Database::getInstance();
        if(!in_array($groupname, $validGroups))
        {
            $sql->query("UPDATE Users SET `groupname` = NULL WHERE `user` = \e$username\e");
        }
        else
        {
            $sql->query("UPDATE Users SET `groupname` = \e$groupname\e WHERE `user` = \e$username\e");
        }

    }

    public static function GetAllGroups($force = false) : array
    {
        if(isset(self::$cache[__FUNCTION__]) && $force == false)
        {
            return self::$cache[__FUNCTION__];
        }

        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT groupname FROM Groups;");
        $ret = array();
        if($resp === false)
        {
            return $ret;
        }
        foreach($resp as $row)
        {
            $ret[] = $row['groupname'];
        }

        self::$cache[__FUNCTION__] = $ret;
        return self::$cache[__FUNCTION__];
    }

    public static function GetAllUsers($force = false) : array //user, password, groupname
    {
        if(isset(self::$cache[__FUNCTION__]) && $force == false)
        {
            return self::$cache[__FUNCTION__];
        }

        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT * FROM Users;");
        if($resp === false)
        {
            return array();
        }

        foreach($resp as &$elem)
        {
            $elem['groupname'] = $elem['groupname'] == null ? 'NO_GROUP' : $elem['groupname'];
        }
        self::$cache[__FUNCTION__] = $resp;
        return self::$cache[__FUNCTION__];
    }

    public static function GetWUIPagesMeta($force = false) : array
    {
        if(isset(self::$cache[__FUNCTION__]) && $force == false)
        {
            return self::$cache[__FUNCTION__];
        }

        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT `name`, `comment` FROM `Pages`;");
        if($resp === false)
        {
            return array();
        }

        self::$cache[__FUNCTION__] = $resp;
        return self::$cache[__FUNCTION__];
    }

    public static function GetWUIPageIDbyName(string $name) : int
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT `pageid` FROM `Pages` WHERE `name` = \e$name\e;");

        return (isset($resp[0]) && isset($resp[0]['pageid'])) ? (int)$resp[0]['pageid'] : -1;
    }

    public static function GetWUIPageData(string $name) : string
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT `data` FROM `Pages` WHERE `name` = \e$name\e;");
        if(isset($resp[0]) && isset($resp[0]['data']))
        {
            return $resp[0]['data'];
        }
        return '';
    }

    public static function GetWUIPageCRC32(string $name) : string
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT CRC32(`data`) AS 'CRC32' FROM `Pages` WHERE `name` = \e$name\e;");
        if(isset($resp[0]) && isset($resp[0]['CRC32']))
        {
            return $resp[0]['CRC32'];
        }
        return '';
    }

    public static function SetWUIPageData(string $name, string $data) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        //Új sorokat engedélyezzük:
        $data = str_replace("\n", '\n', $data);
        $data = View::CleanInput($data);
        $data = Database::EscStrForSQL($data);
        $data = str_replace('\\\\n', '\n', $data);

        try
        {
            $sql->query("UPDATE `Pages` SET data = '$data' WHERE `name` = \e$name\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function GetWUIPagesMetaOfGroup(string $groupname, $force = false) : array
    {
        if(isset(self::$cache[__FUNCTION__.$groupname]) && $force == false)
        {
            return self::$cache[__FUNCTION__.$groupname];
        }
        self::InitSQL();
        $sql = Database::getInstance();
        if($groupname == 'engineer')
        {
            $resp = self::GetWUIPagesMeta();
        }
        else
        {
            $resp = $sql->query("SELECT `Pages`.`name`, `Pages`.`comment` FROM Pages INNER JOIN PagesOfGroup ON "
            ."PagesOfGroup.pageid = Pages.pageid AND PagesOfGroup.groupname = \e$groupname\e;");
        }
        self::$cache[__FUNCTION__.$groupname] = $resp;
        return self::$cache[__FUNCTION__.$groupname];
    }

    public static function SetWUIPagesOfGroup(array $pagelist, string $groupname) : void
    {
        $pages = self::GetWUIPagesMeta();
        $validPages = array();
        foreach($pages as $page)
        {
            $validPages[] = $page['name'];
        }

        $ok = true;
        foreach($pagelist as $page)
        {
            if(!in_array($page, $validPages))
            {
                $ok = false;
                break;
            }
        }

        if($ok)
        {
            self::InitSQL();
            $sql = Database::getInstance();
            $sql->query("DELETE FROM PagesOfGroup WHERE `PagesOfGroup`.`groupname` = \e$groupname\e;");
            foreach($pagelist as $page)
            {
                $id = $sql->query("SELECT pageid FROM `Pages` WHERE `name` = \e$page\e");
                $sql->query("INSERT INTO PagesOfGroup (`groupname`, `pageid`) VALUES (\e$groupname\e, \e{$id[0]['pageid']}\e);");
            }
            
        }
    }

    public static function RemoveGroup(string $groupname) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $sql->query("UPDATE `Users` SET `groupname` = NULL WHERE `groupname` = \e$groupname\e;");
        $sql->query("DELETE FROM `PagesOfGroup` WHERE `groupname` = \e$groupname\e;");
        return $sql->query("DELETE FROM `Groups` WHERE `groupname` = \e$groupname\e;");
    }

    public static function AddGroup(string $groupname) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $sql->query("INSERT INTO `Groups` (`groupname`) VALUES (\e$groupname\e);");
        
        }
        catch(Exception $err)
        {
            return false;
        }
        return true;
    }

    public static function AddUser(string $username) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $sql->query("INSERT INTO `Users` (`user`, `password`) VALUES (\e$username\e, '');");
        
        }
        catch(Exception $err)
        {
            return false;
        }
        return true;
    }

    public static function GetAllClient() : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $clients = $sql->query("SELECT * FROM `Clients`;");
        foreach($clients as &$client)
        {
            $client['nodesCount'] = count(self::GetNodesOfClient($client['clientname']));
        }

        return $clients;
    }

    public static function GetClientByName(string $clientname) : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $client = $sql->query("SELECT * FROM `Clients` WHERE `clientname` = \e$clientname\e;");
        if(isset($client[0]))
        {
            $client[0]['nodesCount'] = count(self::GetNodesOfClient($client[0]['clientname']));
            return $client[0];
        }

        return array();
    }

    public static function GetNodesOfClient(string $clientname) : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT `Nodes`.`nodename` AS 'nodename', `Clients`.`clientname` AS 'clientname' "
        ."FROM `Nodes` JOIN `Clients` WHERE `Clients`.`clientid` = `Nodes`.`clientid` AND "
        ."`Clients`.`clientname` = \e$clientname\e ORDER BY `clientname`, `nodename`;");

        return $resp;
    }

    public static function GetAllNode(bool $force = false) : array
    {
        if(isset(self::$cache[__FUNCTION__]) && $force == false)
        {
            return self::$cache[__FUNCTION__];
        }
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT `Nodes`.`nodename` AS 'nodename', `Clients`.`clientname` AS 'clientname', "
        ."`Nodes`.`ip` AS 'ip', `Nodes`.`driver` AS 'driver', `Nodes`.`scantime` AS 'scantime', `Nodes`.`nodeid` AS 'nodeid' "
        ."FROM `Nodes` JOIN `Clients` WHERE `Clients`.`clientid` = `Nodes`.`clientid` ORDER BY `clientname`, `nodename`;");

        foreach($resp as &$row)
        {
            $vars = $sql->query("SELECT `nodeid` FROM `Variables` WHERE `nodeid` = \e{$row['nodeid']}\e");
            $row['vars'] = count($vars);
        }

        self::$cache[__FUNCTION__] = $resp;
        return self::$cache[__FUNCTION__];        
    }

    public static function GetVariablesOfNode(string $clientname, string $nodename, string $order, bool $force = false) : array
    {
        if(!in_array($order, ['symbol', 'datatype', 'address', '']))
        {
            $order = 'symbol';
        }

        if($order == 'symbol')
        {
            $order = 'ORDER BY cast(`symbol` as unsigned)';
        }
        else
        {
            if($order != '')
            {
                $order = "ORDER BY `$order`";
            }

        }

        if(isset(self::$cache[__FUNCTION__.$clientname.$nodename.$order]) && $force == false)
        {
            return self::$cache[__FUNCTION__.$clientname.$nodename.$order];
        }

        self::InitSQL();
        $sql = Database::getInstance();
        $nodeid = self::GetNodeID($clientname, $nodename);
        
        $resp = $sql->query("SELECT `symbol`, `datatype`, `address`, `comment`,`readonly` FROM `Variables` "
          ."WHERE `nodeid` = \e$nodeid\e $order;"
        );

        self::$cache[__FUNCTION__.$clientname.$nodename.$order] = $resp;
        return self::$cache[__FUNCTION__.$clientname.$nodename.$order];        
    }

    public static function GetVariablesByID(int $variableid = -1) : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        if($variableid == -1)
        {
            $resp = $sql->query("SELECT `Clients`.`clientname`, `Nodes`.`nodename`, `Variables`.`symbol`, "
            ."`Variables`.`datatype`, `Variables`.`address`, `Variables`.`comment` FROM `Variables` "
            ."JOIN `Clients` JOIN `Nodes` WHERE `Variables`.`nodeid` = `Nodes`.`nodeid` AND `Nodes`.`clientid` = `Clients`.`clientid`;");
        }
        else
        {
            $resp = $sql->query("SELECT `Clients`.`clientname`, `Nodes`.`nodename`, `Variables`.`symbol`, "
            ."`Variables`.`datatype`, `Variables`.`address`, `Variables`.`comment` FROM `Variables` "
            ."JOIN `Clients` JOIN `Nodes` WHERE `Variables`.`nodeid` = `Nodes`.`nodeid` AND `Nodes`.`clientid` = `Clients`.`clientid` "
            ."AND `Variables`.`variableid` = \e$variableid\e;");
        }
        return $resp;       
    }

    public static function IsVariableReadonly(int $variableid) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT `readonly` FROM `Variables` WHERE `variableid` = \e$variableid\e;");

        return (isset($resp[0]) && isset($resp[0]['readonly']) && $resp[0]['readonly'] > 0);
    }

    public static function AddVariableToNode(string $clientname, string $nodename, array $vardata) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $nodeid = self::GetNodeID($clientname, $nodename);

            $sql->query("INSERT INTO `Variables` (`nodeid`, `symbol`, `datatype`, `address`, `comment`, `readonly`) VALUES "
            ."(\e$nodeid\e, \e{$vardata['symbol']}\e, \e{$vardata['datatype']}\e, \e{$vardata['address']}\e, "
            ."\e{$vardata['comment']}\e, \e{$vardata['readonly']}\e);");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function RemoveVariableInNode(string $clientname, string $nodename, string $symbol) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $nodeid = self::GetNodeID($clientname, $nodename);
            $resp = $sql->query("SELECT `variableid` FROM `Variables` WHERE `nodeid` = \e$nodeid\e AND `symbol` = \e$symbol\e;");
            $variableid = $resp[0]['variableid'];
            $sql->query("DELETE FROM `VariablesOfPages` WHERE `variableid` = \e$variableid\e");
            $sql->query("DELETE FROM `LoggedData` WHERE `variableid` = \e$variableid\e");
            $sql->query("DELETE FROM `LastLoggedData` WHERE `variableid` = \e$variableid\e");
            $sql->query("DELETE FROM `RealtimeData` WHERE `variableid` = \e$variableid\e");
            $sql->query("DELETE FROM `Variables` WHERE `nodeid` = \e$nodeid\e AND `symbol` = \e$symbol\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function ModifyVariableInNode(string $clientname, string $nodename, array $vardata) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $nodeid = self::GetNodeID($clientname, $nodename);
            $sql->query("UPDATE `Variables` SET `symbol` = \e{$vardata['newsymbol']}\e, "
            ."`datatype` = \e{$vardata['datatype']}\e, `address` = \e{$vardata['address']}\e, "
            ."`comment` = \e{$vardata['comment']}\e, `readonly` = \e{$vardata['readonly']}\e "
            ."WHERE `nodeid` = \e$nodeid\e AND `symbol` = \e{$vardata['symbol']}\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function ModifyNode(string $clientname, string $nodename, array $nodedata) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $nodeid = self::GetNodeID($clientname, $nodename);
            $sql->query("UPDATE `Nodes` SET `nodename` = \e{$nodedata['newnodename']}\e, `ip` = \e{$nodedata['ip']}\e, "
            ."`driver` = \e{$nodedata['driver']}\e, `scantime` = \e{$nodedata['scantime']}\e WHERE `nodeid` = \e$nodeid\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function AddNode(string $clientname, array $nodedata) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $clientid = self::GetClientByName($clientname)['clientid'];
            $sql->query("INSERT INTO `Nodes` (`clientid`,`nodename`,`ip`,`driver`,`scantime`) VALUES "
            ."(\e$clientid\e, \e{$nodedata['nodename']}\e, \e{$nodedata['ip']}\e, \e{$nodedata['driver']}\e, \e{$nodedata['scantime']}\e);");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function RemoveNode(string $clientname, string $nodename) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $nodeid = self::GetNodeID($clientname, $nodename);
            $sql->query("DELETE FROM `Nodes` WHERE `nodeid` = \e$nodeid\e");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    private static function GetNodeID(string $clientname, string $nodename, bool $force = false) : int
    {
        if(isset(self::$cache[__FUNCTION__.$clientname.$nodename]) && $force == false)
        {
            return self::$cache[__FUNCTION__.$clientname.$nodename];
        }
        self::InitSQL();
        $sql = Database::getInstance();
        $nodeid = $sql->query("SELECT `Nodes`.`nodeid` AS 'nodeid' FROM `Nodes` JOIN `Clients` WHERE `Clients`.`clientid` = `Nodes`.`clientid` AND "
        ."Nodes.nodename = \e$nodename\e AND Clients.clientname = \e$clientname\e;");

        if(count($nodeid) > 1)
        {
            throw new Exception("Konzisztenciahiba a nodeID lekérdezésénél.");
        }
        if(isset($nodeid[0]['nodeid']))
        {
            self::$cache[__FUNCTION__.$clientname.$nodename] = $nodeid[0]['nodeid'];
            return self::$cache[__FUNCTION__.$clientname.$nodename];
        }
        self::$cache[__FUNCTION__.$clientname.$nodename] = -1;
        return self::$cache[__FUNCTION__.$clientname.$nodename];
    }

    private static function GetNodenameByID(int $nodeid, $force = false) : string
    {
        if(isset(self::$cache[__FUNCTION__.$nodeid]) && $force == false)
        {
            return self::$cache[__FUNCTION__.$nodeid];
        }

        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT `nodename` FROM `Nodes` WHERE `nodeid` = \e$nodeid\e;");

        self::$cache[__FUNCTION__.$nodeid] = $resp[0]['nodename'];
        return self::$cache[__FUNCTION__.$nodeid]; 
    }

    public static function GetNodeData(string $clientname, string $nodename, $force = false) : array
    {
        if(isset(self::$cache[__FUNCTION__.$clientname.$nodename]) && $force == false)
        {
            return self::$cache[__FUNCTION__.$clientname.$nodename];
        }

        $nodeid = self::GetNodeID($clientname, $nodename);
        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT * FROM `Nodes` WHERE `nodeid` = \e$nodeid\e;");

        self::$cache[__FUNCTION__.$clientname.$nodename] = $resp[0];
        return self::$cache[__FUNCTION__.$clientname.$nodename]; 
    }

    public static function AddNewWUIPage(string $pagename, string $comment) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $sql->query("INSERT INTO `Pages` (`name`, `comment`) VALUES (\e$pagename\e, \e$comment\e);");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function MondifyWUIPageMeta(string $pagename, string $newpagename, string $newcomment) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $sql->query("UPDATE `Pages` SET `name` = \e$newpagename\e, `comment` = \e$newcomment\e WHERE `name` = \e$pagename\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function RemoveWUIPage(string $pagename) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $resp = $sql->query("SELECT `pageid` FROM `Pages` WHERE `name` = \e$pagename\e;");
            self::SetVariablesOfPage($resp[0]['pageid'],[]);
            $sql->query("DELETE FROM `PagesOfGroup` WHERE `pageid` = \e{$resp[0]['pageid']}\e");
            $sql->query("DELETE FROM `Pages` WHERE `name` = \e$pagename\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function CopyWUIPage(string $pagename) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $newpagename = $pagename.(string)rand(10, 99).chr(rand(65, 90));
        try
        {
            $sql->query("INSERT INTO `Pages` (`name`, `comment`, `data`) SELECT \e$newpagename\e, `comment`, `data` FROM `Pages` WHERE `name` = \e$pagename\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function AddClient(string $clientname) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $sql->query("INSERT INTO `Clients` (`clientname`, `token`, `time`) VALUES (\e$clientname\e, UUID(), CURRENT_DATE());");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function RenameClient(string $clientname, string $newclientname) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $sql->query("UPDATE `Clients` SET `clientname` = \e$newclientname\e WHERE `clientname` = \e$clientname\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function RemoveClient(string $clientname) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $sql->query("DELETE FROM `WriteToClient` WHERE `clientname` = \e$clientname\e");
            $sql->query("DELETE FROM `Clients` WHERE `clientname` = \e$clientname\e;");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function WriteVariablesToClient($clientname): bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $clientVars = $sql->query("SELECT `Variables`.* FROM `Variables` JOIN `Clients` JOIN `Nodes` WHERE "
            ."`Variables`.`nodeid` = `Nodes`.`nodeid`  AND `Nodes`.`clientid` = `Clients`.`clientid` AND `Clients`.`clientname` = \e$clientname\e;");

            $node = array();
            foreach($clientVars as $row)
            {
                $nodename = self::GetNodenameByID($row['nodeid']);
                if(!isset($node[$nodename]['nodename']))
                {
                    $nodeData = self::GetNodeData($clientname, $nodename);
                    $node[$nodename]['scan'] = $nodeData['scantime'];
                    $node[$nodename]['driver'] = $nodeData['driver'];
                    $node[$nodename]['ip'] = $nodeData['ip'];
                    $node[$nodename]['data'] = array();
                    $node[$nodename]['nodename'] = $nodename;
                }

                $node[$nodename]['data'][] = ['type' => $row['datatype'], 'addr' => $row['address']];
            }

            $nodelist = array();
            $nodelist['type'] = "nodelist";
            $nodelist['node'] = array();
            foreach ($node as $n)
            {
                $nodelist['node'][] = $n;
            }

            $sql->query("INSERT INTO `WriteToClient` (`clientname`, `json`) values (\e$clientname\e, \e".json_encode($nodelist)."\e);");
            return true;
        }
        catch(Exception $ex)
        {
            return false;
        }
            
    }

    public static function GetRealtimeDataOfClientNode(string $clientname, string $nodename, string $authGroupname = "") : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $nodeid = self::GetNodeID($clientname, $nodename);
        if($authGroupname == "")
        {
            $resp = $sql->query("SELECT `RealtimeData`.`data`, `RealtimeData`.`time`, `Variables`.`symbol` FROM `RealtimeData` "
            ."JOIN `VariablesOfPages` JOIN `PagesOfGroup` JOIN `Variables` WHERE `Variables`.`variableid` = `RealtimeData`.`variableid` "
            ."AND `Variables`.`nodeid` = \e$nodeid\e AND `VariablesOfPages`.`pageid` = `PagesOfGroup`.`pageid`;");
        }
        else
        {
            $resp = $sql->query("SELECT `RealtimeData`.`data`, `RealtimeData`.`time`, `Variables`.`symbol` FROM `RealtimeData` "
            ."JOIN `VariablesOfPages` JOIN `PagesOfGroup` JOIN `Variables` WHERE `Variables`.`variableid` = `RealtimeData`.`variableid` "
            ."AND `Variables`.`nodeid` = \e$nodeid\e AND `VariablesOfPages`.`pageid` = `PagesOfGroup`.`pageid` AND "
            ."`VariablesOfPages`.`variableid` = `Variables`.`variableid` AND `PagesOfGroup`.`groupname` = \e$authGroupname\e;");
        }
        return $resp;
    }

    public static function SetRealtimeDataByClient(string $clientname, string $nodename, array $data) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        try
        {
            $nodeid = self::GetNodeID($clientname, $nodename);
            $sql->query("INSERT INTO `RealtimeData` (`variableid`, `data`) SELECT `Variables`.`variableid`, "
            ."\e{$data['value']}\e FROM `Variables` WHERE `Variables`.`datatype` = \e{$data['type']}\e AND "
            ."`Variables`.`address` = \e{$data['addr']}\e AND `Variables`.`nodeid` = \e$nodeid\e "
            ."ON DUPLICATE KEY UPDATE `data` = VALUES(`data`), `time` = CURRENT_TIMESTAMP();");
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }


    public static function RemoveOldLoggedData(int $hours = 168) : void
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $sql->query("DELETE FROM `LoggedData` WHERE `LoggedData`.`time` < DATE_SUB(NOW(), INTERVAL $hours HOUR);");
    }

    public static function GetLoggedDataOfClientNode(string $clientname, string $nodename, string $symbol, int|float $page = 0, int $limit = 50, string $authGroupname = "") : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $nodeid = self::GetNodeID($clientname, $nodename);
        if($authGroupname == "")
        {
            $gr = "";
            $gr2 = "";
        }
        else
        {
            $gr = "INNER JOIN `VariablesOfPages` ON `VariablesOfPages`.`variableid` = `Variables`.`variableid` INNER JOIN `PagesOfGroup` ON "
            ."`VariablesOfPages`.`pageid` = `PagesOfGroup`.`pageid`";
            $gr2 = "AND `PagesOfGroup`.`groupname` = \e$authGroupname\e";
        }
        $count = $sql->query("SELECT COUNT(`LoggedData`.`time`) AS 'count' FROM `LoggedData` INNER JOIN `Variables` ON "
        ."`LoggedData`.`variableid` = `Variables`.`variableid` $gr "
        ."WHERE `Variables`.`nodeid` = \e$nodeid\e AND `Variables`.`symbol` = \e$symbol\e $gr2 ;");

        $max = ceil($count[0]['count']/$limit);
        $resp = [];
        if($max > 0)
        {
            if($page != INF)
            {
                $page = $page > $max ? $max : $page;
                $page = $page == 0 ? $max : $page;
                $offset = $limit * ($page - 1);
                $resp = $sql->query("SELECT `LoggedData`.*, `Variables`.`symbol` AS 'symbol' FROM `LoggedData` INNER JOIN `Variables` ON "
                ."`LoggedData`.`variableid` = `Variables`.`variableid` $gr "
                ."WHERE `Variables`.`nodeid` = \e$nodeid\e AND `Variables`.`symbol` = \e$symbol\e $gr2 ORDER BY `LoggedData`.`time` LIMIT $limit OFFSET $offset;");  
            }
            else
            {
                //Teljes export a felhasználónak:
                $resp = $sql->query("SELECT `LoggedData`.`data`, `LoggedData`.`time`, `Variables`.`symbol` AS 'symbol' FROM `LoggedData` INNER JOIN `Variables` ON "
                ."`LoggedData`.`variableid` = `Variables`.`variableid` $gr "
                ."WHERE `Variables`.`nodeid` = \e$nodeid\e AND `Variables`.`symbol` = \e$symbol\e $gr2 ORDER BY `LoggedData`.`time`;");  
            }
 
        }
        return ['max' => $max, 'data' => $resp];
    }


    public static function GetLoggedDataOfClientNodeByTime(string $clientname, string $nodename, string $symbol, int $from = 0, int $to = 0, string $authGroupname = "") : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $nodeid = self::GetNodeID($clientname, $nodename);
        if($authGroupname == "")
        {
            $gr = "";
            $gr2 = "";
        }
        else
        {
            $gr = "INNER JOIN `VariablesOfPages` ON `VariablesOfPages`.`variableid` = `Variables`.`variableid` INNER JOIN `PagesOfGroup` ON "
            ."`VariablesOfPages`.`pageid` = `PagesOfGroup`.`pageid`";
            $gr2 = "AND `PagesOfGroup`.`groupname` = \e$authGroupname\e";
        }

        $to = $to == 0 ? time() : $to;

        $resp = [];

        $resp = $sql->query("SELECT `LoggedData`.`data`, `LoggedData`.`time`, `Variables`.`symbol` AS 'symbol' FROM `LoggedData` INNER JOIN `Variables` ON "
        ."`LoggedData`.`variableid` = `Variables`.`variableid` $gr "
        ."WHERE `Variables`.`nodeid` = \e$nodeid\e AND `Variables`.`symbol` = \e$symbol\e $gr2 AND "
        ."UNIX_TIMESTAMP(`LoggedData`.`time`) >= \e$from\e AND UNIX_TIMESTAMP(`LoggedData`.`time`) <= $to "
        ."ORDER BY `LoggedData`.`time`;");  
    
 
        return $resp;
    }


    public static function UpdateClientTime(string $clientname) : void
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $sql->query("UPDATE `Clients` SET `time` = current_timestamp() WHERE `clientname` = \e$clientname\e;");
    }

    public static function WriteTagInNode(string $clientname, string $nodename, string $symbol, float $value) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $nodeid = self::GetNodeID($clientname, $nodename);
        if($nodeid >= 0)
        {
            $vardata = $sql->query("SELECT `symbol`, `datatype`, `address`, `comment` FROM `Variables` "
            ."WHERE `nodeid` = \e$nodeid\e AND `symbol` = \e$symbol\e;"
            );

            if(count($vardata) == 1)
            {
                $json =
                [
                    'type'     => 'writetag',
                    'nodename' => $nodename,
                    'data'     => 
                    [
                        'type'  => $vardata[0]['datatype'],
                        'addr'  => $vardata[0]['address'],
                        'value' => $value

                    ]
                ];
                try
                {
                    $sql->query("INSERT INTO `WriteToClient` (`clientname`, `json`) VALUES (\e$clientname\e, "
                    ."\e".json_encode($json)."\e);");
                    return true;
                }
                catch(Exception $ex)
                {
                    return false;
                }
            }
        }
        return false;
    }

    public static function GetClientByToken(string $clientToken) : array | false
    {
        if(strlen($clientToken) < 10)
        {
            return false;
        }

        self::InitSQL();
        $sql = Database::getInstance();
        $resp = $sql->query("SELECT * FROM `Clients` WHERE `token` = \e$clientToken\e;");
        if(count($resp) == 1)
        {
            return $resp[0];
        }
        return false;
    }

    public static function GetClientCommand(string $clientname) : array
    {
        self::InitSQL();
        $sql = Database::getInstance();
        return $sql->query("SELECT * FROM WriteToClient WHERE `clientname` = \e$clientname\e;"); 
    }

    public static function RemoveClientCommand(int $id) : void
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $sql->query("DELETE FROM WriteToClient WHERE `id` = \e$id\e;"); 
    }

    public static function SetVariablesOfPage(int $pageid, array $variableidlist) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance();   
        try
        {
            $sql->query("DELETE FROM `VariablesOfPages` WHERE `pageid` = \e$pageid\e");
            foreach($variableidlist as $variableid)
            {
                $sql->query("INSERT INTO `VariablesOfPages` (`pageid`, `variableid`) VALUES "
                ."(\e$pageid\e, \e$variableid\e) ON DUPLICATE KEY UPDATE `variableid` = \e$variableid\e;");
            }
        }
        catch(Exception $ex)
        {
            return false;
        }
        return true;
    }

    public static function IsVariableOfGroup(string $groupname, int $variableid) : bool
    {
        self::InitSQL();
        $sql = Database::getInstance(); 
        $resp = $sql->query("SELECT * FROM `VariablesOfPages` JOIN `PagesOfGroup` WHERE `VariablesOfPages`.`pageid` = `PagesOfGroup`.`pageid` "
        ."AND `PagesOfGroup`.`groupname` = \e$groupname\e AND `VariablesOfPages`.`variableid` = \e$variableid\e;");

        return count($resp) > 0;
    }

    public static function GetVariableID(string $clientname, string $nodename, string $symbol) : int
    {
        self::InitSQL();
        $sql = Database::getInstance();
        $nodeid = self::GetNodeID($clientname, $nodename);
        $resp = $sql->query("SELECT `variableid` FROM `Variables` WHERE `nodeid` = \e$nodeid\e AND `symbol` = \e$symbol\e;");

        return (isset($resp[0]) && isset($resp[0]['variableid'])) ? $resp[0]['variableid'] : -1;
    }


    /////////////////////////////////////////////////////
    // MySQL inicializálása, táblák ellenőrzése        //
    /////////////////////////////////////////////////////
    private static function InitSQL() : void
    {
        if(self::$sqlInited)
        {
            return;
        }

        $sql = Database::getInstance();
        $resp = $sql->query("SHOW TABLES WHERE Tables_in_".Database::$sqlDB." LIKE '%';");
        $tableList = array();

        foreach($resp as $row)
        {
            $tableList[] = $row["Tables_in_".Database::$sqlDB];
        }

        //itt lehet a táblákat létrehozni



        self::$sqlInited = true;
    }
}
