<?php

class Database
{
    private static string $sqlUser = 'root';
    private static string $sqlPass = '';
    private static string $sqlServer = 'localhost';
    public static string $sqlDB = 'wui';
    private static Database $instance;
    public static int $count = 0;

    private string $lastID = 'NULL';
    private mysqli $conn;

    private function __construct()
    {
        try
        {
            $this->conn = new mysqli(self::$sqlServer, self::$sqlUser, self::$sqlPass, self::$sqlDB);
        }
        catch (Exception $err)
        {
            throw new Exception('SQL csatlakozás nem sikerült: '.$err->getMessage());
        }
    }

    function __destruct()
    {
        $this->conn->close();
    }

    public static function getInstance()
    {
        if (!isset(self::$instance))
        {
            self::$instance = new Database();
        }

        return self::$instance;
    }

    public function query(string $sqlQuery) : array | bool
    {
        $resp = array();
        $row = array();
        self::$count ++;//ideiglenes lekérdezésszámláló (cache teszt)

        //Tesztelem, hogy van e a sztringben \e (escape) karakter, és hogy az előfordulása páros.
        //Ha igen, akkor az \e karakterek közötti szövegrészt escape-elem. Az \e karaktereket '-re
        //cserélem. Ha páratlan az \e száma akkor hibát dobok.
        //Fontos, hogy így is szűrni kell a user-inputokat: törölni kell: [\x00-\x1f]

        if($escCount = preg_match_all('/\e/', $sqlQuery))
        {
            if($escCount % 2)
            {
                throw new Exception("SQL query tisztítási hiba!");
            }
            else
            {
                $queryParts = explode("\e",$sqlQuery);
                for($i = 1; $i < count($queryParts); $i+=2)
                {
                    if(preg_match('/like\s*$/i',$queryParts[$i-1]))
                    {
                        $queryParts[$i] = self::EscStrForSqlLIKE($queryParts[$i]);
                    }
                    else
                    {
                        $queryParts[$i] = self::EscStrForSQL($queryParts[$i]);
                    }
                }

                $sqlQuery = implode("'", $queryParts);
            }
        }
        
        try
        {
            //file_put_contents("sql.txt", $sqlQuery."\n", FILE_APPEND);
            $result = $this->conn->query($sqlQuery);
        }
        catch(Exception $err)
        {
            throw new Exception('SQL lekérdezési hiba: '.$err->getMessage());
        }

        if(is_a($result, "mysqli_result"))
        {
            if($result->num_rows > 0)
            {
                while($row = $result->fetch_assoc())
                {
                    $resp[] = $row;
                }
            }
            return $resp;
        }
        if(isset($this->conn->insert_id))
        {
            $this->lastID = (string)$this->conn->insert_id;
        }
        else
        {
            $this->lastID = 'NULL';
        }

        return $result === true;
    }

    public function GetLastID() : string
    {
        return $this->lastID;
    }

    public static function EscStrForSQL(string $strToEscapeForSQL) : string
    {
        $strToEscapeForSQL = str_replace("\\", "\\\\", $strToEscapeForSQL);
        $strToEscapeForSQL = str_replace("'", "\\'", $strToEscapeForSQL);
        $strToEscapeForSQL = str_replace('"', "\\\"", $strToEscapeForSQL);
  
        return $strToEscapeForSQL;
    }

    public static function EscStrForSqlLIKE(string $strToEscapeForSQL) : string
    {
        $strToEscapeForSQL = str_replace("\\", "\\\\", $strToEscapeForSQL);
        $strToEscapeForSQL = str_replace("'", "\\'", $strToEscapeForSQL);
        $strToEscapeForSQL = str_replace('"', "\\\"", $strToEscapeForSQL);
        $strToEscapeForSQL = str_replace("%", "\\%", $strToEscapeForSQL);
        $strToEscapeForSQL = str_replace("_", "\\_", $strToEscapeForSQL);
  
        return $strToEscapeForSQL;
    }
}