WUI Programdokumentáció
=======================

|Készítette:        |[Kovács Dávid Róbert](https://kdr.hu/cv) |
|:----------------- |----------------------------------------:|

#### [Projektkönyvtár](https://server.kdr.hu/cloud/browse.php?dir=Nyilv%C3%A1nos/oowui/)

### Tartalomjegyzék

|Fejezet |Oldalszám|
|:----|----:|
|1) Bevezetés|2|
|1.1) A rendszer bemutatása|2|
|1.2) Program egységek áttekintése|3|
|2) Felépítés|4|
|2.1) Telepítési lehetőségek|4|
|2.1.1) Telepítés webkiszolgálóra|4|
|2.1.2) Alternatív telepítés NAS szerverre|6|
|2.2) PHP osztályok áttekintése|7|
|2.2.1) Egyszerűsített osztálydiagram|7|
|2.2.2) Példányosítható osztályok|8|
|2.2.3) Absztrakt osztályok|8|
|2.3) Adatbázis|14|
|2.3.1) Táblák sémája|14|
|2.4) Fontosabb kliensoldalon futó JavaScript funkciók|22|
|2.5) Adatgyűjtő kliens|25|
|3) Használati esetek|26|
|3.1) Bejelentkezés, munkamenet kezelés|26|
|3.2) Általános rendszerfelhasználó lehetőségei|27|
|3.3) Mérnök csoport tagjainak használati lehetőségei|28|
|3.4) Adatgyűjtő kliensek használati lehetőségei|29|
|4) Továbbfejlesztési, optimalizálási lehetőségek|30|
|5) Köszönetnyilvánítás|32|

1) Bevezetés
------------
### 1.1) A rendszer bemutatása
A WUI (**W**eb*-based* **U**ser **I**nterface) egy SCADA rendszer, ami ipari folyamatok megjelenítésére, kezelésére és adatok gyűjtésére szolgál. A programrendszer magában foglalja:

- a megjelenítő - kezelő oldalak<sup>1</sup> létrehozásának és grafikus szerkesztésének lehetőségét,
- az oldalak futtatása valósidejű adatokkal
- az adatgyűjtő kliensek konfigurálását
- PLC-k felvételét az adatgyűjtőkhöz
- adat-területek definiálását a PLC-kben (PLC változók)
- minden online szerkesztési lehetőséggel rendelkező állomány importálási és exportálási lehetőségét
- felhasználói csoportok kezelését, jogok megadását.

>1: etimológiai magyarázat: *2.2.3/CONTROLLER/PageController osztályok/EditorController* pontban

[Rövid bemutató videó (00:03:56)](https://kdr.hu/video/WUI%20SCADA%20rendszer%20bemutat%C3%B3.mp4)

---

### 1.2) Program egységek áttekintése
Technikailag 3 jól elkülöníthető programegységből áll a rendszer:

1. Szerveroldali programrész (PHP)
    - felhasználók,
    - munkamenetek,
    - jogosultságok kezelése
    - kapcsolat tartása az adatbázissal
    - adatgyűjtők kiszolgálása
    - egyéb backend jellegű feladatok.
2. Adatgyűjtő egységek programja (NodeJS)
    - kapcsolat tartása a
        - szerverrel *és a*
        - hozzá csatlakozó PLC-kkel
    - adatok gyűjtése és írása, az adott PLC típus kommunikációs protokolljának használatával
        - jelenleg implementálva: **Siemens S7 Protokoll**
        - *tervezett bővítés: __Modbus TCP__*
    - PLC leíró adatok és írási parancsok "fogadása a szervertől" és ezek kezelése
    - kommunikációs és egyéb hibák kezelése
3. Kliens oldali kezelőrendszerek (JavaScript)
    - a komplexebb kliens oldali (böngészőben futó) szerkesztési, adatmegjelenítési feladatok tartoznak ehhez a részhez:
        - html5 WYSIWYG szerkesztő - "runtime" szerkesztő,
        - a szerkesztett oldal futtatása, feltöltése adatokkal
        - PLC változók CRUD kezelője
        - a fenti részek import/export lehetőségei 


2) Felépítés
------------

### 2.1) Telepítési lehetőségek
#### 2.1.1) Telepítés webkiszolgálóra

![WUI telepítési diagram](dep1.svg)

A rendszer webes része egy egyszerű AMP kiszolgálón fut.  
A szükséges PHP verzió: *PHP/8.2.12.* Adatbázis-kezelő rendszerként a *MySQL* vagy a *MariaDB* egyaránt megfelel. A tesztekhez használt adatbázis-kezelők a következők voltak:

- *10.4.32-MariaDB* és
- *10.11.11-MariaDB*.

A web szerver típusa: *Apache/2.4.58 (Unix)*.  
A PHP az adatbázis eléréséhez a *MySQLi* osztályt használja. Külső PHP könyvtárakat a rendszer nem használ. A felmerülő rendszeres adminisztrációs feladatokat a szerverhez érkező kérések triggerelik, jelen verzió nem használ időzített feladatokat (pl. cron).

A felhasználók webböngészőn keresztül érhetik el a rendszer funkcióit.

>Ezek a "mérnök" csoport esetén lehetnek rendszer-adminisztrációs és szerkesztési funkciók, egyéb felhasználók esetén csupán a megtekintési és kezelési lehetőségek biztosítottak (a csoportjuknak engedélyezett alrendszereken).

Tesztelt böngészők:

- *Google Chrome 134.0.6998.88*
- *Firefox 136.0.1*.

A megjelenítés és a kezelés változhat a két böngésző esetén, de a funkcionalitás és a kívánt grafikai struktúra esztétikuma mind a két esetben biztosított.  
A rendszer nem használ olyan web-es API-t, ami feltétlenül megkövetelné a biztonságos (HTTP**S**) kapcsolatot, de mivel már egy fájl letöltés esetén is figyelmeztetést kapunk abban az esetben, ha nem használunk SSL-t ezért érdemes ezt a kapcsolati módot választanunk. Az automatikus átirányítást már a webszerveren is beállíthatjuk, így kezelhetőségi és biztonsági előnyökhöz is juthatunk.

A rendszer felhasználóin kívül az adatgyűjtő kliensek is a szerverhez kapcsolódnak. Ezek REST API-kon keresztül tartják a kapcsolatot a szerverrel. A PLC-kből gyűjtött adatokat előre konfigurált frekvenciával küldik fel a szervernek, valamint valós időben hajtják végre a szerver által küldött feladatokat. Az adatgyűjtő program futtatásához *NodeJS* környezetre van szükség az adatgyűjtő eszközökön, valamint importálni és telepíteni kell az ábrán látható modulokat. A tesztek során használt NodeJS verzió: *v18.17.1*.  
Az adatgyűjtők a helyi hálózatukon (vagy *VPN*-en) elérhető PLC-k adatait képesek írni és olvasni. Jelenleg csak a ***node snap7*** csomag által biztosított *S7 Ethernet* protokoll támogatott, mellyel a legtöbb Siemens PLC-vel tartható a kapcsolat.


Íme a fenti UML diagram marketing-barátabb változata:  
#### ![WUI felhő topológia](topo1.jpg)

A fent taglalt telepítési terv fűszerezhető virtuális hálózatokkal, a szerver gép lehet maga a böngészőt futtató gép is, de felhőként is működhet. A sok kombináció közül még egyet részletesebben tárgyalok:

---

#### 2.1.2) Alternatív telepítés NAS szerverre

A végfelhasználóknál felmerülhet az igény, hogy az egész SCADA rendszer a helyi OT hálózatukon működjön, és csak a helyi hálózatról lehessen a kezelőfelületet megtekinteni, az erre dedikált számítógépeken. Ennek elsősorban információbiztonsági okai lehetnek, de az a szempont sem elhanyagolható, hogy nem szeretnének egy külső informatikai infrastruktúra fenntartásáért rendszeres többletköltségeket fizetni. Sokan jobb szeretnének "dobozos terméket" kapni, az ellátandó feladatokra. Egyes NAS szerverek (pl. Synology) már lehetőséget biztosítanak minden AMP funkció kiszolgálására, és telepíthető rájuk a NodeJS futtatókörnyezet is. További előnyt jelenthet - egy helyi szerver PC-vel szemben -, hogy egy NAS esetében hátrébb húzódhatnak az IT-OT háború frontvonalai (operációs rendszer frissítési szükségessége, Win10 - 11 átállás problémaköre...). A NAS szerver, saját rendszerrel rendelkezik, és csak kivételes esetben lehet szükség a firmware frissítésére (valami ordító biztonsági hiba esetén). Az alábbi ábra ezt a telepítési módot mutatja be:

#### ![WUI helyi topológia](topo2.jpg)

---

### 2.2) PHP osztályok áttekintése
#### 2.2.1) Egyszerűsített osztálydiagram
![Egyszerűsített osztálydiagram](class1.svg)

A fenti ábrán a szerver oldalon futó PHP program egyszerűsített osztálydiagramját láthatjuk. Az egyszerűsítés a kapcsolatok számának csökkentésében merült ki, hogy az áttekinthetőséget megőrizzük. A program objektumorientált MVC struktúrát valósít meg. A dupla vastag vonal azt jelképezi, hogy az egyes oldalak kontrollerei ugyan azokhoz az osztályokhoz férnek hozzá, mint maga a *Controller* osztály.

#### 2.2.2) Példányosítható osztályok
A legtöbb osztály absztrakt, a példányosítható osztályok a következők:

- **Template** osztály  
Ez valósítja meg a sablonkezelést. Szövegből vagy fájlból képes létrehozni példányát, és képes speciális kulcsszavakat vagy szövegre, vagy más sablonra cserélni, rekurzívan.
- **PageException** és **PageNotFoundException** osztályok  
A hibakezelés részei, az **Exception** osztály leszármazottjai. Céljuk, hogy adott hibák saját típushoz tartozzanak, így azok csoportosan kezelhetőek.
- **Database** osztály  
Ez az osztály *singletone* szervezésű, lévén, hogy a rendszer *egy* adatbázis-szerverrel tart csak kapcsolatot. Feladata a kapcsolat kiépítésén kívül:
    - felhasználótól érkező adatokat tartalmazó lekérdezések tisztítása, az *SQL injection* kezelése, programozóbarát módon.
    - utolsó *ID*-t tartalmazó válasz számának rögzítése
    - lekérdezések számlálása (optimalizáláshoz)
    - erőforrások felszabadítása

#### 2.2.3) Absztrakt osztályok
A továbbiakban az MVC szervezés alapján taglalom a fennmaradó (absztrakt) osztályokat:

- **VIEW** egység:
    - **View** osztály  
      A megjelenítő és felhasználói kapcsolattartó funkció dandárját ez az osztály végzi.
        - kérés metódusának és típusának megállapítása/kezelése
        - HTML fejlécek kezelése
        - Sütik kezelése
        - bejövő adatok szanitálása
        - kimeneti formátum kódolása JSON-ba, ha szükséges
        - kimeneti HTML összeállítása a sablonokból
        - csak ez az osztály ír a kimeneti pufferbe.
    - **Template** osztály  
      ld. fentebb: ***2.2.2/Template osztály***.
- **CONTROLLER** egység:
    - **Controller** osztály
        - futtatja a kívánt Page kontrollert (a megnyitott weboldal kiszolgálóját) - amennyiben lehetséges -, figyelembe véve a felhasználói jogosultságokat
        - betölti az adott oldalhoz szükséges sablont (ha van ilyen)
        - meghatározza az adott oldalhoz tartozó ikont és egyéb szükséges adatot.
    - **PermissionHandler** osztály
        - meghatározza a bejelentkezett felhasználó jogosultságait, valamint kezeli a munkamenetet
        - olyan funkciókat tartalmaz, melyek segítenek a Page kontrollereknek az oldal felhasználói szinthez való illesztéséhez.
        - a felhasználói szinteket a ***Permissions*** *enum* tartalmazza:
            - 0: Guest
            - 5: BlankPass
            - 10: User
            - 20: Engineer
    - **PageController** osztályok  
      Ezek kivétel nélkül az adott (meglátogatott) oldal, vagy annak egy részének kiszolgálásában vesznek részt. Dokumentumtörzset nem feltétlenül állítanak elő. Közös tulajdonságuk, hogy implementálják az ***IPageBase*** interfészt, ami a ***Run(****Template****)*** metódus definiálására kötelezi az osztályt. Ez a metódus futtatja le a Page kontroller osztály törzsét, és így kap(hat)ja meg az osztály a hozzá tartozó sablont.
        - **ForbiddenController**  
        Tiltott erőforrás megtekintése esetén erre történik átirányítás.
        - **ClientCommandRestController**  
        Egy REST kontroller, ami az adatgyűjtőkkel tartja a kapcsolatot. A kliens kérése után max. 20 másodpercig várakozik az üres válasszal. Ha közben a klienshez intézett adat jelenik meg az adatbázisban, akkor leküldi az információt azonnal. A kliens feladata, hogy az üres válasz, vagy a parancsot tartalmazó válasz után azonnal újabb kérést intézzen az erőforrás irányába (végtelen ciklusban). Ez az osztály felel első sorban azért, hogy a felhasználók által előidézett PLC változók írásai valós időben (közel determinisztikusan) végbemenjenek.
        - **ScreenmanController**  
        Mérnök hozzáférés esetén ez az oldal sorolja fel az eddig elkészített grafikus képernyőket, és lehetőséget biztosít azok kezelésére. Új grafikus oldalt is itt adhatunk hozzá.
        - **ClientsController**  
        Mérnök hozzáférés esetén az adatgyűjtő kliensek és az azokhoz tartozó csomópontok (PLC) kezelési lehetőségeit valósítja meg ez az oldal.
        - **HeaderController**  
        A dinamikus fejlécet állítja elő, az ezt igénylő oldalak számára.
        - **LoginController**  
        Bejelentkezési lehetőséget biztosít. Ha a felhasználó nem jelentkezik be akkor a főoldalon kívül csak ezt éri el.
        - **FooterController**  
        A dinamikus láblécet állítja elő, az ezt igénylő oldalak számára.
        - **LoggedDataController**  
        A naplózott változóértékeket jeleníti meg az oldal és lehetőséget biztosít azok exportálására *CSV* formátumban.
        - **ClientUploadRestController**  
        Egy REST kontroller, ami az adatgyűjtőkkel tartja a kapcsolatot. Beállított időközönként ide tölti fel a kívánt PLC változók értékeit az adatgyűjtő. Az adatok *JSON* formátumban érkeznek, *gZip* tömörítéssel. A kicsomagolást és az asszociatív tömbbé alakítást a ***View*** osztály végzi el. 
        - **VariablesController**  
        Mérnök hozzáféréssel rendelkező felhasználok az osztály által előállított oldalon tudnak változókat definiálni és kezelni a korábban felvett csomópontokhoz (PLC). A funkciók jelentős részéért nem ez az osztály felel, hanem a js/***variables.js*** JavaScript állomány.
        - **UseradminController**  
        Mérnök hozzáféréssel rendelkező felhasználok az osztály által előállított oldalon tudnak felhasználókat felvenni, és a jogosultságaikat is itt tudják definiálni.
        - **MenuController**  
        A *Header-* és a *FooterController*hez hasonlóan ez is csak egy részét állítja elő az oldalnak: a legördülő szendvics menüt. Tartalmát a *PermissionController*ben definiált függvények befolyásolják (a felhasználói szint szerint).
        - **EditorController**  
        Ez az osztály is csak Mérnök szintű felhasználót szolgál ki. Az osztály által előállított weboldalon lehet *WYSIWYG* módon szerkeszteni a grafikus képernyőket.  
A grafikus képernyők mentését is ez az osztály végzi. A mentés előtt elemzést is végez: megállapítja, hogy a feltöltendő grafikus oldal mely *PLC változókat* használja, és ezek sorszámát (elsődleges kulcs) külön menti. Ez később információbiztonsági okokból lesz fontos.
A funkciók jelentős részéért itt sem ez az osztály felel, hanem a js/***editor.js*** JavaScript állomány.
>**Itt színt kell vallanom:** A különböző HMI szerkesztő környezetek ezeket a grafikus oldalakat hívják *Display*-nek, *Screen*-nek is és ezek összességét többnyire *Runtime*-nak nevezik. Ezeket a kifejezéseket a projektben igen választékosan használtam, beleértve a magyar fordításaikat is. Ha ez nem elég, megspékeltem az *oldal*, *page* és *WUIPage* kifejezésekkel is. Annyit ígérhetek, hogy a **dokumentációban** az online szerkesztett, az élő adatok megjelenítésére létrehozott ... OLDAL-t következetesen "**grafikus oldal**"-nak vagy "**grafikus képernyő**"-nek fogom nevezni, hogy nehezebb legyen összekeverni azokkal a weboldalakkal, amik a rendszer részeit képezik.  

        - **LogoutController**  
        Válaszának törzse nincs, csak kijelentkeztet és a főoldalra irányít át.
        - **ScreensController**  
        A bejelentkezett felhasználók részére ez az osztály generálja le az általuk megtekinthető grafikus oldalak listáját. A grafikus oldalak linkjei az alábbi vezérlőre mutatnak:
        - **ViewController**  
        Ezen osztály azzal a fő feladattal rendelkezik, hogy a felhasználó által kért grafikus oldal *HTML* kódját visszaadja, és betöltesse a js/***view.js*** JavaScript állományt, ha a felhasználó az adott grafikus oldalt megtekintheti. Továbbiak: ***ViewRestController***.
        - **SettingsController**  
        A felhasználók saját beállításait kezeli. Jelenleg csak a jelszó megváltoztatására szolgál.  
További részfunkciója, hogy a frissen felvett felhasználóknak első jelszavát is itt lehet megadni. (A frissen felvett felhasználók jelszava üres). Amíg nem állított be jelszót a bejelentkezett felhasználó, addig csak ennek az osztálynak az oldalát, a főoldalt és a kijelentkezést tudja kezelni. A többi oldalhoz / funkcióhoz nincs jogosultsága.
        - **ViewRestController**  
        A fentebb taglalt js/***view.js*** JavaScript kód ehhez az osztályhoz intéz API lekérdezéseket. Beállítható frekvenciával olvassa a grafikus oldalon megjelenő élő adatokat, és interakció hatására azonnali kérést hajt végre (melyben az írási kérelmet küldi el). Ezt szolgálja ki a szóban-forgó osztály.
        - **NotFoundController**  
        A jó öreg 404-es oldal kiszolgálója. A ***Controller*** osztály ide irányítja a böngészőt, ha az nem létező oldalt akar lekérdezni. Hogy melyik oldal "létezik", melyik nem, azt az adatbázis résznél taglalom, a "SystemPages" táblánál.
        - **IndexController**  
        Utolsókból lesznek az elsők: ez a főoldalhoz tartozó osztály. A főoldalt tölti be, mely a felhasználói dokumentáció "kedvcsináló" részét jeleníti meg egy sablonból.
- **MODEL** egység:
    - **Model** osztály  
    Ez a legkövérebb osztály, és a ***Database*** (***2.2.2/Database***) osztályon kívül ez az egyetlen, ami a MODEL egységhez tartozik. Feladata természetesen a tárolt adatok kezelése és előfeldolgozása. Ezen kívül gyorsítótár kezelést is megvalósít. Az adatok tárolása kivétel nélkül a *relációs adatbázisban kiszolgáló*ban történik. Az *SQL lekérdezések* tervezésénél arra törekedtem, hogy az információk feldolgozásának nagyobb részét az adatbázis kiszolgáló végezze. További feldolgozási feladatokat a **Model** osztály függvényei-metódusai végeznek, és ha maradt még feldolgozási feladat, akkor azt a *Page kontrollerek* hajtják végre.  
Funkcióik szerint a függvényeket (és metódusokat) az alábbi módon lehet csoportosítani:
        - **a webes PHP keretrendszer alapfunkciói**
            - GetPageInfo(*name*)
            - GetBrowsablePages( )
            - InitSQL( )
        - **felhasználók és munkamenetek kezelése**
            - GetUserTokenData(*userToken, force*)
            - RemoveUserToken(*userToken*)
            - RemoveUser(*username*)
            - RemoveAllTokenOfUser(*username*)
            - AddNewTokenToUser(*username*)
            - GetUserData(*username, force*)
            - GetGroupOfUser(*username, force*)
            - GetPasswordOfUser(*username, force*)
            - SetPasswordOfUser(*username, newPassword*)
            - SetGroupOfUser(*username, groupname*)
            - GetAllGroups(*force*)
            - GetAllUsers(*force*)
            - RemoveGroup(*groupname*)
            - AddGroup(*groupname*)
            - AddUser(*username*)
        - **grafikus képernyők adminisztrációja**
            - GetWUIPagesMeta(*force*)
            - GetWUIPageIDbyName(*name*)
            - GetWUIPageData(*name*)
            - SetWUIPageData(*name, data*)
            - GetWUIPagesMetaOfGroup(*groupname, force*)
            - SetWUIPagesOfGroup(*pagelist, groupname*)
            - AddNewWUIPage(*pagename, comment*)
            - MondifyWUIPageMeta(*pagename, newpagename, newcomment*)
            - RemoveWUIPage(*pagename*)
            - CopyWUIPage(*pagename*)
        - **adatgyűjtők és csomópontok adminisztrációja**
            - GetAllClient( )
            - GetClientByName(*clientname*)
            - GetNodesOfClient(*clientname*)
            - GetAllNode(*force*)
            - ModifyNode(*clientname, nodename, nodedata*)
            - AddNode(*clientname, nodedata*)
            - RemoveNode(*clientname, nodename*)
            - GetNodeID(*clientname, nodename, force*)
            - GetNodenameByID(*nodeid, force*)
            - GetNodeData(*clientname, nodename, force*)
            - AddClient(*clientname*)
            - RenameClient(*clientname, newclientname*)
            - RemoveClient(*clientname*)
        - **csomópontokhoz tartozó változók kezelése**
            - GetVariablesOfNode(*clientname, nodename, order, force*)
            - GetVariablesByID(*variableid*)
            - IsVariableReadonly(*variableid*)
            - AddVariableToNode(*clientname, nodename, vardata*)
            - RemoveVariableInNode(*clientname, nodename, symbol*)
            - ModifyVariableInNode(*clientname, nodename, vardata*)
            - SetVariablesOfPage(*pageid, variableidlist*)
            - IsVariableOfGroup(*groupname, variableid*)
            - GetVariableID(*clientname, nodename, symbol*)
        - **élő változóadatok kezelése + adatnaplózás**
            - WriteVariablesToClient(*clientname*)
            - GetRealtimeDataOfClientNode(*clientname, nodename, authGroupname*)
            - SetRealtimeDataByClient(*clientname, nodename, data*)
            - RemoveOldLoggedData(*hours*)
            - GetLoggedDataOfClientNode(*clientname, nodename, symbol, page, limit, authGroupname*)
            - WriteTagInNode(*clientname, nodename, symbol, value*)
        - **adatgyűjtők autentikációja**
            - GetClientByToken(*clientToken*)
            - GetClientCommand(*clientname*)
            - RemoveClientCommand(*id*)
            - UpdateClientTime(*clientname*)

---

### 2.3) Adatbázis

#### 2.3.1) Táblák sémája:

![WUI adatbázis séma](wuiDB.png)

Az adatbázis 14 táblából épül fel. A táblák illesztése utf8mb4_general_ci. Kétféle motort használtam:

- **InnoDB** motor  
Általános táblákhoz ezt a motort használtam. A legtöbb funkciót ez a motor biztosítja.
- **MEMORY** motor  
A nagy sebessége és a tárolási módja miatt azoknál a tábláknál használtam, melyeknél a felülíró műveletek számossága és frekvenciája viszonylag magas, de a tárolt értékeknek pár másodperc múltán elvesztik információtartalmukat.


#### A táblák neve és a tárolómotorjuk:

|No.|Név              |Motor |
|:--|-----------------|------|
|1  | Clients         |InnoDB|
|2  | Groups          |InnoDB|
|3  | LastLoggedData  |MEMORY|
|4  | LoggedData      |InnoDB|
|5  | Nodes           |InnoDB|
|6  | Pages           |InnoDB|
|7  | PagesOfGroup    |InnoDB|
|8  | RealtimeData    |MEMORY|
|9  | SystemPages     |InnoDB|
|10 | UserTokens      |InnoDB|
|11 | Users           |InnoDB|
|12 | Variables       |InnoDB|
|13 | VariablesOfPages|InnoDB|
|14 | WriteToClient   |InnoDB|

#### 2.3.2) Táblák szerkezete és feladatuk

Az elsődleges kulcsot **P**-vel, az egyedi oszlopot **U**-val, az idegen kulcsokat **F**-el jelölöm. Csoportokat a **[ ]** zárójellel jelölöm.

#### Clients:

|Tulajdonság| Oszlop       | Típus      |Nulla| Alapértelmezett   |Extra         |
|:---------:|--------------|------------|-----|-------------------|--------------|
|P          |***clientid***|int(11)     |Nem  |                   |AUTO_INCREMENT|
|U          |**clientname**|varchar(32) |Nem  |                   |              |
|U          |**token**     |varchar(256)|Nem  |                   |              |
|           |time          |timestamp   |Nem  |current_timestamp()|              |

Az adatgyűjtő kliensek adatait tartalmazó tábla. A hozzáféréshez használt zsetont is tartalmazza a tábla. Ezt a rendszer generálja, amikor új klienst veszünk fel. A tokent be kell másolni a kliens konfigurációs fájljába. A felhasználó csak a kliens nevét látja, amit meg is változtathat, hiszen a rendszer a sorszám alapján azonosítja a klienst.

#### Nodes:

|Tulajdonság|Oszlop          |Típus                      |Nulla |Alapértelmezett|Extra         |
|:---------:|----------------|---------------------------|------|---------------|--------------|
|F          |**clientid**    |int(11)                    |Nem   |               |              |
|P          |***nodeid***    |int(11)                    |Nem   |               |AUTO_INCREMENT|
|U          |**nodename**    |varchar(32)                |Nem   |               |              |
|           |ip              |varchar(32)                |Nem   |               |              |
|           |driver          |varchar(32)                |Nem   |               |              |
|           |scantime        |int(11)                    |Nem   |1000           |              |

Az adatgyűjtőkhöz kapcsolt PLC-k táblája. Hivatkozik a fölötte lévő kliensre, azonosítása a klienssel megegyező módon történik. Itt lehet beállítani az adott PLC-hez tartozó frissítési időt. Az adott PLC-ből minden változó ezzel a frekvenciával fog kiolvasásra kerülni. Nevének, IP címének és frissítési idejének módosítása esetén az új konfigurációt le kell tölteni a kliensbe (ez már csak egy kattintás, amennyiben a kliens konfigurációs fájljában helyesen beállítottuk a szerver címét és a hozzáférési zsetont.

#### Groups:

|Tulajdonság|Oszlop         |Típus      |Nulla|Alapértelmezett|
|:---------:|---------------|-----------|-----|---------------|
|P          |***groupname***|varchar(64)|Nem  |               |

A felhasználói csoportok neveit tartalmazza. Friss telepítésnél ügyelni kell rá, hogy az *"engineer"* csoport szerepeljen benne. Egy felhasználó egy csoporthoz tartozhat. A csoport határozza meg, hogy a felhasználó melyik grafikus képernyőt tekintheti meg. Szerkesztési lehetősége csak az *engineer* csoport tagjainak van. Ők az összes oldalt megtekinthetik. A csoport neve nem módosítható, csak törölhető. Fejlesztési lehetőség: a csoportok számozása *(ID)*, így a nevüket meg lehet változtatni.

#### Users:

|Tulajdonság|Oszlop     |Típus      |Nulla   |Alapértelmezett |
|:---------:|-----------|-----------|--------|----------------|
|P          |***user*** |varchar(32)|Nem     |                |
|           |password   |varchar(64)|Nem     |                |
|F          |groupname  |varchar(64)|Igen    |NULL            |

A felhasználók táblája. Friss telepítésnél ügyelni kell rá, hogy az *"engineer"* felhasználó szerepeljen benne. Itt tároljuk a felhasználó csoportját és a jelszavát is **SHA256** kódolásban. Frissen hozzáadott felhasználónak még nincs csoportja, ilyenkor az érték *NULL*. Nincs csoport, nincs jog.

#### Variables:

|Tulajdonság|Oszlop          |Típus         |Nulla|Alapértelmezett|Extra         |
|:---------:|----------------|--------------|-----|---------------|--------------|
|P          |***variableid***|int(11)       |Nem  |               |AUTO_INCREMENT|
|F          |**nodeid**      |int(11)       |Nem  |               |              |
|U          |**symbol**      |varchar(32)   |Nem  |               |              |
|           |datatype        |varchar(32)   |Nem  |               |              |
|           |address         |varchar(32)   |Nem  |               |              |
|           |comment         |varchar(512)  |Igen |NULL           |              |
|           |readonly        |tinyint(1)    |Nem  |0              |              |

A csomópontokhoz (PLC-khez) tartozó változók táblája. Az felhasználók számára a név azonosítja a változót, a rendszer a sorszámot használja (a fenti előnyök így a változókra is vonatkoznak). A felhasználó pontosan így hivatkozhat a PLC változókra: **kliensNeve/csomópontNeve/valtozóNeve**. A következő adattípusokat implementáltam: *Bit, Int8, UInt8, Int16BE(S7), Int16LE, UInt16BE(S7), UInt16LE, Int32BE(S7), Int32LE, UInt32BE(S7), UInt32LE, FloatBE(S7), FloatLE*. Automatizálási berkekben ritka a 32 bitesnél nagyobb változóméret, ezért ilyeneket nem vezettem be.

#### RealtimeData:

|Tulajdonság |Oszlop           |Típus     |Nulla |Alapértelmezett    |
|:----------:|-----------------|----------|------|-------------------|
|P           | ***variableid***|int(11)   |Nem   |                   |
|            |data             |double    |Nem   |                   |
|            |time             |timestamp |Nem   |current_timestamp()|

\*Trigger: Logging AFTER UPDATE

Az adatgyűjtők által feltöltött változóértékeket a rendszer ebben a táblában helyezi el. Az adatgyűjtő a változónak csak a PLC címét és az adattípusát ismeri a *nodelist.json* állományból, mely ugyancsak távolról módosítható benne. A rendszer a **Variables** tábla adatai alapján azonosítja a változót. Ha a felhasználó redundánsan vette fel a változókat, akkor az azonos *node*-hoz tartozó, azonos című és adattípusú változók megkapják ugyan azt a feltöltött értéket. Ennek lehet racionalitása is: ha az egyik változó írható, a másik *readonly*. A feltöltés ideje is fontos, hiszen a *runtime* ebből tudja, hogy ha az adott változó már rég nem frissült (pl. a kapcsolat valamelyik lépcsője megszakadt). Ennél a rendszernél ez 20 másodperc. A rendszeren belül már nincsenek különböző adattípusok: minden tipus *double* típusban tárolódik. Ebben még a 32 bites egész értékek is pontosan szerepelnek. 

>**Ez nagyon fontos**, hiszen ha például hibaüzeneteket szeretnénk rendelni egy **INT32** mind a 32 bitjéhez, akkor a pontatlan ábrázolás miatt olyan hibaüzenetek is megjelenhetnek, (vagy éppen hogy nem) melyek nem valóságosak. A hibaüzenetek megbízhatósága tehát attól függene, hogy bitjeik közelebb vannak e az *MSB*-hez, vagy kisebb helyiértékűek. Ez természetesen megengedhetetlen.

A trigger arra szolgál, hogy a beérkező adatokat eltároljuk a **LastLoggedData** táblába. Erről a triggerről bővebben a **LastLoggedData** táblánál írok.

#### LoggedData:

|Tulajdonság|Oszlop          |Típus    |Nulla|Alapértelmezett    |
|:---------:|----------------|---------|-----|-------------------|
|[P F       |***variableid***|int(11)  |Nem  |                   |
|P]         |***time***      |timestamp|Nem  |current_timestamp()|
|           |data            |double   |Nem  |                   |

Ebbe a táblába kerülnek a naplózott változóadatok. Minden változó értéke 168 óra után törlődik.

#### LastLoggedData:

|Tulajdonság |Oszlop          |Típus     |Nulla|Alapértelmezett    |Extra                        |
|:----------:|----------------|----------|-----|-------------------|-----------------------------|
|P F         |***variableid***|int(11)   |Nem  |                   |                             |
|            |***time***      |timestamp |Nem  |current_timestamp()|ON UPDATE CURRENT_TIMESTAMP()|
|            |data            |double    |Nem  |                   |                             |

\*Trigger: SaveLog AFTER UPDATE

A naplózott adatok ide kerülnek először, majd a trigger másolja át őket a **LoggedData** táblába. A változók (a **Variables** triggere alapján) csak akkor kerülnek ebbe a táblába ha:

- az előző értékhez képest a változás nagyobb mint 10% *VAGY*
- a változás abszolút-értéke nagyobb-egyenlő mint 1 (INT értékek miatt) *VAGY*
- az előző naplózás több mint 60 másodperce történt.

Több 10.- vagy 100.000 rekord esetén ez a vizsgálat több másodpercet is igénybe vehet, ezért szerencsés ha van egy tábla amiben csak az előző mentett érték van, pláne ha az a memóriában tárolódik. A tábla ezért szükséges.

#### Pages:

|Tulajdonság |Oszlop      |Típus       |Nulla|Alapértelmezett|Extra         |
|:----------:|------------|------------|-----|---------------|--------------|
|P           |***pageid***|int(11)     |Nem  |               |AUTO_INCREMENT|
|U           |**name**    |varchar(32) |Nem  |               |              |
|            |comment     |varchar(512)|Igen |NULL           |              |
|            |data        |mediumtext  |Igen |NULL           |              |

Ebben a táblában tárolódnak a grafikus képernyők *HTML* kódjai. Fontos a megfelelő *escape*-elés.

#### PagesOfGroup:

|Tulajdonság |Oszlop          |Típus      |Nulla |Alapértelmezett|
|:----------:|----------------|-----------|------|---------------|
|[P F        | ***groupname***|varchar(64)|Nem   |               |
|P] F        | ***pageid***   |int(11)    |Nem   |               |

Ez a tábla (kapcsolótábla) rögzíti, hogy melyik csoport mely grafikus képernyőket tekintheti meg.

#### SystemPages

|Tulajdonság |Oszlop     |Típus      |Nulla|Alapértelmezett|
|:----------:|-----------|-----------|-----|---------------|
|P           | ***name***|varchar(64)|Nem  |               |
|            |enabled    |tinyint(1) |Nem  |1              |
|            |showInMenu |tinyint(1) |Nem  |1              |
|            |prettyName |varchar(64)|Igen |NULL           |
|            |icon       |varchar(64)|Igen |NULL           |
|            |template   |varchar(64)|Igen |NULL           |
|            |class      |varchar(64)|Nem  |               |
|            |basePage   |varchar(64)|Igen |NULL           |
|            |permission |int(11)    |Nem  |               |
|            |no         |int(11)    |Nem  |               |

A rendszer weboldalainak táblája. A **Controller** osztály ez alapján határozza meg a következőket:

- engedélyezve van-e az oldal
- megjelenhet-e a menüben
- mi lesz az oldal címe és a menüben megjelenő név
- menüben látható ikon
- van e sablonja és ha igen, akkor melyik
- mi az osztályneve a kiszolgáló Page kontrollernek
- van-e gyökérsablonja (***basePage***) és ha igen, akkor melyik
- milyen felhasználói szinten tekinthető meg az oldal
- sorrend a menüben

Ha a **p** *GET* változóban olyan név szerepel, ami a ***name*** oszlopban nem szerepel, akkor az oldal nem létezik, és átirányítás történik a 404-es oldalra. Ha a ***template*** és a ***basePage***
egyaránt *NULL* akkor a rendszernek nem kell *HTML*-el visszatérnie. Ilyenek a REST kiszolgálók és a kijelentkezés oldal (az csak átirányít, és elvégzi a kijelentkeztetést).

#### UserTokens

|Tulajdonság|Oszlop    |Típus      |Nulla|Alapértelmezett    |Extra         |
|-----------|----------|-----------|-----|-------------------|------------- |
|P          | ***id*** |int(11)    |Nem  |                   |AUTO_INCREMENT|
|F          | user     |varchar(32)|Nem  |                   |              |
|U          | **token**|varchar(36)|Nem  |uuid()             |              |
|           | time     |timestamp  |Nem  |current_timestamp()|              |
|           | lastvisit|timestamp  |Nem  |current_timestamp()|              |

Ez a tábla rögzíti a munkameneteket. A felhasználónak érvényes **token** sütivel kell rendelkeznie, hogy be lehessen jelentkezve a rendszerbe.

#### VariablesOfPages:

|Tulajdonság|Oszlop          |Típus  |Nulla |Alapértelmezett|
|-----------|----------------|-------|------|---------------|
|[P F       |***pageid***    |int(11)|Nem   |               |
|P] F       |***variableid***|int(11)|Nem   |               |

A grafikus képernyők mentésénél ebbe a kapcsolótáblába kerülnek a grafikus oldal által használt változók azonosítói. A nem mérnök csoporthoz tartozó felhasználók csak azokat a változókat érik el, amelyek olyan grafikus oldalhoz tartoznak, amiket csoportjuk megtekinthet. Így ha valaki az asszinkron lekérdezéseket tanulmányozva illetéktelen adatokhoz akar jutni: nem fog menni.

#### WriteToClient

|Tulajdonság|Oszlop    |Típus       |Nulla|Alapértelmezett|Extra         |
|-----------|----------|------------|-----|---------------|--------------|
|P          |***id***  |int(11)     |Nem  |               |AUTO_INCREMENT|
|F          |clientname|varchar(32) |Nem  |               |              |
|           |json      |mediumtext  |Nem  |               |              |

Az adatgyűjtőket kezelő weboldalon (**ClientsController**) a kliensbe "letöltendő" adatokat ebbe a táblába szúrja be a rendszer *JSON* formátumba. Ezek a PLC-k adatait, és a változókat tartalmazzák. Ha a grafikus oldalakon változóértéket írunk, akkor az írási parancs is ide kerül. Az a **ClientCommandRestController** példány, amihez egy adott adatgyűjtő kapcsolódik, 200ms-onként olvassa ezt a táblát és ha az adatgyűjtőnek szánt rekord jelenik meg a táblában, annak adatát azonnal leküldi a kliensnek, és a rekordot törli az adatbázisból. A kliens végrehajtja, majd visszacsatlakozik... Nyugalmi helyzetben a *HTTP* kapcsolatot elég 20 másodpercenként kiépíteni. A gyors szerver &rarr; kliens adatkapcsolatot így valósítja meg a rendszer. Egyetlen előnye a WebSocket vagy az MQTT szerveres (...) megoldáshoz képest, hogy bármelyik tárhelykiszolgálón működik.

---

### 2.4) Fontosabb kliensoldalon futó JavaScript funkciók

Ahogy a fenti ***PageController*** résznél már említettem, több olyan oldal is van, amely funkcionalitásának nagy részét a kliens oldali **JS** kódnak köszönheti. A **JS** állományokban található összes függvény felsorolása helyett inkább ismertetem, hogy milyen feladatokat valósít meg a kód.

- **editor.js**  
Feladata, hogy egy grafikus fejlesztőkörnyezetet biztosítson, a grafikus képernyők szerkesztéséhez. A grafikus képernyő objektumai a `<div id="editor"></div>` kereten belül helyezkednek el. Mentésre és későbbi betöltésre ennek az elemnek az *outerHTML*-je kerül az *innerHTML* helyett. Erre csak azért van szükség, mert a háttér színe a *div* elem *style* attribútumába kerül. Így lehetőséget biztosítunk a későbbi közös tulajdonságok elmentésére is. A grafikus objektumok előre definiáltak, ezek a következők:
    - entry
    - switch
    - button
    - lamp
    - text
    - textbox
    - picture
    - square
    - alarmwindow
    - alarmtext.  
![WUI Objektumok](wuiobjects.png)  
Az fenti ábrán megtekinthetjük a szóban-forgó grafikus objektumokat, a megadott sorrendben.  
    - További fontosabb feladatok felsorolása:
        - objektumok létrehozása
        - automatikus számozás
        - meglévő objektum tulajdonságainak módosítása (objektum specifikusan)
        - dinamikus tulajdonságok módosítása (PLC változó kapcsolat **/tag-kapcsolat/**, kifejezéskezelés, negálás, min-max, figyelmeztetési szintek, villogás engedélyezése...)
        - PLC változók kereshetősége, kiválasztása (asszinkron lekérdezéssel)
        - objektum kijelölése kattintásra
        - több objektum kijelölése két módon
        - kijelölt objektum(ok) mozgatása egér mozgatására
        - mozgatás a kurzormozgató billentyűkkel
        - raszterhez igazítás (ha be van kapcsolva)
        - kijelölt objektumok másolása a szerkesztő számára vagy a rendszer vágólapjára (egyedi *JSON* formátumba történő átalakítás)
        - beillesztés (mind a két esetben)
        - zoom kezelése
        - mentés a szerverre
        - exportálás
        - importálás
- **variable.js**  
PLC változók hozzáadása a csomópontokhoz, törlésük és módosításuk önmagában nem igényelne átfogóbb **JS** kód jelenlétet. A gyakorlati használat viszont szükségessé tette, hogy az alábbi funkciókat mégis a böngésző hajtsa végre:
    - több változó hozzáadása, törlése és módosítása mentés nélkül
    - automatikus számozás a változóneveknél
    - automatikus S7 PLC cím inkrementálás az adattípus méretének figyelembevételével  
(M0.7 &rarr; M1.0; MD10 &rarr; MD14; DB2.DBW6 &rarr; DB2.DBW8...)
    - előző tulajdonság örökítése az újonnan létrehozott változónak (pl.: readonly)
    - ütköző változónevek (szimbólumnév) kiszűrése.
    - a nem mentett változtatások típusának feljegyzése, a későbbi **SQL** műveletekhez (*DELETE, INSERT, UPDATE*)
    - létrehozott, majd mentés nélkül törölt változók kezelése
    - mentés nélkül törölt, majd azonos néven létrehozott változó mentése
    - exportálás (*CSV*)
    - importálás
- **view.js**  
Bizonyos értelemben az egész eddigi munka gyümölcse. Feladatai:
    - a `<div id="editor">...</div>` keret átvizsgálása, *tag* kapcsolattal rendelkező objektumok keresése
    - szükséges *tag*-ek (PLC változók) rendszerezése adatgyűjtő és csomópont szerint
    - beállítható frekvenciájú *tag* lista lekérdezés ütemezése, végrehajtása
    - lekérdezési redundancia kezelése
    - a visszaérkező adatok kezelése: a kapcsolattal rendelkező objektumok dinamizálása
        - szín
        - megjelenítés/elrejtés (figyelmeztetőszövegeknél is)
        - értékek frissítése az *entry*-kben
        - riasztási szint animáció
        - hangjelzés
    - beviteli mezők, kapcsolók, gombok írásánál asszinkron kérés a szerverhez
    - beviteli mező limitek kezelése
    - írási kérelmet követő extra lekérdezések ütemezése (a változás mielőbb látszódjon a felhasználó számára)
    - kommunikációs hibák kezelése
    - naplózott értékek megnyitása új ablakban
    - naplózott üzenetek (alarm text) megjelenítése (asszinkron adatnapló lekérdezése a szükséges változók esetében és ebből az üzenetek generálása: aktuálissá válás időpontja, megszűnés időpontja), ezek exportálási lehetősége.

A JavaScript kódok közvetlenül *JS* nyelven készültek. *Fejlesztési lehetőség:* a kódokat **TypeScript** nyelven implementálni, a megfelelő interfészek és egyéb nyelvi elemek használatával.

---

### 2.5) Adatgyűjtő kliens

A program kisebb terjedelme miatt az alábbi egyszerűsített függvényhívási fa segítségével mutatom be a terepi adatgyűjtő kliens *NodeJS* programját:

```
start.sh
└── WHILE(1)
    └── wuiclient.js $@
        │
        ├── fs.readFile (configFile)
        │   ├── serverComm
        │   │   ├── XMLHttpRequest.onload
        │   │   │   ├── commander
        │   │   │   │   ├── fs.writeFile (nodelist.json)
        │   │   │   │   │    └── process.exit //új node.json
        │   │   │   │   ├── writeTagInNode
        │   │   │   │   │    └── writeTagInS7Node
        │   │   │   │   │        ├── s7getReadWriteMultiVarsElement
        │   │   │   │   │        └── Nodes[i].WriteArea
        │   │   │   │   └── console.log (ismeretlen parancs)
        │   │   │   └── console.log (nincs új parancs)
        │   │   └── XMLHttpRequest.onerror
        │   │       └── serverComm (setTimeout)↺
        │   └── console.log (szerver url, token)
        │
        ├── fs.readFile (nodelist.json)
        │   ├── newSnap7node (for loop)
        │   │   └── Nodes[i].ConnectTo
        │   │       ├── snap7reConnect //komm. hiba esetén
        │   │       └── scanNodeMain
        │   │           └── s7scanNode
        │   │               └── setInterval ⥀
        │   │                   ├── Nodes[i].ReadMultiVars
        │   │                   ├── getValueFromBuffer
        │   │                   └── XMLHttpRequest (upload)
        │   └── console.log (nodeList sikeresen betöltve)
        │
        └── process.exit //hibás konfigurációs fájl
```

A program két külön logikai szálon fut: az egyik a szervertől érkező parancsok feldolgozásáért felel (részletesebb leírás: ***2.3.2/WriteToClient*** tábla), a másik a *nodelist.json* állomány leírása alapján a PLC-kből gyűjti az adatokat és tölti fel a szerverre.  
Az előbbi szál új *nodelist.json* érkezése esetén menti azt, és kilép a folyamatból. Az indító *shellscript* újraindítja a programot így az utóbbi szál már a frissített adatokból dolgozik.  
Ha változóírási parancs érkezik a szervertől, a folyamatot természetesen nem indítja
újra az első szál, hanem végrehajtja az írást.

A programstruktúra úgy épül fel, hogy könnyen implementálható bele új kommunikációs driver is(pl. **Modbus TCP**).


3) Használati esetek
--------------------

Bár a **2)** pontban a programrendszer használati lehetőségeiről már fel-fel bukkant pár releváns információ, de érdemes ennek is egy önálló pontot áldozni. A következőkben négy *use case* diagrammal mutatom be ezeket.

### 3.1) Bejelentkezés, munkamenet kezelés

![Bejelentkezési használati esetek](uc1.svg)

A fenti diagram a rendszerbe való belépés eseteit mutatja be. Ezen a szinten végeredményben 3 aktor különböztethető meg:

- Vendég
- Újonnan hozzáadott felhasználó (még nincs jelszava)
- Bejelentkezett felhasználó (ezen a ponton nincs jelentősége a felhasználói csoportnak, ezért van él a *Mérnök* és a *Felhasználó* között)

A 4. aktor az adatgyűjtő kliens. Mivel természetesen nem az embereknek fenntartott interfészt használja, hanem *REST API*-n keresztül kommunikál, ezért külön ábrán tárgyalom.

A *Vendég* felhasználó csak a főoldalt és a bejelentkező oldalt tekintheti meg. Az üres lejszóval bejelentkezett új felhasználó csak a főoldalt, a jelszóváltoztató oldalt, de ki is jelentkezhet. A bejelentkezett, szabályos jelszóval rendelkező *felhasználók* hozzáférnek a jelszó megváltoztatás lehetőségéhez, a főoldalhoz és a kijelentkezéshez, ők viszont természetesen további hozzáféréssel is rendelkeznek, melyet a következő diagramon láthatunk.

### 3.2) Általános rendszerfelhasználó lehetőségei

![Felhasználó használati esetek](uc2.svg)

Még a fenti ábrán sem jelenik meg a *Mérnök csoport*nak többletjogosultsága, ez majd a harmadik diagramon fog szerepelni.
Itt azt láthatjuk, hogy a felhasználó eléri a ***WUI Screens*** weboldalt, és azon a csoportjának engedélyezett grafikus oldalak listáját láthatja. Ha kiválaszt egyet, akkor annak grafikus felületét kezelheti (értékeket olvashat, alapjeleket írhat át, elindíthat egy szivattyút...). Konkréten azokat a funkciókat veheti igénybe, melyeket a grafikus oldal szerkesztője (mérnök csoport tagja) lehetővé tett a számára. Ha az oldalon szerepel bármilyen PLC változóadat, akkor annak a naplózott értékeit is böngészheti (168 óraára visszamenőleg), valamint ki is exportálhatja azokat *CSV* formátumba. Ha az oldalon elhelyeztek üzenet ablakot, akkor az aktuális és a naplózott értékeket is elolvashatja, valamint a naplózott üzeneteket exportálhatja is.

>A **view.js** állománynál már utaltam rá, hogy a hibaüzenetek valójában nem kerülnek tárolásra. Vétek is lenne: mivel minden változó releváns változása naplózásra kerül, valamint az üzenet megjelenítéséhez szükséges egyenlet ugyancsak a futtatókörnyezet rendelkezésére áll, az üzenet szövege, a színe is, ezért ezekből a **JS** szkript visszamenőleg legenerálja az üzenetek múltbéli állapotait: Kész a hiba- (figyelmeztetés, üzenet) -napló.

---

### 3.3) Mérnök csoport tagjainak használati lehetőségei

![Mérnök használati esetek](uc3.svg)

A fenti ábrán láthatjuk, hogy a *mérnök* csoport a összes lehetséges rendszer-adminisztrációs funkcióhoz hozzáfér, beleértve a felhasználók kezelését és a tervezési feladatokat. Az ábrán nincs jelezve, de az **engineer** felhasználó annyi előnyt élvez az **engineer csoport** tagjaihoz képest, hogy jogai nem vonhatók meg, és nem törölhető. (Valamint - bár ez már erősen ízlés dolga és megnyithatja a vitát az italfogyasztók egyes táborai és az absztinensek között - kap egy "korsó sör" ikont a fejlécbe.)

---

### 3.4) Adatgyűjtő kliensek használati lehetőségei

![Adatgyűjtő használati esetek](uc4.svg)

A fenti két használati esetet részletesen tárgyaltam a ***2.2.3/CONTROLLER/ClientCommandRestController*** osztálynál és a ***2.3.2/WriteToClient*** adatbázistábla leírásánál. Az adatgyűjtő kliens ezekkel rendelkezik. A hozzáférési token *GET* metódussal juttatja el a szerver felé az adatgyűjtő, minden hozzáférési kísérletnél.


4) Továbbfejlesztési, optimalizálási lehetőségek
------------------------------------------------


A dokumentációban több helyen is említettem, hogy mely programrészeket milyen funkciókkal lehetne kiegészíteni, mit lehetne jobban, optimálisabban megoldani. Az alábbi felsorolásban összegzem és részletezem ezeket a gondolatokat, a teljesség igénye nélkül:

- Minden **JavaScript** nyelven készített kódot **TypeScript** nyelven újraírni, kihasználva minden lehetőségét.
- A **Model** osztályt több logikai egységre kéne bontani, mert a mérete nehezen olvashatóvá teszi.
- Minden, a rendszer telepítésekor - változtatásakor szükséges beállítóértéket következetesen a **$cfg** globális hash-be kell mozgatni. Jelenleg a **View** és **Database** osztályok sok statikus változót tartalmaznak ezeknek az értékeknek a tárolására.
- A felhasználók és a felhasználói csoportok *neve* mellett létre kell hozni ezek **azonosító**ját (ID), elsődleges kulcsként ezeket kell használni, hogy a nevek megváltoztatása lehetségessé váljon, mint a kliensek, csomópontok és a változók esetében.
- A jogosultsági szintek kibővítése azzal, hogy lehessen egyes csoportoknak szerkesztési jogot adni a kívánt grafikus képernyőkhöz, és emellett megtekintési jogot is lehessen szelektíven definiálni. Jelenleg szerkeszteni *csak* a **mérnök** csoport tud, *minden* grafikus oldalt egyaránt, és mindegyiket megtekintheti. Így több megrendelőt is ki tudna szolgálni *egy* rendszer, beleértve a saját alrendszerük feletti teljes körű adminisztrációs lehetőségüket.
- Jelenleg a **PLC** (csomópont) változók naplózása automatikusan történik: nincs konfigurálási lehetőség, egyetemesen minden olyan változó naplózásra kerül 168 órára, amelyik szerepel valamelyik grafikus oldalon. Valamint a naplózás periódusideje, és a rendkívüli naplózás logikája minden ilyen változó esetében azonos. Naplózási csoportokat kell létrehozni, melyekhez bármely változót hozzá lehet rendelni, és csoportonként állíthatóvá kell tenni a naplózás időközt - logikát.
- A hibaüzenetek, riasztási szintek kezelését a *backendnek*-nek kéne kiszervezni. Így a rendszer képes lenne figyelmeztető emaileket küldeni. Ezzel kapcsolatosan: alarmgroup-ok létrehozása (kinek kell küldeni). Jelenleg ezek a funkciók csak megnyitott *runtime* mellett működnek. 
- ~~A grafikus szerkesztőnél, több objektum kiválasztása esetén a közös tulajdonságokat lehessen csoportosan változtatni (pl.: betűszín). Jelenleg ezt csak egyes kijelölésnél lehet megtenni, a többszörös kijelölés csak pozíciómódosításra és másolási műveletre használható.~~
- A már többször említett **Modbus TCP** (az ipari által használt kommunikációs protokollok "igáslovának") implementálása. Ehhez csak az adatgyűjtő kliens programját kell kiegészíteni, és a *Client Connections* **Driver** kiválasztásához használt `<select>`-jéhez egy új `<option>`-t kell hozzáadni.
- Grafikus objektumok újragondolása: jelenleg egy beviteli mező (***entry***) mind a szerkesztőben, mind a megjelenítőben egyaránt egy `<input type="text" />` elem, pedig beírás sosem történik benne (élő beírásnál egy párbeszédablak ugrik fel, az értéket ott kell megadni, az entry csak a visszaolvasott értéket jeleníti meg). A nem záródó tag-ek nem rendelkeznek például `::before` és `::after` pszeudoelemmel, ezért hátrányt jelentenek: az adatnaplók megjelenítéséhez használt felugró gombot is ezért kellett JavaScript-el megoldani *CSS* helyett.

5) Köszönetnyilvánítás
----------------------

Köszönettel tartozom jelenlegi munkahelyemnek, hogy inspirációt adott a projekthez. Sok ipari rendszert ismerhettem meg az elmúlt 10 évben, és találkozhattam a különböző iparban használatos megjelenítő-rendszerek fejlesztési és felhasználói elvárásaival.
Örömet okozott minden óra, amit a programrendszer fejlesztésével tölthettem. Tanulságos volt azokra a problémákra saját megoldást találni, amik az általam használt rendszerek fejlesztőinek is okozhattak pár álmatlan éjszakát.

A webfejlesztés és a gyártóipar közötti távolság egyre csökken napjainkban. Szeretném azt hinni, hogy ez a projekt is picit hozzájárul ezen határok lebontásához.
