-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: localhost
-- Létrehozás ideje: 2025. Ápr 01. 18:26
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `wui`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `Clients`
--

CREATE TABLE `Clients` (
  `clientid` int(11) NOT NULL COMMENT 'Csatlakozó eszköz azonosítója',
  `clientname` varchar(32) NOT NULL COMMENT 'Csatlakozó eszköz neve',
  `token` varchar(256) NOT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='A kliensek hozzáférési token-jei.';

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `Groups`
--

CREATE TABLE `Groups` (
  `groupname` varchar(64) NOT NULL COMMENT 'Csoportnév'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Csoportok.';

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `LastLoggedData`
--

CREATE TABLE `LastLoggedData` (
  `variableid` int(11) NOT NULL,
  `data` double NOT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Eseményindítók `LastLoggedData`
--
DELIMITER $$
CREATE TRIGGER `SaveLog` AFTER UPDATE ON `LastLoggedData` FOR EACH ROW INSERT INTO `LoggedData`
(`data`, `time`, `variableid`)
VALUES
(NEW.`data`, NEW.`time`, NEW.`variableid`)
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `LoggedData`
--

CREATE TABLE `LoggedData` (
  `variableid` int(11) NOT NULL,
  `data` double NOT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `Nodes`
--

CREATE TABLE `Nodes` (
  `clientid` int(11) NOT NULL COMMENT 'Csatlakozó eszköz azonosítója',
  `nodeid` int(11) NOT NULL COMMENT 'PLC azonosítója',
  `nodename` varchar(32) NOT NULL COMMENT 'PLC neve',
  `ip` varchar(32) NOT NULL COMMENT 'PLC IP címe',
  `driver` varchar(32) NOT NULL COMMENT 'Kommunikáció fajtája',
  `scantime` int(11) NOT NULL DEFAULT 1000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='A kliensekhez tartozó PLC-k és scan periódusok.';

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `Pages`
--

CREATE TABLE `Pages` (
  `pageid` int(11) NOT NULL COMMENT 'Oldal azonosítója',
  `name` varchar(32) NOT NULL COMMENT 'Weboldal neve',
  `comment` varchar(512) DEFAULT NULL COMMENT 'Komment az oldalhoz',
  `data` mediumtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Megjeleníthető, szerkeszthető web felhasználói felületek.';

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `PagesOfGroup`
--

CREATE TABLE `PagesOfGroup` (
  `groupname` varchar(64) NOT NULL COMMENT 'Csoportnév',
  `pageid` int(11) NOT NULL COMMENT 'Megtekinthető oldal azonosítója'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Csoport-oldal kapcsolótábla';

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `RealtimeData`
--

CREATE TABLE `RealtimeData` (
  `variableid` int(11) NOT NULL,
  `data` double NOT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Eseményindítók `RealtimeData`
--
DELIMITER $$
CREATE TRIGGER `Logging` AFTER UPDATE ON `RealtimeData` FOR EACH ROW BEGIN
    SELECT COUNT(`VariablesOfPages`.`variableid`) INTO @loggingEnabled
    FROM `VariablesOfPages`
    WHERE `VariablesOfPages`.`variableid` = NEW.variableid;
    SELECT `LastLoggedData`.`data`, `LastLoggedData`.`time` INTO @lastData, @lastTime
    FROM `LastLoggedData`
    WHERE `LastLoggedData`.`variableid` = NEW.variableid
    ORDER BY `time` DESC LIMIT 1;
    IF @loggingEnabled > 0 AND ((ABS((NEW.`data` - @lastData)/NEW.`data`) > 0.1)
      OR (ABS(NEW.`data` - @lastData) >= 1)
      OR (@lastTime IS NULL)
      OR ((UNIX_TIMESTAMP(NEW.time) >= UNIX_TIMESTAMP(@lastTime) + 60) AND NEW.`data` <> @lastData)
      OR ((UNIX_TIMESTAMP(NEW.time) >= UNIX_TIMESTAMP(@lastTime) + 600)))
      THEN
      INSERT INTO `LastLoggedData` (`data`, `variableid`, `time`)
      VALUES (NEW.data, NEW.variableid, NEW.time)
       ON DUPLICATE KEY UPDATE
       `LastLoggedData`.`data` = NEW.`data`,
       `LastLoggedData`.`time` = NEW.`time`;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `SystemPages`
--

CREATE TABLE `SystemPages` (
  `name` varchar(64) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `showInMenu` tinyint(1) NOT NULL DEFAULT 1,
  `prettyName` varchar(64) DEFAULT NULL,
  `icon` varchar(64) DEFAULT NULL,
  `template` varchar(64) DEFAULT NULL,
  `class` varchar(64) NOT NULL,
  `basePage` varchar(64) DEFAULT NULL,
  `permission` int(11) NOT NULL,
  `no` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- A tábla adatainak kiíratása `SystemPages`
--

INSERT INTO `SystemPages` (`name`, `enabled`, `showInMenu`, `prettyName`, `icon`, `template`, `class`, `basePage`, `permission`, `no`) VALUES
('clientcommandrest', 1, 0, 'ClientCommandRest', NULL, NULL, 'ClientCommandRestController', NULL, 0, 14),
('clients', 1, 1, 'Client Connentions', 'client.svg', 'clients.html', 'ClientsController', 'index.html', 20, 5),
('clientuploadrest', 1, 0, 'ClientUploadRest', NULL, NULL, 'ClientUploadRestController', NULL, 0, 13),
('editor', 1, 0, 'WUI Screen Editor', NULL, 'editor.html', 'EditorController', NULL, 20, 15),
('forbidden', 1, 1, NULL, NULL, 'forbidden.html', 'ForbiddenController', 'index.html', 0, 4),
('index', 1, 1, 'Main', 'main.svg', 'main.html', 'IndexController', 'index.html', 0, 1),
('loggeddata', 1, 0, 'Logged Variable Data', NULL, 'loggeddata.html', 'LoggedDataController', 'index.html', 10, 17),
('login', 1, 1, 'Login', 'login.svg', 'login.html', 'LoginController', 'index.html', 0, 10),
('logout', 1, 1, 'Logout', 'logout.svg', NULL, 'LogoutController', NULL, 0, 11),
('notFound', 1, 1, NULL, NULL, '404.html', 'NotFoundController', 'index.html', 0, 3),
('screenman', 1, 1, 'Screen manager', 'screen.svg', 'screenman.html', 'ScreenmanController', 'index.html', 20, 7),
('screens', 1, 1, 'WUI Screens', 'screen.svg', 'screens.html', 'ScreensController', 'index.html', 10, 9),
('settings', 1, 1, 'User Settings', 'settings.svg', 'settings.html', 'SettingsController', 'index.html', 5, 8),
('useradmin', 1, 1, 'Users & Groups', 'group.svg', 'useradmin.html', 'UseradminController', 'index.html', 20, 2),
('variables', 1, 1, 'Variable Table', 'list.svg', 'variables.html', 'VariablesController', 'index.html', 20, 6),
('view', 1, 0, 'WUI Screen Viewer', NULL, 'view.html', 'ViewController', NULL, 10, 16),
('viewrest', 1, 0, 'ViewRest', NULL, NULL, 'ViewRestController', NULL, 10, 12);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `Users`
--

CREATE TABLE `Users` (
  `user` varchar(32) NOT NULL COMMENT 'Felhasználónév',
  `password` varchar(64) NOT NULL COMMENT 'Jelszó',
  `groupname` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Felhasználói adatok.';

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `UserTokens`
--

CREATE TABLE `UserTokens` (
  `id` int(11) NOT NULL,
  `user` varchar(32) NOT NULL COMMENT 'Felhasználónév',
  `token` varchar(36) NOT NULL DEFAULT uuid(),
  `time` timestamp NOT NULL DEFAULT current_timestamp(),
  `lastvisit` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Felhasználói token cookie-k.';

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `Variables`
--

CREATE TABLE `Variables` (
  `variableid` int(11) NOT NULL,
  `nodeid` int(11) NOT NULL,
  `symbol` varchar(32) NOT NULL,
  `datatype` varchar(32) NOT NULL,
  `address` varchar(32) NOT NULL,
  `comment` varchar(512) DEFAULT NULL,
  `readonly` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Az összes változó a rendszerben';

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `VariablesOfPages`
--

CREATE TABLE `VariablesOfPages` (
  `pageid` int(11) NOT NULL,
  `variableid` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `WriteToClient`
--

CREATE TABLE `WriteToClient` (
  `id` int(11) NOT NULL,
  `clientname` varchar(32) NOT NULL COMMENT 'Csatlakozó eszköz',
  `json` mediumtext NOT NULL COMMENT 'Leküldendő JSON adat'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Ide kerülnek a node-okba írandó értékek.';

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `Clients`
--
ALTER TABLE `Clients`
  ADD PRIMARY KEY (`clientid`),
  ADD UNIQUE KEY `clientname` (`clientname`),
  ADD UNIQUE KEY `token` (`token`);

--
-- A tábla indexei `Groups`
--
ALTER TABLE `Groups`
  ADD PRIMARY KEY (`groupname`);

--
-- A tábla indexei `LastLoggedData`
--
ALTER TABLE `LastLoggedData`
  ADD PRIMARY KEY (`variableid`);

--
-- A tábla indexei `LoggedData`
--
ALTER TABLE `LoggedData`
  ADD PRIMARY KEY (`variableid`,`time`);

--
-- A tábla indexei `Nodes`
--
ALTER TABLE `Nodes`
  ADD PRIMARY KEY (`nodeid`),
  ADD UNIQUE KEY `clientid` (`clientid`,`nodename`);

--
-- A tábla indexei `Pages`
--
ALTER TABLE `Pages`
  ADD PRIMARY KEY (`pageid`),
  ADD UNIQUE KEY `name` (`name`);

--
-- A tábla indexei `PagesOfGroup`
--
ALTER TABLE `PagesOfGroup`
  ADD PRIMARY KEY (`groupname`,`pageid`),
  ADD KEY `fk_page` (`pageid`);

--
-- A tábla indexei `RealtimeData`
--
ALTER TABLE `RealtimeData`
  ADD PRIMARY KEY (`variableid`);

--
-- A tábla indexei `SystemPages`
--
ALTER TABLE `SystemPages`
  ADD PRIMARY KEY (`name`);

--
-- A tábla indexei `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`user`),
  ADD KEY `fk_group_user` (`groupname`);

--
-- A tábla indexei `UserTokens`
--
ALTER TABLE `UserTokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `fk_uset_token` (`user`);

--
-- A tábla indexei `Variables`
--
ALTER TABLE `Variables`
  ADD PRIMARY KEY (`variableid`),
  ADD UNIQUE KEY `egyedi` (`nodeid`,`symbol`);

--
-- A tábla indexei `VariablesOfPages`
--
ALTER TABLE `VariablesOfPages`
  ADD PRIMARY KEY (`pageid`,`variableid`),
  ADD KEY `variableid` (`variableid`);

--
-- A tábla indexei `WriteToClient`
--
ALTER TABLE `WriteToClient`
  ADD PRIMARY KEY (`id`),
  ADD KEY `clientname` (`clientname`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `Clients`
--
ALTER TABLE `Clients`
  MODIFY `clientid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Csatlakozó eszköz azonosítója';

--
-- AUTO_INCREMENT a táblához `Nodes`
--
ALTER TABLE `Nodes`
  MODIFY `nodeid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'PLC azonosítója';

--
-- AUTO_INCREMENT a táblához `Pages`
--
ALTER TABLE `Pages`
  MODIFY `pageid` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Oldal azonosítója';

--
-- AUTO_INCREMENT a táblához `UserTokens`
--
ALTER TABLE `UserTokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `Variables`
--
ALTER TABLE `Variables`
  MODIFY `variableid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `WriteToClient`
--
ALTER TABLE `WriteToClient`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `LoggedData`
--
ALTER TABLE `LoggedData`
  ADD CONSTRAINT `LoggedData_ibfk_1` FOREIGN KEY (`variableid`) REFERENCES `Variables` (`variableid`);

--
-- Megkötések a táblához `Nodes`
--
ALTER TABLE `Nodes`
  ADD CONSTRAINT `fk_clientid` FOREIGN KEY (`clientid`) REFERENCES `Clients` (`clientid`);

--
-- Megkötések a táblához `PagesOfGroup`
--
ALTER TABLE `PagesOfGroup`
  ADD CONSTRAINT `fk_group` FOREIGN KEY (`groupname`) REFERENCES `Groups` (`groupname`),
  ADD CONSTRAINT `fk_page` FOREIGN KEY (`pageid`) REFERENCES `Pages` (`pageid`);

--
-- Megkötések a táblához `Users`
--
ALTER TABLE `Users`
  ADD CONSTRAINT `fk_group_user` FOREIGN KEY (`groupname`) REFERENCES `Groups` (`groupname`);

--
-- Megkötések a táblához `UserTokens`
--
ALTER TABLE `UserTokens`
  ADD CONSTRAINT `fk_uset_token` FOREIGN KEY (`user`) REFERENCES `Users` (`user`);

--
-- Megkötések a táblához `Variables`
--
ALTER TABLE `Variables`
  ADD CONSTRAINT `fk_nodeid` FOREIGN KEY (`nodeid`) REFERENCES `Nodes` (`nodeid`);

--
-- Megkötések a táblához `VariablesOfPages`
--
ALTER TABLE `VariablesOfPages`
  ADD CONSTRAINT `VariablesOfPages_ibfk_1` FOREIGN KEY (`pageid`) REFERENCES `Pages` (`pageid`),
  ADD CONSTRAINT `VariablesOfPages_ibfk_2` FOREIGN KEY (`variableid`) REFERENCES `Variables` (`variableid`);

--
-- Megkötések a táblához `WriteToClient`
--
ALTER TABLE `WriteToClient`
  ADD CONSTRAINT `WriteToClient_ibfk_1` FOREIGN KEY (`clientname`) REFERENCES `Clients` (`clientname`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
