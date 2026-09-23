<?php

$cfg = [];
$cfg["flagSign"] = "§";
$cfg["flagPattern"] = "/{$cfg["flagSign"]}([A-Z][A-Z0-9]*){$cfg["flagSign"]}/";
$cfg["defaultPage"] = "index";
$cfg["headerTemplateFile"] = "header.html";
$cfg["footerTemplateFile"] = "footer.html";
$cfg["pageContentFlag"] = "CONTENT";
$cfg["pageHeaderFlag"] = "HEADER";
$cfg["pageFooterFlag"] = "FOOTER";
$cfg["pageMenuFlag"] = "MENU";
$cfg["pageTitleFlag"] = "TITLE";
$cfg["sessionAuthKey"] = "auth";
$cfg["maxSessionTime"] = 3600*24*365;
$cfg["symbolPath"] = "symbols";
$cfg["contentFolder"] = "content";
