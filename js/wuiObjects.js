// @ts-check
/*
 * Web based User Interface (WUI)
 * Copyright (c) 2026 Dávid Róbert Kovács
 * Licensed under the MIT License.
 */
const wuiObjects = {
  regularObject: {
    position: {
      name: "Pozíció",
      x: { name: "X:" },
      y: { name: "Y:" },
      z: { name: "Réteg:" }
    },
    dimensions: {
      name: "Méretek"
    },
    tagConnection: {
      name: "Tag kapcsolat"
    }
  },

  hasRotate: {
    rotate: { name: "Forgatás:" }
  },

  hasSize: {
    size: { name: "Méret:" }
  },
  hasOnlyHeight: {
    onlyHeight: { name: "Méret:" }
  },
  hasAutoFont: {
    autoFont: true
  },
  hasHeight: {
    height: { name: "Magasság:" }
  },
  hasWidth: {
    width: { name: "Szélesség:" }
  },
  hasMinWidth: {
    minWidth: { name: "Min. szélesség:" }
  },
  hasFontSize: {
    fontSize: { name: "Betűméret:" }
  },
  hasRate: {
    rate: { name: "Arány X [%]:" }
  },

  colors: {
    name: "Színek",
  },
  hasFontColor: {
    fontColor: { name: "Betűszín:" }
  },
  hasBgColor: {
    bgColor: { name: "Háttérszín:" }
  },
  hasStateColors: {
    onColor: { name: "Bekapcsolt szín:" },
    offColor: { name: "Kikapcsolt szín:" }
  },

  special: {
    name: "Speciális"
  },
  hasFontWeight: {
    fontWeight: { name: "Szövegvastagság:" }
  },
  hasDecimals: {
    decimals: { name: "Tizedesek száma:" }
  },
  hasZeros: {
    zeros: { name: "Min. helyiértékek:" }
  },
  hasUnit: {
    unit: { name: "Mértékegység:" }
  },
  hasBorderRadius: {
    borderRadius: { name: "Sarok rádiusz:" }
  },
  hasBlink: {
    blink: { name: "Villogjon:" }
  },
  hasScript: {
    script: { name: "JS kód kattintásra:" }
  },

  hasSetValue: {
    setValue: { name: "Beíró érték:" }
  },
  hasExpressionForValue: {
    expressionForValue: { name: "Értékmanipuláció<br>Jelölje x-el a változót:" }
  },
  hasExpression: {
    expression: { name: "Láthatósághoz<br>Jelölje x-el a változót:" }
  },
  hasNeg: {
    neg: { name: "Negálás:" }
  },

  simpleText: {
    name: "Szöveg"
  },
  multilineText: {
    name: "Szöveg"
  },
  headerText: {
    name: "Szöveg"
  },

  get entry() {
    let obj = structuredClone(this.regularObject);
    obj.dimensions = Object.assign(obj.dimensions, this.hasWidth, this.hasHeight, this.hasFontSize);
    obj.special = Object.assign(structuredClone(this.special), this.hasBorderRadius, this.hasFontWeight, this.hasDecimals, this.hasZeros, this.hasUnit);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasFontColor, this.hasBgColor);
    Object.assign(obj.tagConnection, this.hasExpressionForValue);
    obj.writeable = {};
    obj.warningLevels = {};
    return obj;
  },
  get entryButton() {
    let obj = structuredClone(this.regularObject);
    obj.dimensions = Object.assign(obj.dimensions, this.hasMinWidth, this.hasHeight, this.hasFontSize);
    obj.special = Object.assign(structuredClone(this.special), this.hasFontWeight);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasFontColor, this.hasBgColor);
    obj.simpleText = structuredClone(this.simpleText);
    obj.writeable = {};
    return obj;
  },
  get switch() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.dimensions, this.hasOnlyHeight);
    return obj;
  },
  get button() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.dimensions, this.hasMinWidth, this.hasHeight, this.hasFontSize);
    obj.special = Object.assign(structuredClone(this.special), this.hasFontWeight);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasFontColor, this.hasBgColor);
    obj.simpleText = structuredClone(this.simpleText);
    Object.assign(obj.tagConnection, this.hasSetValue);
    return obj;
  },
  get jsButton() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.dimensions, this.hasMinWidth, this.hasHeight, this.hasFontSize);
    obj.special = Object.assign(structuredClone(this.special), this.hasFontWeight, this.hasScript);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasFontColor, this.hasBgColor);
    obj.simpleText = structuredClone(this.simpleText);
    obj.tagConnection = undefined;
    return obj;
  },
  get lamp() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.dimensions, this.hasSize, this.hasAutoFont);
    obj.special = Object.assign(structuredClone(this.special), this.hasBlink);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasStateColors);
    return obj;
  },
  get text() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.position, this.hasRotate);
    Object.assign(obj.dimensions, this.hasOnlyHeight, this.hasAutoFont);
    obj.special = Object.assign(structuredClone(this.special), this.hasFontWeight, this.hasBlink);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasFontColor);
    obj.simpleText = structuredClone(this.simpleText);
    Object.assign(obj.tagConnection, this.hasExpression, this.hasNeg);
    return obj;
  },
  get textbox() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.position, this.hasRotate);
    Object.assign(obj.dimensions, this.hasFontSize);
    obj.special = Object.assign(structuredClone(this.special), this.hasFontWeight, this.hasBlink);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasFontColor, this.hasBgColor);
    obj.multilineText = structuredClone(this.multilineText);
    Object.assign(obj.tagConnection, this.hasExpression, this.hasNeg);
    return obj;
  },
  get picture() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.position, this.hasRotate);
    Object.assign(obj.dimensions, this.hasOnlyHeight, this.hasRate);
    obj.special = Object.assign(structuredClone(this.special), this.hasBlink);
    Object.assign(obj.tagConnection, this.hasExpression, this.hasNeg);
    return obj;
  },
  get square() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.position, this.hasRotate);
    Object.assign(obj.dimensions, this.hasWidth, this.hasHeight);
    obj.special = Object.assign(structuredClone(this.special), this.hasBorderRadius, this.hasBlink);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasBgColor);
    Object.assign(obj.tagConnection, this.hasExpression, this.hasNeg);
    return obj;
  },
  get bar() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.position, this.hasRotate);
    obj.dimensions = Object.assign(obj.dimensions, this.hasWidth, this.hasHeight);
    obj.special = Object.assign(structuredClone(this.special), this.hasBorderRadius);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasBgColor);
    Object.assign(obj.tagConnection, this.hasExpressionForValue);
    return obj;
  },
  get alarmwindow() {
    let obj = structuredClone(this.regularObject);
    Object.assign(obj.dimensions, this.hasWidth, this.hasHeight);
    obj.colors = Object.assign(structuredClone(this.colors), this.hasBgColor, this.hasFontColor);
    obj.headerText = structuredClone(this.headerText);
    obj.addText = { name: "Üzenetek" };
    obj.tagConnection = undefined;
    return obj;
  },
  get alarmtext() {
    let obj = {};
    obj.colors = Object.assign(structuredClone(this.colors), this.hasFontColor, this.hasBgColor);
    obj.simpleText = Object.assign(structuredClone(this.simpleText), { subElement: true });
    obj.tagConnection = Object.assign(structuredClone(this.regularObject.tagConnection), this.hasExpression, this.hasNeg);
    obj.alarmText = { name: "Üzenetszöveg" };
    return obj;
  }
};

function AddEntry() {
  const newEntry = document.createElement("INPUT");
  newEntry.setAttribute("type", "text");
  newEntry.setAttribute("id", "obj_" + GetNewId());
  newEntry.setAttribute("value", "######.###");
  newEntry.setAttribute("readonly", "readonly");
  newEntry.dataset.tagConnection = "";
  newEntry.dataset.writeable = "false";
  newEntry.dataset.objType = "entry";
  newEntry.dataset.dec = '3';
  newEntry.dataset.zeros = '0';
  newEntry.dataset.unit = '';
  newEntry.dataset.min = "0";
  newEntry.dataset.max = "32767";
  newEntry.dataset.expressionForValue = "x";
  newEntry.style.position = "absolute";
  newEntry.style.color = "#000000";
  newEntry.style.backgroundColor = "#ffffff";
  newEntry.style.borderRadius = "3px";
  newEntry.style.top = GetNewElementPos().y;
  newEntry.style.left = GetNewElementPos().x;
  newEntry.style.height = "30px";
  newEntry.style.width = "132px";
  newEntry.style.boxSizing = "border-box";
  newEntry.style.borderWidth = "2px";
  newEntry.style.fontFamily = "FiraCode";
  newEntry.style.zIndex = "10";
  newEntry.style.fontWeight = "400";
  newEntry.style.textAlign = "right";
  newEntry.style.fontSize = Math.trunc(parseInt(newEntry.style.height) * 0.65) + "px";
  var editor = ID("editor");
  editor.appendChild(newEntry);
  UpdateSelectOtions();
  SelectMe(newEntry.id);
  DocumentChanged();
}

function AddMinimalEntry() {
  const newEntry = document.createElement("INPUT");
  newEntry.setAttribute("type", "text");
  newEntry.setAttribute("id", "obj_" + GetNewId());
  newEntry.setAttribute("value", "######.###");
  newEntry.setAttribute("readonly", "readonly");
  newEntry.dataset.tagConnection = "";
  newEntry.dataset.writeable = "false";
  newEntry.dataset.objType = "entry";
  newEntry.dataset.dec = '3';
  newEntry.dataset.zeros = '0';
  newEntry.dataset.unit = '';
  newEntry.dataset.min = "0";
  newEntry.dataset.max = "32767";
  newEntry.dataset.expressionForValue = "x";
  newEntry.style.position = "absolute";
  newEntry.style.color = "#000000";
  newEntry.style.backgroundColor = "#ffffff";
  newEntry.style.borderRadius = "0px";
  newEntry.style.top = GetNewElementPos().y;
  newEntry.style.left = GetNewElementPos().x;
  newEntry.style.height = "30px";
  newEntry.style.width = "132px";
  newEntry.style.boxSizing = "border-box";
  newEntry.style.borderWidth = "0px";
  newEntry.style.borderStyle = 'none';
  newEntry.style.fontFamily = "FiraCode";
  newEntry.style.zIndex = "10";
  newEntry.style.fontWeight = "400";
  newEntry.style.textAlign = "right";
  newEntry.style.fontSize = Math.trunc(parseInt(newEntry.style.height) * 0.65) + "px";
  var editor = ID("editor");
  editor.appendChild(newEntry);
  UpdateSelectOtions();
  SelectMe(newEntry.id);
  DocumentChanged();
}

function AddBar() {
  const nawBar = document.createElement("div");
  nawBar.setAttribute("id", "obj_" + GetNewId());
  nawBar.dataset.objType = "bar";
  nawBar.dataset.tagConnection = "";
  nawBar.dataset.expressionForValue = "x";
  nawBar.dataset.barColor = "#00FF00";
  nawBar.style.backgroundColor = "#00FF00";
  nawBar.style.position = "absolute";
  nawBar.style.top = GetNewElementPos().y;
  nawBar.style.left = GetNewElementPos().x;
  nawBar.style.height = "200px";
  nawBar.style.width = "100px";
  nawBar.style.rotate = "0deg";
  nawBar.style.borderRadius = "3px";
  nawBar.style.boxSizing = "border-box";
  nawBar.style.borderWidth = "0 0 2px 0";
  nawBar.style.borderStyle = "solid";
  nawBar.style.borderColor = "rgba(0, 0, 0, 1)";
  nawBar.style.zIndex = "10";
  var editor = ID("editor");
  editor.appendChild(nawBar);
  UpdateSelectOtions();
  SelectMe(nawBar.id);
  DocumentChanged();
}

function AddEntryButton() {
  const newButton = document.createElement("BUTTON");
  newButton.setAttribute("type", "button");
  newButton.setAttribute("id", "obj_" + GetNewId());
  newButton.setAttribute("value", "1");
  newButton.dataset.tagConnection = "";
  newButton.dataset.objType = "entryButton";
  newButton.dataset.min = "0";
  newButton.dataset.max = "32767";
  newButton.dataset.writeable = "true";
  newButton.style.position = "absolute";
  newButton.style.color = "#000000";
  newButton.style.backgroundColor = "#cccccc";
  newButton.style.borderRadius = "0.2rem";
  newButton.style.top = GetNewElementPos().y;
  newButton.style.left = GetNewElementPos().x;
  newButton.style.height = "30px";
  newButton.style.width = null;
  newButton.style.minWidth = "100px";
  newButton.style.boxSizing = "border-box";
  newButton.style.borderWidth = "2px";
  newButton.style.fontFamily = "FiraCode";
  newButton.style.zIndex = "10";
  newButton.style.boxShadow = "2px 2px 5px black";
  newButton.style.fontWeight = "400";
  newButton.style.fontSize = Math.trunc(parseInt(newButton.style.height) * 0.65) + "px";
  newButton.appendChild(document.createTextNode("Entry button"));
  var editor = ID("editor");
  editor.appendChild(newButton);
  UpdateSelectOtions();
  SelectMe(newButton.id);
  DocumentChanged();
}

function AddSwitch() {
  const newSwitch = document.createElement("img");
  newSwitch.setAttribute("id", "obj_" + GetNewId());
  newSwitch.dataset.tagConnection = "";
  newSwitch.dataset.onImg = "img/on.png";
  newSwitch.dataset.offImg = "img/off.png";
  newSwitch.dataset.objType = "switch";
  newSwitch.src = newSwitch.dataset.offImg;
  newSwitch.style.position = "absolute";
  newSwitch.style.top = GetNewElementPos().y;
  newSwitch.style.left = GetNewElementPos().x;
  newSwitch.style.height = "50px";
  newSwitch.style.boxSizing = "border-box";
  newSwitch.style.borderWidth = "2px";
  newSwitch.style.zIndex = "10";
  var editor = ID("editor");
  editor.appendChild(newSwitch);
  UpdateSelectOtions();
  SelectMe(newSwitch.id);
  DocumentChanged();
}

function AddLamp() {
  const newLamp = document.createElement("div");
  newLamp.setAttribute("id", "obj_" + GetNewId());
  newLamp.dataset.tagConnection = "";
  newLamp.dataset.onColor = "#33ff33";
  newLamp.dataset.offColor = "#012600";
  newLamp.dataset.objType = "lamp";
  newLamp.appendChild(document.createTextNode("˙"));
  newLamp.style.position = "absolute";
  newLamp.style.color = "rgba(255,255,255,0.6)";
  newLamp.style.padding = "0px";
  newLamp.style.margin = "0px";
  newLamp.style.top = GetNewElementPos().y;
  newLamp.style.left = GetNewElementPos().x;
  newLamp.style.height = "50px";
  newLamp.style.width = "50px";
  newLamp.style.boxSizing = "border-box";
  newLamp.style.border = "solid dimgray 0.2em";
  newLamp.style.borderColor = "#b0b0b0 #696969 #696969 #b0b0b0";
  newLamp.style.fontFamily = "FiraCode";
  newLamp.style.fontSize = Math.trunc(parseInt(newLamp.style.height) * 0.65) + "px";
  newLamp.style.zIndex = "10";
  newLamp.style.borderRadius = "50%";
  newLamp.style.backgroundColor = newLamp.dataset.offColor;
  newLamp.style.backgroundImage = "radial-gradient(at 20% 20%, #fff5, #fff0, #fff0)";
  var editor = ID("editor");
  editor.appendChild(newLamp);
  UpdateSelectOtions();
  SelectMe(newLamp.id);
  DocumentChanged();
}

function AddButton() {
  const newButton = document.createElement("button");
  newButton.setAttribute("type", "button");
  newButton.setAttribute("id", "obj_" + GetNewId());
  newButton.setAttribute("value", "1");
  newButton.dataset.tagConnection = "";
  newButton.dataset.objType = "button";
  newButton.style.position = "absolute";
  newButton.style.color = "#000000";
  newButton.style.backgroundColor = "#66ff66";
  newButton.style.borderRadius = "0.2rem";
  newButton.style.top = GetNewElementPos().y;
  newButton.style.left = GetNewElementPos().x;
  newButton.style.height = "30px";
  newButton.style.width = null;
  newButton.style.minWidth = "100px";
  newButton.style.boxSizing = "border-box";
  newButton.style.borderWidth = "2px";
  newButton.style.fontFamily = "FiraCode";
  newButton.style.zIndex = "10";
  newButton.style.boxShadow = "2px 2px 5px black";
  newButton.style.fontWeight = "400";
  newButton.style.fontSize = Math.trunc(parseInt(newButton.style.height) * 0.65) + "px";
  newButton.appendChild(document.createTextNode("Button"));
  var editor = ID("editor");
  editor.appendChild(newButton);
  UpdateSelectOtions();
  SelectMe(newButton.id);
  DocumentChanged();
}

function AddJsButton() {
  const newButton = document.createElement("button");
  newButton.setAttribute("type", "button");
  newButton.setAttribute("id", "obj_" + GetNewId());
  newButton.setAttribute("value", "1");
  newButton.dataset.objType = "jsButton";
  newButton.dataset.script = "window.open('about:blank', 'felugro', 'popup=true,width=640,height=360')";
  newButton.style.position = "absolute";
  newButton.style.color = "#000000";
  newButton.style.backgroundColor = "#6666ff";
  newButton.style.borderRadius = "0.2rem";
  newButton.style.top = GetNewElementPos().y;
  newButton.style.left = GetNewElementPos().x;
  newButton.style.height = "30px";
  newButton.style.width = null;
  newButton.style.minWidth = "100px";
  newButton.style.boxSizing = "border-box";
  newButton.style.borderWidth = "2px";
  newButton.style.fontFamily = "FiraCode";
  newButton.style.zIndex = "10";
  newButton.style.boxShadow = "2px 2px 5px black";
  newButton.style.fontWeight = "400";
  newButton.style.fontSize = Math.trunc(parseInt(newButton.style.height) * 0.65) + "px";
  newButton.appendChild(document.createTextNode("JS Button"));
  var editor = ID("editor");
  editor.appendChild(newButton);
  UpdateSelectOtions();
  SelectMe(newButton.id);
  DocumentChanged();
}

function AddText(box) {
  var newText;
  newText = document.createElement("div");
  newText.setAttribute("id", "obj_" + GetNewId());
  if (box) newText.dataset.objType = "textbox";
  else newText.dataset.objType = "text";
  newText.dataset.tagConnection = "";
  newText.dataset.neg = "false";
  newText.dataset.expression = "x > 0 && x < 100";
  newText.style.position = "absolute";
  newText.style.color = "#000000";
  newText.style.backgroundColor = "rgba(0, 0, 0, 0)";
  newText.style.top = GetNewElementPos().y;
  newText.style.left = GetNewElementPos().x;
  if (!box) newText.style.height = "30px";
  newText.style.rotate = "0deg";
  newText.style.boxSizing = "border-box";
  newText.style.borderWidth = "2px";
  newText.style.borderStyle = "solid";
  newText.style.borderColor = "rgba(0, 0, 0, 0)";
  newText.style.fontFamily = "FiraCode";
  newText.style.margin = "0";
  newText.style.zIndex = "10";
  newText.style.fontWeight = "400";
  if (box) newText.style.fontSize = "16px";
  else newText.style.fontSize = Math.trunc(parseInt(newText.style.height) * 0.65) + "px";
  newText.appendChild(document.createTextNode("Text"));
  var editor = ID("editor");
  editor.appendChild(newText);
  UpdateSelectOtions();
  SelectMe(newText.id);
  DocumentChanged();
}

function AddSquare() {
  const newSquare = document.createElement("div");
  newSquare.setAttribute("id", "obj_" + GetNewId());
  newSquare.dataset.objType = "square";
  newSquare.dataset.tagConnection = "";
  newSquare.dataset.neg = "false";
  newSquare.dataset.expression = "x > 0 && x < 100";
  newSquare.style.position = "absolute";
  newSquare.style.backgroundColor = "#ADD8E6";
  newSquare.style.top = GetNewElementPos().y;
  newSquare.style.left = GetNewElementPos().x;
  newSquare.style.height = "100px";
  newSquare.style.width = "200px";
  newSquare.style.rotate = "0deg";
  newSquare.style.borderRadius = "0px";
  newSquare.style.boxSizing = "border-box";
  newSquare.style.borderWidth = "0px";
  newSquare.style.borderStyle = "solid";
  newSquare.style.borderColor = "rgba(0, 0, 0, 0)";
  newSquare.style.zIndex = "10";
  var editor = ID("editor");
  editor.appendChild(newSquare);
  UpdateSelectOtions();
  SelectMe(newSquare.id);
  DocumentChanged();
}

function AddAlarmWindow() {
  const newAlarmWindow = document.createElement("div");
  newAlarmWindow.setAttribute("id", "obj_" + GetNewId());
  newAlarmWindow.dataset.objType = "alarmwindow";
  newAlarmWindow.style.position = "absolute";
  newAlarmWindow.style.backgroundColor = "#444";
  newAlarmWindow.style.color = "#ddd";
  newAlarmWindow.style.top = GetNewElementPos().y;
  newAlarmWindow.style.left = GetNewElementPos().x;
  newAlarmWindow.style.height = "150px";
  newAlarmWindow.style.width = "800px";
  newAlarmWindow.style.rotate = "0deg";
  newAlarmWindow.style.borderRadius = "0px";
  newAlarmWindow.style.boxSizing = "border-box";
  newAlarmWindow.style.borderWidth = "4px";
  newAlarmWindow.style.borderStyle = "solid";
  newAlarmWindow.style.borderColor = "#888";
  newAlarmWindow.style.zIndex = "10";
  newAlarmWindow.style.overflowY = 'scroll';
  newAlarmWindow.style.fontSize = "16px";
  const tb = document.createElement('table');
  tb.style.width = '100%';
  const th = document.createElement('thead');
  th.style.backgroundColor = '#444';
  const tr = document.createElement('tr');
  const text = document.createElement('th');
  const date = document.createElement('th');
  text.appendChild(document.createTextNode('Üzenet szövege'));
  date.appendChild(document.createTextNode('Időpont'));
  tr.appendChild(text);
  tr.appendChild(date);
  th.appendChild(tr);
  const tbody = document.createElement('tbody');
  tb.appendChild(th);
  tb.appendChild(tbody);
  newAlarmWindow.appendChild(tb);
  var editor = ID("editor");
  editor.appendChild(newAlarmWindow);
  UpdateSelectOtions();
  SelectMe(newAlarmWindow.id);
  DocumentChanged();
}

function AddAlarmText(parentID) {
  console.log(parentID);
  const newAT = document.createElement("tr");
  const newATcell0 = document.createElement("td");
  const newATcell1 = document.createElement("td");
  newATcell0.appendChild(document.createTextNode('Ez lesz az üzenet szövege'));
  newATcell1.appendChild(document.createTextNode('YYYY-MM-DD HH:mm:ss'));
  newAT.appendChild(newATcell0);
  newAT.appendChild(newATcell1);
  newAT.setAttribute("id", "obj_" + GetNewId());
  newAT.dataset.objType = "alarmtext";
  newAT.dataset.tagConnection = "";
  newAT.dataset.neg = "false";
  newAT.dataset.expression = "x > 0 && x < 100";
  newAT.style.backgroundColor = "#e33";
  newAT.style.color = "#222";
  ID(parentID).children[0].children[1].appendChild(newAT);
  UpdateSelectOtions();
  DocumentChanged();
}

function AddPicture() {
  let formData = new FormData();
  formData.append('symbol', 'get')
  fetch('', {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
    },
  })
    .then(response => response.json())
    .then(response => AddPicture_2(response))
    .catch(error => {
      DConfirm("Hiba történt a szimbólumtár betöltésekor!", 'Bezár', '', 'tomato', '');
    });
}

function AddPicture_2(json) {
  const imgSelect = document.createElement("dialog");
  imgSelect.style.width = '80vw';
  imgSelect.style.height = '80vh';
  imgSelect.appendChild(document.createTextNode("Válasszon képet:"));
  /** @type {any} */
  const imgDiv = document.createElement("div");
  imgDiv.style.height = '80%';
  imgDiv.style.width = '90%';
  imgDiv.style.overflow = 'auto';
  imgDiv.style.margin = 'auto';
  const okButton = document.createElement("button");
  const uploadButton = document.createElement("button");
  const delButton = document.createElement("button");
  delButton.style.backgroundColor = 'tomato';
  var img;
  for (let i = 0; i < json.lib.length; i++) {
    img = document.createElement("img");
    img.src = 'symbols/' + json.lib[i];
    img.title = json.lib[i].split('.')[0].toUpperCase();
    img.style.margin = '0.5rem';
    img.style.width = "8%";
    img.style.minWidth = "64px";
    img.onclick = (/** @type {any} */e) => {
      for (const child of imgDiv.children) {
        child.style.border = 'none';
        child.style.backgroundColor = "";
      }
      e.target.style.border = "solid tomato 2px";
      e.target.style.backgroundColor = "lightblue";
      okButton.removeAttribute('disabled');
      delButton.setAttribute('disabled', 'disabled');
      okButton.value = 'symbols/' + json.lib[i];
    }

    imgDiv.appendChild(img);

  }
  imgDiv.appendChild(document.createElement('br'));
  imgDiv.appendChild(document.createTextNode("Feltöltöttek:"));
  imgDiv.appendChild(document.createElement('hr'));
  for (let i = 0; i < json.user.length; i++) {
    img = document.createElement("img");
    img.src = 'symbols/user/' + json.user[i];
    img.title = json.user[i].split('.')[0].toUpperCase();
    img.style.margin = '0.5rem';
    img.style.width = "8%";
    img.style.minWidth = "64px";
    img.onclick = (/** @type {any} */e) => {
      for (const child of imgDiv.children) {
        child.style.border = 'none';
        child.style.backgroundColor = null;
      }
      e.target.style.border = "solid blue 3px";
      e.target.style.backgroundColor = "lightblue";
      okButton.removeAttribute('disabled');
      delButton.removeAttribute('disabled');
      delButton.value = json.user[i];
      okButton.value = 'symbols/user/' + json.user[i];
    }

    imgDiv.appendChild(img);

  }
  imgSelect.appendChild(imgDiv);
  const buttonDiv = document.createElement("div");
  buttonDiv.style.width = '90%';
  buttonDiv.style.margin = 'auto';
  buttonDiv.style.marginTop = '1rem';
  buttonDiv.style.textAlign = 'right';
  //const okButton = document.createElement("button");
  delButton.appendChild(document.createTextNode("Törlés"));
  uploadButton.appendChild(document.createTextNode("Feltöltés"));
  delButton.setAttribute("disabled", "disabled");
  delButton.onclick = (e) => {
    DConfirm("Biztos töli a képet?", "Törlés", "Mégse", "tomato", "steelblue").then((valasz) => {
      if (valasz) {
        //console.log("DEL: " + delButton.value);
        let formData = new FormData;
        formData.append('symbol', 'del');
        formData.append('file', delButton.value);
        fetch('', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        })
          .then(response => response.json())
          .then(response => {
            imgSelect.remove();
            AddPicture_2(response);
          })
          .catch(error => {
            DConfirm("Hiba történt a törlés közben!", 'Bezár', '', 'tomato', '');
          });
      }
    });
  }
  uploadButton.onclick = (e) => {
    //console.log("UPLOAD");
    GetFileDialog("image/png, image/jpeg").then((file) => {
      if (file) {
        let formData = new FormData();
        formData.append('symbol', 'upload');
        formData.append('usersymbol', file);
        fetch('', {
          method: 'POST',
          body: formData
        })
          .then(response => response.json())
          .then(response => {
            imgSelect.remove();
            AddPicture_2(response);
          })
          .catch(error => {
            DConfirm("Hiba történt a feltöltés közben!", 'Bezár', '', 'tomato', '');
          });
      }
    });
  }
  okButton.appendChild(document.createTextNode("Kiválaszt"));
  okButton.setAttribute("disabled", "disabled");
  okButton.onclick = (/** @type {any} */e) => {
    AddPicture_3(e.target.value);
    imgSelect.remove();
  }
  const cancelButton = document.createElement("button");
  cancelButton.appendChild(document.createTextNode("Mégsem"));
  cancelButton.onclick = () => {
    imgSelect.remove();
  }
  buttonDiv.appendChild(uploadButton);
  buttonDiv.appendChild(delButton);
  //buttonDiv.appendChild(document.createTextNode("\u00A0"));
  buttonDiv.appendChild(okButton);
  buttonDiv.appendChild(cancelButton);
  imgSelect.appendChild(buttonDiv);
  ID("maindiv").appendChild(imgSelect);
  imgSelect.showModal();
  cancelButton.focus();
}

function AddPicture_3(img) {
  const newImg = document.createElement("img");
  newImg.setAttribute("id", "obj_" + GetNewId());
  newImg.dataset.objType = "picture";
  newImg.dataset.tagConnection = "";
  newImg.dataset.neg = "false";
  newImg.dataset.expression = "x > 0 && x < 100";
  newImg.src = img;
  newImg.style.position = "absolute";
  newImg.style.top = GetNewElementPos().y;
  newImg.style.left = GetNewElementPos().x;
  newImg.style.height = "100px";
  newImg.style.rotate = "0deg";
  newImg.style.boxSizing = "border-box";
  newImg.style.borderWidth = "0px";
  newImg.style.borderStyle = "solid";
  newImg.style.borderColor = "rgba(0, 0, 0, 0)";
  newImg.style.zIndex = "10";
  newImg.style.transform = "scaleX(1)";
  var editor = ID("editor");
  editor.appendChild(newImg);
  UpdateSelectOtions();
  SelectMe(newImg.id);
  DocumentChanged();
}

function GetNewElementPos(){
  var zoom = 1;
  if(ID('editor').style.transform.length){
    zoom = Number(ID('editor').style.transform.replaceAll(/[^0-9.]/g,''));
  }
  var x = (ID('rightbar').scrollLeft + 10) / zoom + 'px';
  var y = (ID('rightbar').scrollTop + 10) / zoom + 'px';

  return {'x': x, 'y': y};
}