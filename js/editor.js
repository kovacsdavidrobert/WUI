// @ts-check
/*
 * Web based User Interface (WUI)
 * Copyright (c) 2026 Dávid Róbert Kovács
 * Licensed under the MIT License.
 */
//Globális változók definiálása:
var cntrlIsPressed = false;
var cntrlIsPressedFlag = false;
var shiftIsPressed = false;
var cursor = {
  x: 0,
  y: 0
};
var zoom = 1;
var dragobj = null;
var h1 = 0;
var i1 = 0;
var clipboard = [];
var slide = false;
var raster = 10;
var endOfDrag = false;
var selectionCount = 0;
var undo;
const atlo = 'linear-gradient(to top right,rgba(0,0,0,0) 0%,rgba(0,0,0,0) calc(50% - 0.8px),rgba(0,0,0,1) 50%,rgba(0,0,0,0) calc(50% + 0.8px),rgba(0,0,0,0) 100%)';


document.addEventListener("DOMContentLoaded", () => {
  Tekero(true);
  ID('versionText').innerHTML = "V1.41";
});


//Oldal betöltődését követően:
window.addEventListener("load", () => {
  setTimeout(() => { //Még várunk egy kicsit
    ID('maindiv').style.display = "block";
    let feher = document.createElement('div');//Áttűnés az oldal megjelenítésekor
    feher.className = 'whitehide';
    feher.setAttribute('id', 'feher');
    document.body.appendChild(feher);
    Tekero(false);
    setTimeout(() => {
      ID('feher').remove();
    }, 1000);
  }, 200);

  if (!ID('editor')) {
    return;
  }

  if (ID("editor").style.backgroundColor.length == 0) {
    ID("editor").style.backgroundColor = "#f8f8f8";
  }

  document.addEventListener("keydown", function (/** @type {any} */e) {
    if (e.key == 'Control' && QSA("dialog").length == 0) {
      cntrlIsPressed = true;
      cntrlIsPressedFlag = true;
      UpdateCursor();
    }
    if (e.key == "Shift") {
      shiftIsPressed = true;
    }

    if (e.key == "a" && cntrlIsPressed) {
      e.preventDefault();
      SelectAll();
    }

    if (e.key == "Delete" && e.target.nodeName == 'BODY') {
      e.preventDefault();
      DelSelected();
    }

    if (e.key == "Escape" && e.target.nodeName == 'BODY') {
      e.preventDefault();
      UnselectAll();
    }

    if (e.target.nodeName == 'BODY') {
      if (e.key == "ArrowUp") {
        e.preventDefault();
        ArrowMove('up');
        UpdateCoords();
      }
      if (e.key == "ArrowDown") {
        e.preventDefault();
        ArrowMove('down');
        UpdateCoords();
      }
      if (e.key == "ArrowRight") {
        e.preventDefault();
        ArrowMove('right');
        UpdateCoords();
      }
      if (e.key == "ArrowLeft") {
        e.preventDefault();
        ArrowMove('left');
        UpdateCoords();
      }
    }

    if (e.key == "c" && cntrlIsPressed && e.target.nodeName == 'BODY') {
      e.preventDefault();
      CopySelected();
    }
    if (e.key == "s" && cntrlIsPressed) {
      e.preventDefault();
      ID('savebutton').click();
    }

    if (e.key == "v" && cntrlIsPressed && e.target.nodeName == 'BODY') {
      e.preventDefault();
      PasteSelected();
    }
    if (e.key == "z" && cntrlIsPressed && e.target.nodeName == 'BODY') {
      e.preventDefault();
      if(undo.havePrev){
        Undo(-1);
      }
    }
    if (e.key == "y" && cntrlIsPressed && e.target.nodeName == 'BODY') {
      e.preventDefault();
      if(undo.haveNext){
        Undo(1);
      }
    }

  });

  document.addEventListener("keyup", function (e) {
    if (e.key == "Control") {
      cntrlIsPressed = false;
      UpdateCursor();
    }
    if (e.key == "Shift") {
      shiftIsPressed = false;
    }
  });

  ID("editor").addEventListener("mousedown", function (/** @type {any} */e) {
    ID("floatDropDownMenu").style.display = 'none';
    if (ID('tagselect')) ID('tagselect').remove();
    if (e.target.id == "editor" && cntrlIsPressed == false) {
      UnselectAll();
    }
  });

  ID("editor").addEventListener("contextmenu", function (e) {
    e.preventDefault();
    if (e.clientX > (document.body.offsetWidth / 2)) {
      if (e.clientY > (document.body.offsetHeight / 2)) {
        ID("floatDropDownMenu").style.transform = "translate(-100%, -100%)";
      }
      else {
        ID("floatDropDownMenu").style.transform = "translate(-100%, 0%)";
      }
    }
    else {
      if (e.clientY > (document.body.offsetHeight / 2)) {
        ID("floatDropDownMenu").style.transform = "translate(0%, -100%)";
      }
      else {
        ID("floatDropDownMenu").style.transform = "translate(0%, 0%)";
      }
    }
    ID("floatDropDownMenu").style.top = e.clientY + "px";
    ID("floatDropDownMenu").style.left = e.clientX + "px";
    ID("floatDropDownMenu").style.display = 'block';
  });
  ID("editor").onselectstart = ID("editor").ondrag = ID("editor").onselect = (e) => {//Kisérleti event l.: kijelölés tiltása
    e.preventDefault();
  }
  ID("slidebar").onselectstart = ID("slidebar").ondrag = ID("slidebar").onselect = (e) => {//Kisérleti event l.: kijelölés tiltása
    e.preventDefault();
  }

  UnselectAll();

  ID("slidebar").onmousedown = () => {
    slide = true;
  }
  document.onmouseup = () => {
    slide = false;
  }
  document.onmousemove = (e) => {
    if (slide && (e.clientX >= 180) && (e.clientX < 600)) {
      e.preventDefault();
      ID('leftbar').style.minWidth = (e.clientX - 12) + 'px';
      ID('leftbar').style.maxWidth = (e.clientX - 12) + 'px';
      ID('floatbar').style.left = (e.clientX - 1) + 'px';
    }
  }
  ID('leftbar').onselectstart = (e) => {
    e.preventDefault();
  }

  AddSelectorRectangle(ID('editor'));

  ScrollEntries(1000);
  AddCoords();
  undo = new UndoCache(20, ID('editor'), Undo);
  undo.save();

  window.onerror = (message) => {
    Toast('Rendszer hiba: "' + message + '"', 'error');
  }
});


function ColorPicker(startColor, setCallback) {
  startColor = IsTransparent(startColor) ? "" : startColor;
  const d = document.createElement('dialog');
  d.style.lineHeight = "10px";
  d.style.width = "400px";
  d.style.maxWidth = "450px";
  d.style.padding = "1rem";
  d.style.boxSizing = "content-box";
  const title = document.createElement('p');
  title.appendChild(document.createTextNode("Válasszon színt:"));
  d.appendChild(title);
  const template = document.createElement('div');
  var color = [0, 0, 0];
  template.style.width = '20px';
  template.style.height = '20px';
  template.style.border = "1px solid black";
  template.style.display = "inline-block";
  template.style.margin = "2px";
  template.classList.add('colorPick');

  for (let i = 0; i <= 1; i++) {
    color[0] = i * 255;
    color[1] = i * 255;
    color[2] = i * 255;
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  /** @type {any} */
  const trcolor = template.cloneNode(true);
  trcolor.style.background = atlo;
  trcolor.title = "transparent";
  trcolor.classList = "";
  d.appendChild(trcolor);
  d.appendChild(document.createElement("br"));

  for (let i = 1; i < 16; i += 1) {
    color[0] = Math.min(16 * i, 255);
    color[1] = Math.min(16 * i, 255);
    color[2] = Math.min(16 * i, 255);
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  d.appendChild(document.createElement("br"));

  for (let i = 1; i < 16; i++) {
    color[0] = Math.min(32 * i, 255);
    color[1] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    color[2] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  d.appendChild(document.createElement("br"));

  for (let i = 1; i < 16; i++) {
    color[1] = Math.min(32 * i, 255);
    color[2] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    color[0] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  d.appendChild(document.createElement("br"));

  for (let i = 1; i < 16; i++) {
    color[2] = Math.min(32 * i, 255);
    color[0] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    color[1] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  d.appendChild(document.createElement("br"));

  for (let i = 1; i < 16; i++) {
    color[0] = Math.min(32 * i, 255);
    color[1] = Math.min(32 * i, 255);
    color[2] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  d.appendChild(document.createElement("br"));

  for (let i = 1; i < 16; i++) {
    color[1] = Math.min(32 * i, 255);
    color[2] = Math.min(32 * i, 255);
    color[0] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  d.appendChild(document.createElement("br"));

  for (let i = 1; i < 16; i++) {
    color[2] = Math.min(32 * i, 255);
    color[0] = Math.min(32 * i, 255);
    color[1] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  d.appendChild(document.createElement("br"));

  for (let i = 1; i < 16; i++) {
    color[0] = Math.min(32 * i, 255);
    color[1] = Math.min((20 * i + 5), 255);
    color[2] = i <= 8 ? 0 : Math.min(32 * (i - 8), 255);
    /** @type {any} */
    let c = template.cloneNode(true);
    c.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`;
    c.title = c.style.backgroundColor;
    d.appendChild(c);
  }
  d.appendChild(document.createElement("br"));

  const inp = document.createElement('input');
  inp.style.width = '100%';
  inp.style.boxSizing = "border-box";
  inp.style.margin = "10px 0px";
  d.appendChild(inp);
  /** @type {any} */
  const selectedColor = template.cloneNode(true);
  selectedColor.classList = '';
  selectedColor.style.verticalAlign = "middle";
  const ct = document.createElement("span");
  ct.innerText = "Választva: ";
  ct.style.verticalAlign = "middle";
  d.appendChild(document.createElement("br"));
  d.appendChild(ct);
  d.appendChild(selectedColor);

  const ok = document.createElement('button');
  ok.innerText = "OK";
  ok.style.width = "12rem";
  ok.style.margin = '10px 0 0 0';
  ok.style.backgroundColor = 'lightgreen';
  ok.onclick = () => {
    let ret = getComputedStyle(selectedColor).getPropertyValue('background-color');
    ret = IsTransparent(ret) ? "" : ret;
    setCallback(ret);
    d.remove();
  }
  const cancel = document.createElement('button');
  cancel.innerText = "Mégsem";
  cancel.style.width = "12rem";
  cancel.style.margin = '10px 0 0 10px';
  cancel.onclick = () => {
    d.remove();
  }

  /** @type {any} */
  var szinek = d.querySelectorAll('.colorPick');
  for (let szin of szinek) {
    szin.onclick = (e) => {
      inp.value = e.currentTarget.style.backgroundColor;
    }
  }

  trcolor.onclick = () => {
    inp.value = "";
  }

  inp.oninput = d.onclick = () => {
    selectedColor.style.background = IsTransparent(inp.value) ? atlo : "";
    selectedColor.style.backgroundColor = inp.value;
    selectedColor.style.visibility = (selectedColor.style.backgroundColor == inp.value || selectedColor.style.backgroundColor.match(/^rgb/)) ? "visible" : "hidden";

    for (let szin of szinek) {
      szin.style.transform = (getComputedStyle(szin).getPropertyValue('background-color') == getComputedStyle(selectedColor).getPropertyValue('background-color')) ? "scale(1.2)" : "";
    }
    trcolor.style.transform = IsTransparent(inp.value) ? "scale(1.2)" : "";
    if (selectedColor.style.visibility == 'visible') {
      ok.removeAttribute('disabled');
    }
    else {
      ok.setAttribute('disabled', 'disabled');
    }
  };

  inp.value = startColor != undefined ? startColor : "";
  d.click();

  d.appendChild(document.createElement("br"));
  d.appendChild(ok);
  d.appendChild(cancel);

  document.body.appendChild(d);
  d.showModal();
  inp.value = startColor != undefined ? startColor : "";
  d.click();
}

function IsTransparent(color) {
  return color == "" || color == "initial" || color.match(/^rgba.+?0\)$/) || color.match(/^#[0-9A-Za-z]{6,6}00$/);
}

function InitDropDown() {
  ID("bgInput").value = RgbToHex(ID("editor").style.backgroundColor);
}


function SetBgColor() {
  ID("editor").style.backgroundColor = ID("bgInput").value;
}


function AddEvents(t, isAlarmText = false) {
  if (!isAlarmText) {
    t.onclick = (e) => {
      if (ID("selectedTag").value && ID(ID("selectedTag").value).dataset.objType == "alarmtext") UnselectAll();
      SelectMe(e.currentTarget.id);
    };
    t.onmousedown = (e) => {
      if (e.buttons != 2) {//Chrome
        e.preventDefault();
        MakeObjectToDrag(e.currentTarget.getAttribute('id'));
      }
    };
    if (t.dataset.objType == "switch") {
      t.ondblclick = (e) => {
        if (e.target.src.match(e.target.dataset.onImg)) {
          e.target.src = e.target.dataset.offImg;
        } else {
          e.target.src = e.target.dataset.onImg;
        }
      };
    }
  }
  else {
    t.onclick = (e) => {
      UnselectAll();
      e.stopPropagation();
      SelectMe(e.currentTarget.id);
    };
  }

  if (t.dataset.objType == "lamp") {
    t.ondblclick = (e) => {
      if (RgbToHex(e.target.style.backgroundColor) == RgbToHex(e.target.dataset.onColor)) {
        e.target.style.backgroundColor = e.target.dataset.offColor;
      } else {
        e.target.style.backgroundColor = e.target.dataset.onColor;
      }
    };
  }
  if (["text", "textbox", "button", "jsButton"].includes(t.dataset.objType)) {
    t.ondblclick = (e) => {
      if (QSA("details > textarea, details > input[type=text]")) {
        QSA("details > textarea, details > input[type=text]")[0].select();
        QSA("details > textarea, details > input[type=text]")[0].focus();
      }
    }
  }
  if (!["lamp", "switch", "text", "textbox", "button", "alarmwindow", "jsButton"].includes(t.dataset.objType)) {
    t.ondblclick = (e) => {
      ID('taglistbutton').click();
    };
  }
}


function GetNewId() {
  var id = 1;
  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (parseInt(ID("selectedTag").options[i].value.split('_')[1]) == id) {
      id++;
      i = -1;
    }
  }
  return id;
}


function CopySelected() {
  clipboard = [];
  var k = 0;
  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (ID("selectedTag").options[i].selected == true &&
      ID(ID("selectedTag").options[i].value).dataset.objType != 'alarmtext') {
      clipboard[k++] = ID(ID("selectedTag").options[i].value).cloneNode(true);
      ID("pasteIcon").className = "active";
      ID("menuPaste").className = "active";
    }
  }
  if (k == 0) {
    Alert("Az elem nem másolható.", "OK");
  }
}


function CopySelectedSys() {
  var sysClipboard = { type: 'wui_clipboard_data', data: [] };
  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (ID("selectedTag").options[i].selected == true &&
      ID(ID("selectedTag").options[i].value).dataset.objType != 'alarmtext') {
      sysClipboard.data.push(ID(ID("selectedTag").options[i].value).outerHTML);
    }
  }
  try{
    navigator.clipboard.writeText(JSON.stringify(sysClipboard));
  }
  catch(err){
    console.log(err);
    Toast("A másolás csak HTTPS kapcsolaton keresztül működik!", 'error');
  }
  
}

function EditCSS() {
  var css = ID(ID("selectedTag").value).style.cssText;
  css = css.split(/;\s*/).join(';\n');
  /** @type {any} */
  const d = document.createElement('DIALOG');
  d.style.width = '70vw';
  const pre = document.createElement('PRE');
  const div = document.createElement('div');
  pre.style.width = '100%';
  pre.style.maxHeight = '60vh';
  pre.style.overflowY = "scroll";
  pre.style.background = "repeating-linear-gradient(to bottom,#ffffff,#ffffff 1.5rem,#eee 1.5rem,#eee 3rem)";
  pre.setAttribute('contenteditable', 'true');
  pre.setAttribute('autocorrect', "off");
  pre.spellcheck = false;
  const saveBu = document.createElement('button');
  saveBu.appendChild(document.createTextNode('Mentés'));
  saveBu.style.backgroundColor = 'lightgreen';
  const cancelBu = document.createElement('button');
  cancelBu.appendChild(document.createTextNode('Mégsem'));
  const p = document.createElement('P');
  p.appendChild(document.createTextNode("Szerkesztheti az objektum stíluslapját:"));
  p.style.textAlign = 'left';
  p.style.fontSize = '1.4rem';
  const err = document.createElement('P');
  err.style.textAlign = 'left';
  err.appendChild(document.createTextNode("Legyen figyelmes a kód módosításakor, működési hibát okozhat!"));
  d.appendChild(p);
  div.appendChild(pre);
  d.appendChild(div);
  d.appendChild(err);
  d.appendChild(document.createElement('br'));
  d.appendChild(saveBu);
  d.appendChild(cancelBu);
  d.style.textAlign = "right";
  pre.style.textAlign = "left";
  document.body.appendChild(d);
  d.showModal();
  pre.innerHTML = CSSPrettify(css);
  pre.onkeyup = (/** @type {any} */e) => {
    let pos = GetCaretPosition(e.target);
    let css = e.target.innerText;
    if (TestCssOk(css)) {
      err.innerHTML = '<span style="color:darkgreen">A kód megfelelő</span>';
      saveBu.removeAttribute('disabled');
    }
    else {
      err.innerHTML = '<span style="color:darkred;font-weight:bold;">Hibás CSS kód.</span>';
      saveBu.setAttribute('disabled', 'disabled');
    }
    e.target.innerHTML = CSSPrettify(css);
    SetCurrentCursorPosition(e.target, pos);

  }
  saveBu.onclick = () => {
    ID(ID("selectedTag").value).style.cssText = pre.innerText.split('\n').join(' ');
    d.remove();
  }
  cancelBu.onclick = () => {
    d.remove();
  }

}

function ExportGUI(/** @type {string}*/name) {
  SelectAll();
  var sysClipboard = { type: 'wui_screen_export_data', editor: ID('editor').style.cssText, data: [] };
  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (ID("selectedTag").options[i].selected == true) {
      sysClipboard.data.push(ID(ID("selectedTag").options[i].value).outerHTML);
    }
  }
  let blob = new Blob([JSON.stringify(sysClipboard)], {
    type: "application/json",
  });


  const stream = blob.stream();
  const compressed = stream.pipeThrough(
    new CompressionStream("gzip"),
  );
  var resp = new Response(compressed);
  resp.blob().then((blob) => {
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    name = GetSafeFilename(name);
    a.download = name + "_export.wui";
    a.href = url;
    a.click();
    a.remove();
  });
  UnselectAll();
}


function GetSafeFilename(/** @type {string}*/inputText){
  inputText = inputText.replaceAll(/á/g, 'a');
  inputText = inputText.replaceAll(/é/g, 'e');
  inputText = inputText.replaceAll(/í/g, 'i');
  inputText = inputText.replaceAll(/ú/g, 'u');
  inputText = inputText.replaceAll(/ü/g, 'u');
  inputText = inputText.replaceAll(/ű/g, 'u');
  inputText = inputText.replaceAll(/ó/g, 'o');
  inputText = inputText.replaceAll(/ö/g, 'o');
  inputText = inputText.replaceAll(/ő/g, 'o');

  inputText = inputText.replaceAll(/Á/g, 'A');
  inputText = inputText.replaceAll(/É/g, 'E');
  inputText = inputText.replaceAll(/Í/g, 'I');
  inputText = inputText.replaceAll(/Ú/g, 'U');
  inputText = inputText.replaceAll(/Ü/g, 'U');
  inputText = inputText.replaceAll(/Ű/g, 'U');
  inputText = inputText.replaceAll(/Ó/g, 'O');
  inputText = inputText.replaceAll(/Ö/g, 'O');
  inputText = inputText.replaceAll(/Ő/g, 'O');

  return inputText.replaceAll(/[^A-Za-z0-9]/g, '_')
}


function ImportGUI() {
  var file = document.createElement("input");
  file.setAttribute("type", "file");
  file.setAttribute("accept", ".wui");
  file.click();
  file.onchange = () => {
    Tekero(true);
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = () => {
        var blob = new Blob([reader.result], {
          type: "application/gzip",
        });
        const stream = blob.stream();
        const decompressed = stream.pipeThrough(
          new DecompressionStream("gzip")
        );
        var resp = new Response(decompressed);
        resp.blob().then((blob) => {
          blob.text().then((text) => {
            try {
              var imported = JSON.parse(text);
            } catch (err) {
              Alert("Nem megfelelő WUI import/export formátum!", "OK");
              return;
            }
            if (
              imported.data != undefined &&
              imported.type != undefined &&
              imported.type == "wui_screen_export_data"
            ) {
              ID("editor").style.cssText = imported.editor;
              ID("editor").innerHTML = "";
              Tekero(false);
              PasteSelectedSys(text);
              UnselectAll();
              DocumentChanged();
            } else {
              Alert("Nem megfelelő WUI import/export formátum!", "OK");
            }
          });
        }).catch(() => {
          Alert("Nem megfelelő WUI import/export formátum!", "OK");
          Tekero(false);
          return;
        });
      };
      reader.readAsArrayBuffer(file.files[0]);
      file.remove();
    }, 10);
  };
}


function PasteSelectedSys0() {
  navigator.permissions.query({ name: /** @type {any} */ ("clipboard-read") }).then((result) => {
    if (result.state === "granted" || result.state === "prompt") {
      navigator.clipboard.readText()
        .then((clipText) => (PasteSelectedSys(clipText)));
    }
  })
    .catch((err) => {
      console.log('Nem lehet engedélyt kérni a vágólap használatára.', err)
      navigator.clipboard.readText()
        .then((clipText) => (PasteSelectedSys(clipText)));
    }).catch((err) => {
      console.log(err);
      Toast("A beillesztés csak HTTPS kapcsolaton keresztül működik!", 'error');
    });
    DocumentChanged();
}


function PasteSelectedSys(sysClipboard) {
  try {
    var sysClipboard = JSON.parse(sysClipboard);
  }
  catch (err) {
    Alert("Érvénytelen WUI editor objektum!", "OK");
    return;
  }
  sysClipboard = sysClipboard.data;
  /** @type {any} */
  const tmpDiv = document.createElement('div');
  var newIDs = [];
  for (let i = 0; i < sysClipboard.length; i++) {
    tmpDiv.innerHTML = sysClipboard[i];
    tmpDiv.firstChild.id = "obj_" + GetNewId();
    if (tmpDiv.firstChild.dataset && tmpDiv.firstChild.dataset.objType && tmpDiv.firstChild.dataset.objType == "alarmwindow") {
      let aw = tmpDiv.firstChild;
      var k = 1;
      for (let at of aw.children[0].children[1].children) {
        at.setAttribute("id", aw.getAttribute('id') + 'at' + k);
        k++;
      }
    }
    newIDs.push(tmpDiv.firstChild.id);
    ID("editor").appendChild(tmpDiv.firstChild);
    UpdateSelectOtions();
  }

  UnselectAll();
  var saveCntrl = cntrlIsPressed;
  cntrlIsPressed = true;
  for (let i = 0; i < newIDs.length; i++) {
    SelectMe(newIDs[i]);
  }
  cntrlIsPressed = saveCntrl;
  sysClipboard = [];
  CopySelected();
}


function PasteSelected() {
  for (let i = 0; i < clipboard.length; i++) {
    clipboard[i].setAttribute("id", "obj_" + GetNewId());
    if (clipboard[i].dataset.objType && clipboard[i].dataset.objType == "alarmwindow") {
      let aw = clipboard[i];
      var k = 1;
      for (let at of aw.children[0].children[1].children) {
        at.setAttribute("id", aw.getAttribute('id') + 'at' + k);
        k++;
      }
    }
    clipboard[i].style.top = (parseInt(clipboard[i].style.top) + 10) + "px";
    clipboard[i].style.left = (parseInt(clipboard[i].style.left) + 10) + "px";
    ID("editor").appendChild(clipboard[i]);

    UpdateSelectOtions();
  }
  UnselectAll();
  var saveCntrl = cntrlIsPressed;
  cntrlIsPressed = true;
  for (let i = 0; i < clipboard.length; i++) {
    SelectMe(clipboard[i].id);
  }
  cntrlIsPressed = saveCntrl;
  clipboard = [];
  ID("pasteIcon").className = "inactive";
  ID("menuPaste").className = "inactive";
  CopySelected();
  DocumentChanged();
}


function DelSelected() {
  if (selectionCount > 1) {
    DConfirm(
      "Biztos töli az elemeket?",
      "Törlés",
      "Mégse",
      "tomato",
      "steelblue"
    ).then((valasz) => {
      if (!valasz) {
        return;
      }
      for (let i = 0; i < ID("selectedTag").options.length; i++) {
        if (ID("selectedTag").options[i].selected == true) {
          ID(ID("selectedTag").options[i].value).remove();
        }
      }

      UpdateSelectOtions();
      UnselectAll();
      DocumentChanged();
    });
  }
  else if (selectionCount == 1) {
    for (let i = 0; i < ID("selectedTag").options.length; i++) {
      if (ID("selectedTag").options[i].selected == true) {
        ID(ID("selectedTag").options[i].value).remove();
        break;
      }
    }
    UpdateSelectOtions();
    UnselectAll();
    DocumentChanged();
  }
}


function ZoomIn() {
  zoom += 0.1;
  if (zoom >= 1.9) {
    zoom = 2;
    ID("zoomInIcon").className = "inactive";
  }
  if (zoom > 0.5) {
    ID("zoomOutIcon").className = "active";
  }
  ID("editor").style.transform = "scale(" + zoom + ")";
}


function ZoomOut() {
  zoom -= 0.1;
  if (zoom < 2) {
    ID("zoomInIcon").className = "active";
  }
  if (zoom <= 0.55) {
    zoom = 0.5;
    ID("zoomOutIcon").className = "inactive";
  }
  ID("editor").style.transform = "scale(" + zoom + ")";
}


function Zoom11() {
  zoom = 1;
  ID("zoomInIcon").className = "active";
  ID("zoomOutIcon").className = "active";
  ID("editor").style.transform = "scale(" + zoom + ")";
}


function SelectMe(id) {
  if (!id) return;

  if (endOfDrag) {
    endOfDrag = false;
    SelectionChanged();
    return;
  }

  if (!cntrlIsPressed) {
    for (const child of document.querySelectorAll('[data-obj-type]')) {
      child.className = "";
    }
    ID(id).className = "selectedObj";
  }
  else {
    ID(id).className = ID(id).className == "selectedObj" ? "" : "selectedObj";
  }

  UpdateSelection();
  SelectionChanged();
}


function UpdateSelectOtions() {
  ID("selectedTag").innerHTML = "";
  var newOpt;
  for (const child of ID("editor").children) {
    AddEvents(child);
    newOpt = document.createElement("option");
    newOpt.setAttribute("value", child.id);
    newOpt.innerHTML = child.id;
    ID("selectedTag").appendChild(newOpt);
  }
  //AlarmWindow -> AlarmText
  var aw = document.querySelectorAll('[data-obj-type="alarmtext"]');
  for (let at of aw) {
    AddEvents(at, true);
    newOpt = document.createElement("option");
    newOpt.setAttribute("value", at.id);
    newOpt.innerHTML = at.id;
    ID("selectedTag").appendChild(newOpt);
  }
}


function SelectClicked() {
  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (ID("selectedTag").options[i].selected == true) {
      ID(ID("selectedTag").options[i].value).className = "selectedObj";
    }
    else {
      ID(ID("selectedTag").options[i].value).className = '';
    }
  }
  SelectionChanged();
  ID("selectedTag").blur();
}


function UpdateCursor(r = false) {
  let cursor = '';
  if (cntrlIsPressed && !shiftIsPressed && !r) cursor = "copy";
  let all = ID('rightbar').querySelectorAll('*');
  for (let i = 0; i < all.length; i++)all[i].style.cursor = cursor;
}


function SelectionChanged() {
  var objects = [];
  var selected = 0;
  var OBJTypes = [];

  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (ID("selectedTag").options[i].selected == true) {
      selected++;
      objects.push(ID(ID("selectedTag").options[i].value));
    }
  }

  selectionCount = selected;

  ID("prop").innerHTML = "";
  if (selected > 0) {
    ID("copyIcon").className = "active";
    ID("delIcon").className = "active";
    ID("menuDel").className = "active";
    ID("menuCopy").className = "active";
    ID("menuCopySys").className = "active";
    ID("menuPasteSys").className = "active";
    if (selected > 1) {
      ID("menuTag").className = "inactive";
      ID("menuCSS").className = "inactive";
      ID("prop").appendChild(document.createTextNode(selected + " kiválasztva"));
      ID("prop").appendChild(document.createElement("br"));
      //return;
    }
    else {
      ID("menuTag").className = "active";
      ID("menuCSS").className = "active";
    }
  } else {
    ID("menuTag").className = "inactive";
    ID("menuCSS").className = "inactive";
    ID("copyIcon").className = "inactive";
    ID("delIcon").className = "inactive";
    ID("menuDel").className = "inactive";
    ID("menuCopy").className = "inactive";
    ID("menuCopySys").className = "inactive";
    ID("menuPasteSys").className = "active";
    return;
  }

  for (let i = 0; i < objects.length; i++) {
    OBJTypes.push(objects[i].dataset.objType);
  }
  for (let i = 0; i < OBJTypes.length; i++) {
    if (wuiObjects[OBJTypes[i]] == undefined) return;
  }
  UpdateDatalist();
  if (OBJTypes.length == 1) {
    const bold = document.createElement("strong");
    bold.appendChild(
      document.createTextNode(objects[0].id + " (" + OBJTypes[0] + "):")
    );
    bold.className = 'in1';
    ID("prop").appendChild(bold);
    ID("prop").appendChild(document.createElement("br"));
  }

  if (AllObjectHas("position", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].position.name, false);
    if (AllObjectHas("position.x", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].position.x.name);
      DropDownAddNumberProp(d, objects, ["style", "left"], 1, 'px', -100, parseInt(ID("editor").style.width));
    }
    if (AllObjectHas("position.y", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].position.y.name);
      DropDownAddNumberProp(d, objects, ["style", "top"], 1, 'px', -100, parseInt(ID("editor").style.height));
    }
    if (AllObjectHas("position.z", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].position.z.name);
      DropDownAddNumberProp(d, objects, ["style", "zIndex"], 1, '', 1, 1000);
    }
    if (AllObjectHas("position.rotate", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].position.rotate.name);
      DropDownAddNumberProp(d, objects, ["style", "rotate"], 1, 'deg', -360, 360);
    }
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }


  if (AllObjectHas("dimensions", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].dimensions.name, true);
    if (AllObjectHas("dimensions.size", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].dimensions.size.name);
      DropDownAddNumberProp(d, objects, ["style", "height"], 1, 'px', 0, parseInt(ID("editor").style.height) * 2, '', (e) => {
        for (let i = 0; i < objects.length; i++) {
          objects[i].style.width = e.target.value + 'px';
        }
        if (AllObjectHas("dimensions.autoFont", OBJTypes)) {
          for (let i = 0; i < objects.length; i++) {
            objects[i].style.fontSize = Math.round(e.target.value * 6.5) / 10 + 'px';
          }
        }
      });
    }
    if (AllObjectHas("dimensions.onlyHeight", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].dimensions.onlyHeight.name);
      DropDownAddNumberProp(d, objects, ["style", "height"], 1, 'px', 0, parseInt(ID("editor").style.height) * 2, '', (e) => {
        if (AllObjectHas("dimensions.autoFont", OBJTypes)) {
          for (let i = 0; i < objects.length; i++) {
            objects[i].style.fontSize = Math.round(e.target.value * 6.5) / 10 + 'px';
          }
        }
      });
    }
    if (AllObjectHas("dimensions.height", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].dimensions.height.name);
      DropDownAddNumberProp(d, objects, ["style", "height"], 1, 'px', 0, parseInt(ID("editor").style.height) * 2);
    }
    if (AllObjectHas("dimensions.width", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].dimensions.width.name);
      DropDownAddNumberProp(d, objects, ["style", "width"], 1, 'px', 0, parseInt(ID("editor").style.width) * 2);
    }
    if (AllObjectHas("dimensions.minWidth", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].dimensions.minWidth.name);
      DropDownAddNumberProp(d, objects, ["style", "minWidth"], 1, 'px', 0, parseInt(ID("editor").style.width) * 2);
    }
    if (AllObjectHas("dimensions.fontSize", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].dimensions.fontSize.name);
      DropDownAddNumberProp(d, objects, ["style", "fontSize"], 1, 'px', 0, parseInt(objects[0].style.height) * 0.65, '', (e) => {
        if (objects.length == 1) {
          e.target.setAttribute('max', Math.round(parseInt(objects[0].style.height) * 0.65));
        }
        else {
          e.target.removeAttribute('max');
        }

      });
    }
    if (AllObjectHas("dimensions.rate", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].dimensions.rate.name);
      DropDownAddNumberProp(d, objects, ["style", "transform"], 0.01, ')', 0, Infinity, 'scaleX(');
    }

    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }

  if (AllObjectHas("special", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].special.name, true);
    if (AllObjectHas("special.fontWeight", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].special.fontWeight.name);
      DropDownAddNumberProp(d, objects, ["style", "fontWeight"], 100, '', 4, 7);
    }
    if (AllObjectHas("special.decimals", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].special.decimals.name);
      DropDownAddNumberProp(d, objects, ["dataset", "dec"], 1, '', 0, 8, '', HandleEntryPlaceholder);
    }
    if (AllObjectHas("special.zeros", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].special.zeros.name);
      DropDownAddNumberProp(d, objects, ["dataset", "zeros"], 1, '', 0, 8, '');
    }
    if (AllObjectHas("special.unit", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].special.unit.name);
      DropDownAddSimpleTextProp(d, objects, ["dataset", "unit"], '.{0,5}', HandleEntryPlaceholder);
    }
    if (AllObjectHas("special.borderRadius", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].special.borderRadius.name);
      DropDownAddNumberProp(d, objects, ["style", "borderRadius"], 1, 'px', 0, Infinity);
    }
    if (AllObjectHas("special.blink", OBJTypes)) {
      DropDownAddBoolProp(wuiObjects[OBJTypes[0]].special.blink.name, d, objects, ["dataset", "blink"]);
    }
    if (AllObjectHas("special.script", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].special.script.name);
      DropDownAddMultilineTextProp(d, objects, ["dataset", "script"], '');
    }
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }

  if (AllObjectHas("colors", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].colors.name, true);
    if (AllObjectHas("colors.fontColor", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].colors.fontColor.name);
      DropDownAddColorProp(d, objects, ["style", "color"]);
    }
    if (AllObjectHas("colors.bgColor", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].colors.bgColor.name);
      DropDownAddColorProp(d, objects, ["style", "backgroundColor"], (e) => {
        for (let i = 0; i < objects.length; i++) {
          if (objects[i].dataset.objType == 'alarmwindow') {
            objects[i].children[0].children[0].style.backgroundColor = e.target.value;
          }
          else if (objects[i].dataset.objType == 'bar') {
            objects[i].dataset.barColor = e.target.value;
          }
        }
      });
    }
    if (AllObjectHas("colors.onColor", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].colors.onColor.name);
      DropDownAddColorProp(d, objects, ["dataset", "onColor"], (e) => {
        for (let i = 0; i < objects.length; i++) {
          objects[i].style.backgroundColor = e.target.value;
        }
      });
    }
    if (AllObjectHas("colors.offColor", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].colors.offColor.name);
      DropDownAddColorProp(d, objects, ["dataset", "offColor"], (e) => {
        for (let i = 0; i < objects.length; i++) {
          objects[i].style.backgroundColor = e.target.value;
        }
      });
    }
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }

  if (AllObjectHas("simpleText", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].simpleText.name, true);
    DropDownAddHeader(d, "");
    if (wuiObjects[OBJTypes[0]].simpleText.subElement == undefined) {
      DropDownAddSimpleTextProp(d, objects, ["innerHTML"], '.{0,}');
    }
    else {
      DropDownAddSimpleTextProp(d, objects, ["firstChild", "innerHTML"], '.{0,}');
    }
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }
  if (AllObjectHas("multilineText", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].multilineText.name, true);
    DropDownAddHeader(d, "");
    DropDownAddMultilineTextProp(d, objects, ["innerHTML"]);
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }

  if (objects.length == 1 && AllObjectHas("headerText", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].headerText.name, true);
    DropDownAddHeader(d, "Fejlécek:");
    var ths = objects[0].querySelectorAll('th');
    let inp = DropDownAddMultilineTextProp(d, objects, [], '', '', (e) => {
      let lines = e.target.value.split('\n');
      let i = 0;
      for (let th of ths) {
        th.innerHTML = lines[i] != undefined ? lines[i] : "";
        i++;
      }
    });
    inp.value = "";
    for (let th of ths) {
      inp.value += th.innerHTML + "\n";
    }
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }
  if (objects.length == 1 && AllObjectHas("addText", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].addText.name, true);
    DropDownAddHeader(d, "");
    let bu = document.createElement('button');
    bu.appendChild(document.createTextNode("Üzenet hozzáadása"));
    bu.dataset.tag = objects[0];
    bu.setAttribute('id', "messageButton");
    bu.onclick = (e) => {
      AddAlarmText(objects[0].id);
    }
    d.appendChild(bu);
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }
  if (objects.length == 1 && AllObjectHas("alarmText", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].alarmText.name, true);
    let bu = document.createElement('button');
    bu.appendChild(document.createTextNode("Mozgatás FEL"));
    bu.onclick = (e) => {
      MoveAlarmText(objects[0], 'up');
    }
    let bu2 = document.createElement('button');
    bu2.appendChild(document.createTextNode("Mozgatás LE"));
    bu2.onclick = (e) => {
      MoveAlarmText(objects[0], 'down');
    }
    let bu3 = document.createElement('button');
    bu3.appendChild(document.createTextNode("Duplikálás"));
    bu3.onclick = (e) => {
      let newat = objects[0].cloneNode(true);
      newat.setAttribute('id', 'obj_' + GetNewId());
      objects[0].after(newat);
      UpdateSelectOtions();
    }
    bu.className = "atbu";
    bu2.className = "atbu";
    bu3.className = "atbu";
    d.appendChild(bu);
    d.appendChild(document.createElement("br"));
    d.appendChild(bu2);
    d.appendChild(document.createElement("br"));
    d.appendChild(document.createElement("br"));
    d.appendChild(bu3);
    d.appendChild(document.createElement("br"));
    DropDownAddBoolProp('Hangjelzés', d, objects, ["dataset", "sound"]);
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }


  if (AllObjectHas("tagConnection", OBJTypes)) {
    var d = CreateDropDown(wuiObjects[OBJTypes[0]].tagConnection.name, true);
    DropDownAddHeader(d, "Válasszon:");
    /** @type {any} */
    let newProp = document.createElement("INPUT");
    newProp.setAttribute("type", "text");
    newProp.setAttribute("list", "taglist");
    newProp.setAttribute("id", "taglistinput");
    newProp.setAttribute("autocomplete", "off");
    newProp.style.fontWeight = "bold";
    if (objects.length == 1) {
      newProp.value = objects[0].dataset.tagConnection;
    }
    else {
      newProp.value = GetCommon(["dataset", "tagConnection"], objects);
      newProp.placeholder = "Változó megadása";
    }
    newProp.dataset.initvalue = newProp.value;
    newProp.oninput = (e) => {
      if (e.target.value == OnlyDatalistValue(e.target)) {
        e.target.dataset.initvalue = e.target.value;
        e.target.style.fontWeight = "bold";
        e.target.style.color = "darkgreen";
        for (let i = 0; i < objects.length; i++) {
          objects[i].dataset.tagConnection = e.target.value;
        }
      }
      else {
        e.target.style.fontWeight = "normal";
        e.target.style.color = "darkred";
      }
      if (e.key == "Enter" || e.key == "Escape") e.target.blur();
      if (e.target.value.length) {
        if (ID('writeEnableCB')) {
          ID('writeEnableCB').removeAttribute('disabled');
        }
      }
      else {
        if (ID('writeEnableCB')) {
          ID('writeEnableCB').setAttribute('disabled', 'disabled');
        }
      }
    };

    let bu = document.createElement('button');
    bu.appendChild(document.createTextNode("..."));
    bu.setAttribute("id", "taglistbutton");
    bu.onclick = () => {
      TagSelect(ID('taglistinput'));
    }
    d.appendChild(newProp);
    d.appendChild(bu);
    d.appendChild(document.createElement("br"));

    if (AllObjectHas("tagConnection.expression", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].tagConnection.expression.name);
      DropDownAddSimpleTextProp(d, objects, ["dataset", "expression"], '.{0,100}', (e) => {
        e.target.style.color = ExpressionTest(e.target.value) ? "darkgreen" : "red";
      });
    }

    if (AllObjectHas("tagConnection.expressionForValue", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].tagConnection.expressionForValue.name);
      DropDownAddSimpleTextProp(d, objects, ["dataset", "expressionForValue"], '.{0,100}', (e) => {
        e.target.style.color = ExpressionTest(e.target.value, true) ? "darkgreen" : "red";
      });
    }

    if (AllObjectHas("tagConnection.setValue", OBJTypes)) {
      DropDownAddHeader(d, wuiObjects[OBJTypes[0]].tagConnection.setValue.name);
      DropDownAddNumberProp(d, objects, ["value"]);
    }

    if (AllObjectHas("tagConnection.neg", OBJTypes)) {
      DropDownAddBoolProp(wuiObjects[OBJTypes[0]].tagConnection.neg.name, d, objects, ["dataset", "neg"])
    }

    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }

  if (objects.length == 1) {
    let cssEditButton = document.createElement("BUTTON");
    cssEditButton.setAttribute('type', 'button');
    cssEditButton.innerHTML = "CSS szerkesztése...";
    cssEditButton.onclick = () => {
      EditCSS();
    }
    ID("prop").appendChild(cssEditButton);
  }

  if (AllObjectHas("writeable", OBJTypes)) {
    ID("prop").appendChild(document.createElement('hr'));
    var d = CreateDropDown("Átírható", (objects[0].dataset.writeable == 'true'));
    /** @type {any} */
    let en = DropDownAddBoolProp('Engedélyezés', d, objects, ["dataset", "writeable"], () => {
      if (objects.length == 1) {
        SelectionChanged();
      }
    });
    en.id = "writeEnableCB";
    DropDownAddHeader(d, "Minimum érték:");
    /** @type {any} */
    let minInp = DropDownAddNumberProp(d, objects, ["dataset", "min"], 1, '', -Infinity, Infinity, '', (e) => {
      minInp.max = maxInp.value;
      maxInp.min = minInp.value;
    });
    DropDownAddHeader(d, "Maximum érték:");
    /** @type {any} */
    let maxInp = DropDownAddNumberProp(d, objects, ["dataset", "max"], 1, '', -Infinity, Infinity, '', (e) => {
      minInp.max = maxInp.value;
      maxInp.min = minInp.value;
    });
    if (!en.checked && objects.length == 1) {
      minInp.setAttribute('disabled', 'disabled');
      maxInp.setAttribute('disabled', 'disabled');
      d.children[0].classList.add('inactive');
      maxInp.classList.add('inactive');
      minInp.classList.add('inactive');
    }
    if (objects[0].dataset.tagConnection.length == 0 && objects.length == 1) {
      en.setAttribute('disabled', 'disabled');
      en.checked = false;
    }
    minInp.max = maxInp.value;
    maxInp.min = minInp.value;
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }

  if (AllObjectHas("warningLevels", OBJTypes)) {
    var d = CreateDropDown("Figyelmeztetés HA", false);
    DropDownAddHeader(d, "Kisebb mint:");
    DropDownAddNumberProp(d, objects, ["dataset", "lo"]);
    DropDownAddHeader(d, "Nagyobb mint:");
    DropDownAddNumberProp(d, objects, ["dataset", "hi"]);
    if (d.children[1]) {
      ID("prop").appendChild(d);
    }
  }
  ScrollEntries(1);
}



function UnselectAll() {
  var objs = document.querySelectorAll('[data-obj-type]');
  for (const child of objs) {
    child.className = '';
  }
  ID("selectedTag").value = null;
  ID("prop").innerHTML = "";
  SelectionChanged();
  ScrollEntries(1);
}


function SelectAll() {
  UnselectAll();
  for (const child of ID("editor").children) {
    child.className = "selectedObj";
  }
  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (ID(ID("selectedTag").options[i].value).dataset.objType != "alarmtext") {
      ID("selectedTag").options[i].selected = true;
    }
  }
  SelectionChanged();
}


function ArrowMove(/** @type {string} */dir) {
  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (ID("selectedTag").options[i].selected == true) {
      if (ID(ID("selectedTag").options[i].value).dataset.objType != "alarmtext") {
        if (dir == "up") {
          ID(ID("selectedTag").options[i].value).style.top = (parseInt(ID(ID("selectedTag").options[i].value).style.top) - raster) + "px";
        }
        if (dir == "down") {
          ID(ID("selectedTag").options[i].value).style.top = (parseInt(ID(ID("selectedTag").options[i].value).style.top) + raster) + "px";
        }
        if (dir == "left") {
          ID(ID("selectedTag").options[i].value).style.left = (parseInt(ID(ID("selectedTag").options[i].value).style.left) - raster) + "px";
        }
        if (dir == "right") {
          ID(ID("selectedTag").options[i].value).style.left = (parseInt(ID(ID("selectedTag").options[i].value).style.left) + raster) + "px";
        }
      }
      else {
        MoveSelectionAlarmText(ID(ID("selectedTag").options[i].value), dir);
        break;
      }
    }
  }
  DocumentChanged();
}


function MakeObjectToDrag(/** @type {string} */id) {
  if (!id) return;
  var selected = false;

  for (let i = 0; i < ID("selectedTag").options.length; i++) {
    if (ID("selectedTag").options[i].selected == true) {
      if (ID(ID("selectedTag").options[i].value).id == id) {
        selected = true;
        break;
      }
    }
  }

  if (selected) {
    dragobj = ID(id);
    ID("editor").onmousedown = StartMove;
    ID("editor").onmouseup = Drop;
    ID("editor").onmousemove = Moving;
    ID("editor").ontouchstart = StartMove;
    ID("editor").ontouchend = Drop;
    ID("editor").ontouchmove = Moving;
  }
}


function StartMove(/** @type {MouseEvent} */e) {
  if (dragobj) {
    GetCursorPos(e);
    i1 = 0;
    h1 = 0;

    i1 = Math.round((cursor.x - (dragobj.offsetLeft) * zoom) / raster) * raster;
    h1 = Math.round((cursor.y - (dragobj.offsetTop) * zoom) / raster) * raster;
  }
}


function Drop() {
  if (dragobj) {
    dragobj = null;
    ID("editor").onmousedown = null;
    ID("editor").onmouseup = null;
    ID("editor").onmousemove = null;
    ID("editor").ontouchstart = null;
    ID("editor").ontouchend = null;
    ID("editor").ontouchmove = null;
    AddSelectorRectangle(ID('editor'));
    DocumentChanged();
  }
}


function GetCursorPos(e) {
  if (e.pageX || e.pageY) {
    cursor.x = e.pageX;
    cursor.y = e.pageY;
  }
  else if (e.clientX || e.clientY) {
    var de = document.documentElement;
    var db = document.body;
    cursor.x = e.clientX +
      (de.scrollLeft || db.scrollLeft) - (de.clientLeft || 0);
    cursor.y = e.clientY +
      (de.scrollTop || db.scrollTop) - (de.clientTop || 0);
  }
  else {
    cursor.x = e.touches[0].clientX;
    cursor.y = e.touches[0].clientY;
  }
  return cursor;
}


function Moving(e) {
  GetCursorPos(e);
  if (dragobj) {
    endOfDrag = true;

    let preX = parseInt(dragobj.style.left);
    let preY = parseInt(dragobj.style.top);

    dragobj.style.top = ((Math.round((cursor.y - h1) / (raster * zoom)) * (raster * zoom)) / zoom) + 'px';
    dragobj.style.left = ((Math.round((cursor.x - i1) / (raster * zoom)) * (raster * zoom)) / zoom) + 'px';

    var diffX = parseInt(dragobj.style.left) - preX;
    var diffY = parseInt(dragobj.style.top) - preY;

    for (let i = 0; i < ID("selectedTag").options.length; i++) {
      if (ID("selectedTag").options[i].selected == true && ID(ID("selectedTag").options[i].value) != dragobj) {
        ID(ID("selectedTag").options[i].value).style.left = (parseInt(ID(ID("selectedTag").options[i].value).style.left) + diffX) + 'px';
        ID(ID("selectedTag").options[i].value).style.top = (parseInt(ID(ID("selectedTag").options[i].value).style.top) + diffY) + 'px';
      }
    }

  }
}


function RgbToHex(/** @type {string} */rgb) {
  var rgbh = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

  function HexCode(i) {
    return ("0" + parseInt(i).toString(16)).slice(-2);
  }

  if (rgbh != null && rgbh.length > 3) {
    return "#" + HexCode(rgbh[1]) + HexCode(rgbh[2]) + HexCode(rgbh[3]);
  } else {
    return rgb;
  }
}


function UploadGui(n) {
  UpdateCursor(true);
  var trans = ID("editor").style.transform;
  ID("editor").style.transform = "";
  UnselectAll();
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "", true);

  xhr.onload = () => {
    if (JSON.parse(xhr.responseText) && JSON.parse(xhr.responseText).state == 'ok') {
      Toast('Mentés sikeres.', 'ok');
      ID("editor").style.transform = trans;
      window.onbeforeunload = null;
    }
    else {
      Toast('Mentés SIKERTELEN!', 'error');
      ID("editor").style.transform = trans;
    }
  }
  const formData = new FormData();
  const blob = new Blob([ID("editor").outerHTML], { type: "text/html" });

  formData.append('name', n);
  formData.append('data', blob);
  xhr.send(formData);
}


function GetFileDialog(/** @type {string} */mime) {
  return new Promise((resolve) => {
    var file = document.createElement('input');
    file.setAttribute('type', 'file');
    file.setAttribute('accept', mime);
    file.click();
    const onChange = (e) => {
      resolve(e.target.files[0]);
    };
    file.addEventListener('change', onChange);
  });
}


function CheckNum(e) {
  if (e.target.getAttribute('type') == "number") return true;
  if (String(e.target.value).match(/[^\d\.\,\+\-]/)) {
    e.target.value = '';
    return false;
  }
  else {
    return true;
  }
}


function OnlyDatalistValue(inp) {
  var list = inp.list;
  for (let i = 0; i < list.children.length; i++) {
    if (list.children[i].value == inp.value) return inp.value;
  }
  if (inp.value.length == 0) {
    return "";
  }
  return inp.dataset.initvalue;
}


function TagSelect(inp) {
  var options = inp.list.options;
  const win = document.createElement('div');
  win.setAttribute("id", "tagselect");
  ID('maindiv').appendChild(win);
  win.style.top = (inp.offsetTop - win.offsetHeight - 2) + 'px';
  win.style.left = inp.offsetLeft + 'px';
  /** @type {any} */
  const list = document.createElement('div');
  const input = document.createElement('input');
  const xb = document.createElement('button');
  win.appendChild(input);
  win.appendChild(list);
  win.appendChild(xb);
  xb.appendChild(document.createTextNode("X"));
  xb.onclick = () => { ID('tagselect').remove(); }
  input.focus();
  input.value = inp.value;
  input.select();
  var tags = [];
  for (let i = 0; i < options.length; i++) {
    if (options[i].dataset.type !== undefined) {
      tags.push({ value: options[i].value, type: options[i].dataset.type, comment: options[i].dataset.comment });
      //Javítva objektumra
    }
    else tags.push({ value: options[i].value, type: "" });
  }
  list.innerHTML = "";
  let l = Hits("", tags);
  for (let i = 0; i < l.length; i++) list.appendChild(l[i]);
  input.onkeyup = (/** @type {any} */e, Tags = tags, List = list) => {
    if (e.key.match('Arrow')) return;
    List.innerHTML = "";
    let l = Hits(e.target.value, Tags);
    for (let i = 0; i < l.length; i++) List.appendChild(l[i]);
  }
  input.onblur = () => {
    setTimeout(() => { input.focus(); }, 10);
  }
  input.onkeydown = (/** @type {any} */e, Inp = inp) => {
    e.target.style.color = 'black';
    e.target.style.fontWeight = 'normal';
    if (e.key == 'ArrowDown') {
      e.preventDefault();
      let list = e.target.parentNode.children[1];
      let kijelol = -1;
      for (let i = 0; i < list.children.length; i++) {
        if (list.children[i].dataset.s == 1) {
          list.children[i].dataset.s = 0;
          kijelol = i;
          break;
        }
      }
      if ((kijelol + 1) < list.children.length) {
        list.children[kijelol + 1].dataset.s = 1;
        list.children[kijelol + 1].scrollIntoView();
      }
      else {
        list.children[list.children.length - 1].dataset.s = 1;
      }
    }
    if (e.key == 'ArrowUp') {
      e.preventDefault();
      /** @type {any} */
      let list = e.target.parentNode.children[1];
      let kijelol = list.children.length;
      for (let i = 0; i < list.children.length; i++) {
        if (list.children[i].dataset.s == 1) {
          list.children[i].dataset.s = 0;
          kijelol = i;
          break;
        }
      }
      if (((kijelol - 1) >= 0) && kijelol != list.children.length) {
        list.children[kijelol - 1].dataset.s = 1;
        list.children[kijelol - 1].scrollIntoView();
      }
    }
    if (e.key == 'Escape') {
      e.target.parentNode.remove();
    }
    if (e.key == 'Enter') {
      let Set = 0;
      let Includes = 0;
      for (let i = 0; i < list.children.length; i++) {
        if (list.children[i].dataset.s == 1) {
          list.children[i].dataset.s = 0;
          e.target.value = list.children[i].dataset.tag;
          e.target.style.color = 'darkblue';
          e.target.style.fontWeight = 'bold';
          Set++;
          break;
        }
        if ((list.children[i].dataset.tag == e.target.value) && e.target.value.length > 0) Includes = 1;
      }
      if ((Set == 0) && Includes) {
        Inp.value = e.target.value;
        Inp.dataset.initvalue = e.target.value;
        var Event = {};
        Event.target = Inp;
        Inp.oninput(Event);
        e.target.parentNode.remove();
      }
    }
  }
  win.ondblclick = (/** @type {any} */e) => {//ha egy felsorolt tegre duplakattintunk, azonnal beírjuk:
    if (e.target.dataset.tag == undefined) return;
    inp.value = e.target.dataset.tag;
    inp.dataset.initvalue = e.target.dataset.tag;
    var Event = {};
    Event.target = inp;
    inp.oninput(Event);
    win.remove();
  };
}


function Hits(pattern, list) {
  let ret = [];
  list = list.sort((n, np1) => {
    return n.value.localeCompare(np1.value);
  });
  var pos = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].value.toUpperCase().match(pattern.toUpperCase())) {
      pos = list[i].value.toUpperCase().indexOf(pattern.toUpperCase());
      let p = document.createElement('p');
      let b = document.createElement('b');
      let s = document.createElement('span');
      let c = document.createElement('small');
      p.appendChild(document.createTextNode(list[i].value.slice(0, pos)));
      b.appendChild(document.createTextNode(list[i].value.slice(pos, pos + pattern.length)));
      p.appendChild(b);
      p.appendChild(document.createTextNode(list[i].value.slice(pos + pattern.length) + ' '));
      if (list[i].type.length > 0) {
        s.appendChild(document.createTextNode(list[i].type));
        let t = list[i].type;
        if (t.match(/float/i)) s.style.color = s.style.outlineColor = "darkgreen";
        if (t.match(/int/i)) s.style.color = s.style.outlineColor = "blue";
        if (t.match(/bit/i)) s.style.color = s.style.outlineColor = "darkred";
      }
      c.appendChild(document.createTextNode(list[i].comment));
      p.appendChild(c);
      p.appendChild(s);
      p.dataset.tag = list[i].value;
      p.onmousedown = p.onclick = (/** @type {any} */e) => {
        for (let i = 0; i < e.target.parentNode.children.length; i++) {
          e.target.parentNode.children[i].dataset.s = 0;
        }
        e.target.dataset.s = 1;
      }
      b.onmousedown = b.onclick = (/** @type {any} */e) => {//kattintás továbbítása a bekezdésnek:
        e.target.parentNode.click();
      }

      ret.push(p);
    }
  }
  return ret;
}


function RasterToggle(/** @type {HTMLImageElement} */bt) {
  if (bt.src.match('raster10')) {
    raster = 1;
    bt.src = 'img/raster1.png';
  }
  else {
    raster = 10;
    bt.src = 'img/raster10.png';
  }
}


function ScrollEntries(delay = 1000) {
  setTimeout(() => {
    for (let child of ID("editor").children) {
      if (child.dataset.objType == "entry") {
        child.scrollLeft = child.scrollWidth;
      }
    }
  }, delay)
}


function UpdateDatalist() {
  let formData = new FormData();
  formData.append('taglist', 'get')
  fetch('', {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/xml',
    },
  })
    .then(response => response.text())
    .then(response => {
      ID('taglist').innerHTML = response;
    })
    .catch(error => {
      console.log(error);
      DConfirm("Hiba történt a tag-lista frissítésekor!", 'Bezár', '', 'tomato', '');
    });
}


function MoveAlarmText(/** @type {HTMLElement} */at, /** @type {string} */dir) {
  if (dir == 'up' && at.previousElementSibling) {
    var prev = at.previousElementSibling;
    at.parentNode.removeChild(at);
    prev.before(at);
  }

  if (dir == 'down' && at.nextElementSibling) {
    var next = at.nextElementSibling;
    at.parentNode.removeChild(at);
    next.after(at);
  }
}


function MoveSelectionAlarmText(at, /** @type {string} */dir) {
  if (dir == 'up' && at.previousElementSibling) {
    at.previousElementSibling.click();
  }

  if (dir == 'down' && at.nextElementSibling) {
    at.nextElementSibling.click();
  }
}


function CreateDropDown(/** @type {string} */name, isOpen = true) {
  const details = document.createElement("details");
  if (isOpen) {
    details.setAttribute('open', 'open');
  }
  details.appendChild(document.createElement('summary')).appendChild(document.createTextNode(name));
  return details;
}


function DropDownAddHeader(/** @type {HTMLDetailsElement | HTMLSpanElement} */dropDown, /** @type {string} */name, isBlock = true) {
  dropDown.appendChild(document.createElement('span')).innerHTML = name;
  if (isBlock) dropDown.appendChild(document.createElement("br"));
}


function DropDownAddNumberProp(dropDown, objects, properties, factor = 1, postfix = "", min = -Infinity, max = Infinity, prefix = "", callback = () => { }) {
  const newProp = /** @type {HTMLInputElement} */ (document.createElement("INPUT"));
  newProp.setAttribute("type", "number");
  if (min != -Infinity) {
    newProp.setAttribute("min", String(min));
  }
  if (min != Infinity) {
    newProp.setAttribute("max", String(max));
  }

  try {
    if (objects.length == 1) {
      if (properties.length == 2) {
        if(properties[0] == "style" && objects[0][properties[0]][properties[1]].match(/ /g) != null && objects[0][properties[0]][properties[1]].match(/ /g).length > 1){
          newProp.value = "";
        }
        else{
          newProp.value = String(parseFloat((parseFloat((objects[0][properties[0]][properties[1]]).replaceAll(/[^0-9\-\.]/g,''))/factor).toFixed(2)));
        }
      }
      if (properties.length == 1) {
        newProp.value = String(parseFloat((parseFloat((objects[0][properties[0]])
          .replaceAll(/[^0-9\-\.]/g, '')) / factor).toFixed(2)))
          ;
      }
    }
    else {
      newProp.value = String(parseFloat((parseFloat((GetCommon(properties, objects))
        .replaceAll(/[^0-9\-\.]/g, '')) / factor).toFixed(2)));
      newProp.placeholder = "Eltérő";
    }

  }
  catch (err) {
    newProp.value = "";
  }

  newProp.oninput = newProp.onmousedown = (/** @type {any} */e) => {
    if (!CheckNum(e)) return;
    if (e.target.checkValidity()) {
      for (let i = 0; i < objects.length; i++) {
        if (properties.length == 2) {
          objects[i][properties[0]][properties[1]] = prefix + parseFloat((e.target.value * factor).toFixed(2)) + postfix;
        }
        if (properties.length == 1) {
          objects[i][properties[0]] = prefix + parseFloat((e.target.value * factor).toFixed(2)) + postfix;
        }
      }
    }
    
    // @ts-ignore
    callback(e, objects);
    DocumentChanged();
  };
  dropDown.appendChild(newProp);
  dropDown.appendChild(document.createElement("br"));
  return newProp;
}


function DropDownAddSimpleTextProp(dropDown, objects, properties, pattern = '.*', callback = () => { }) {
  const newProp = /** @type {HTMLInputElement} */ (document.createElement("INPUT"));
  newProp.setAttribute("type", "text");
  newProp.setAttribute("pattern", pattern);

  if (objects.length == 1) {
    if (properties.length == 2) {
      newProp.value = objects[0][properties[0]][properties[1]];
    }
    if (properties.length == 1) {
      newProp.value = objects[0][properties[0]]
    }
  }
  else {
    newProp.value = GetCommon(properties, objects);
    newProp.placeholder = "Eltérő";
  }
  newProp.oninput = (e) => {
    if (newProp.checkValidity()) {
      for (let i = 0; i < objects.length; i++) {
        if (properties.length == 2) {
          objects[i][properties[0]][properties[1]] = newProp.value;
        }
        if (properties.length == 1) {
          objects[i][properties[0]] = newProp.value;
        }
      }
    }
    // @ts-ignore
    callback(e, objects);
    DocumentChanged();
  };
  dropDown.appendChild(newProp);
  dropDown.appendChild(document.createElement("br"));
  return newProp;
}


function DropDownAddMultilineTextProp(dropDown, objects, properties, newLineSet = '<br>', /** @type {RegExp|String} */newLinePattern = new RegExp(/<[^>]*?br[^>]*?>/i), callback = () => { }) {
  const newProp = document.createElement("textarea");
  newProp.setAttribute('autocorrect', "off");
  newProp.spellcheck = false;

  let html = "";
  if (objects.length == 1) {
    if (properties.length == 2) {
      html = objects[0][properties[0]][properties[1]];
    }
    if (properties.length == 1) {
      html = objects[0][properties[0]]
    }
  }
  else {
    html = "";
    newProp.placeholder = "Beírhat közös tartalmat";
  }
  newProp.value = html.split(newLinePattern).join("\n");
  newProp.oninput = (e) => {
    if (newProp.checkValidity()) {
      for (let i = 0; i < objects.length; i++) {
        if (properties.length == 2) {
          objects[i][properties[0]][properties[1]] = newProp.value.split("\n").join(newLineSet);
        }
        if (properties.length == 1) {
          objects[i][properties[0]] = newProp.value.split("\n").join(newLineSet);
        }
      }
    }
    // @ts-ignore
    callback(e, objects);
    DocumentChanged();
  };
  dropDown.appendChild(newProp);
  dropDown.appendChild(document.createElement("br"));
  return newProp;
}


function DropDownAddColorProp(dropDown, objects, properties, callback = () => { }) {
  const newProp = document.createElement("button");
  newProp.innerHTML = " ";
  newProp.style.width = "3rem";
  newProp.style.height = "1rem";

  if (objects.length == 1) {
    if (properties.length == 2) {
      newProp.value = objects[0][properties[0]][properties[1]];
    }
    if (properties.length == 1) {
      newProp.value = objects[0][properties[0]]
    }
    if (IsTransparent(objects[0][properties[0]][properties[1]])) {
      newProp.style.background = atlo;
    }
    else {
      newProp.style.backgroundColor = objects[0][properties[0]][properties[1]];
    }
  }
  else {
    newProp.value = GetCommon(properties, objects);
    if (IsTransparent(GetCommon(properties, objects))) {
      newProp.style.background = atlo;
    }
    else {
      newProp.style.backgroundColor = GetCommon(properties, objects);
    }
  }

  newProp.onclick = (/** @type {any} */e) => {
    ColorPicker(e.target.value, (val) => {
      e.target.value = val;
      if (val != "") {
        e.target.style.background = "";
        e.target.style.backgroundColor = val;
      }
      else {
        e.target.style.background = atlo;
      }

      for (let i = 0; i < objects.length; i++) {
        if (properties.length == 2) {
          objects[i][properties[0]][properties[1]] = RgbToHex(val);
        }
        if (properties.length == 1) {
          objects[i][properties[0]] = RgbToHex(val);
        }
      }
      // @ts-ignore
      callback(e, objects);
      DocumentChanged();
    });
  };
  dropDown.appendChild(newProp);
  dropDown.appendChild(document.createElement("br"));
  return newProp;
}


function DropDownAddBoolProp(labelText, dropDown, objects, properties, callback = () => { }) {
  const span = document.createElement('span');
  DropDownAddHeader(span, labelText, false);
  const newProp = /** @type {HTMLInputElement} */ (document.createElement("INPUT"));
  newProp.setAttribute("type", "checkbox");

  if (objects.length == 1) {
    newProp.checked = (objects[0][properties[0]][properties[1]] == "true");
  }
  newProp.oninput = (/** @type {any} */e) => {
    for (let i = 0; i < objects.length; i++) {
      objects[i][properties[0]][properties[1]] = e.target.checked;
    }
    // @ts-ignore
    callback(e, objects);
    DocumentChanged();
  };
  span.appendChild(newProp);
  dropDown.appendChild(span);
  return newProp;
}


function HandleEntryPlaceholder(e, objects) {
  for (let i = 0; i < objects.length; i++) {
    let entry = objects[i];
    let dec = isNaN(parseInt(entry.dataset.dec)) ? 0 : parseInt(entry.dataset.dec);
    let unit = entry.dataset.unit;
    let entryText = dec > 0 ? ("#".repeat(9 - dec) + '.' + "#".repeat(dec)) : "#".repeat(9);
    entryText += unit;
    entry.setAttribute('value', entryText);
    entry.value = entryText;
  }
}

function SetPageProp() {
  if (!ID('editor')) return;
  var enHamburger = true;
  var resolution = '1920x1080';

  if (ID('editor').dataset.hamburger != undefined && ID('editor').dataset.hamburger == 'false') {
    enHamburger = false;
  }

  resolution =
    parseInt(window.getComputedStyle(ID('editor')).width)
    + 'x'
    + parseInt(window.getComputedStyle(ID('editor')).height)
  ;

  const d = document.createElement('dialog');
  d.style.lineHeight = "10px";
  d.style.width = "300px";
  d.style.minWidth = "190px";
  d.style.padding = "1rem";
  d.style.boxSizing = "content-box";
  const title = document.createElement('p');
  title.style.textAlign = 'center';
  title.style.fontSize = '1.2rem';
  title.appendChild(document.createTextNode("Oldaltulajdonságok"));
  d.appendChild(title);
  d.appendChild(document.createElement('br'));

  const lab1 = document.createElement('p');
  lab1.style.textAlign = 'left';
  lab1.style.fontSize = '1rem';
  lab1.appendChild(document.createTextNode("Oldalméret:"));
  d.appendChild(lab1);

  const sizeSel = document.createElement('select');
  sizeSel.style.padding = "5px";
  sizeSel.style.boxSizing = "border-box";
  sizeSel.style.fontSize = "1.1rem";
  sizeSel.style.width = "100%";
  const op1 = document.createElement('option');
  const op2 = document.createElement('option');
  const op3 = document.createElement('option');
  const op4 = document.createElement('option');
  op1.appendChild(document.createTextNode("2560x1440"));
  op1.setAttribute('value', "2560x1440");
  op2.appendChild(document.createTextNode("1920x1080"));
  op2.setAttribute('value', "1920x1080");
  op3.appendChild(document.createTextNode("1280x720"));
  op3.setAttribute('value', "1280x720");
  op4.appendChild(document.createTextNode("640x360"));
  op4.setAttribute('value', "640x360");
  sizeSel.appendChild(op1);
  sizeSel.appendChild(op2);
  sizeSel.appendChild(op3);
  sizeSel.appendChild(op4);
  d.appendChild(sizeSel);
  d.appendChild(document.createElement('br'));
  d.appendChild(document.createElement('br'));

  const lab2 = document.createElement('p');
  lab2.style.textAlign = 'left';
  lab2.style.fontSize = '1rem';
  lab2.appendChild(document.createTextNode("Hamburger menü"));
  d.appendChild(lab2);

  const lab3 = document.createElement('label');
  lab3.style.textAlign = 'left';
  lab3.style.marginLeft = "1rem";
  lab3.style.fontSize = '0.9rem';
  lab3.appendChild(document.createTextNode("Engedélyezés: "));
  d.appendChild(lab3);

  const hambCb = document.createElement('input');
  hambCb.setAttribute('type', "checkbox");
  hambCb.style.width = "1.2rem";
  hambCb.style.height = "1.2rem";
  d.appendChild(hambCb);


  let options = sizeSel.options;
  for (let i = 0; i < options.length; i++) {
    if (options[i].value == resolution) {
      options[i].setAttribute('selected', 'selected');
      break;
    }
  }

  hambCb.checked = enHamburger;

  const ok = document.createElement('button');
  ok.innerText = "OK";
  ok.style.backgroundColor = "lightgreen";
  ok.style.width = "132px";
  ok.onclick = () => {
    ID("editor").dataset.hamburger = hambCb.checked;
    ID("editor").style.width = sizeSel.value.split('x')[0] + 'px';
    ID("editor").style.height = sizeSel.value.split('x')[1] + 'px';
    d.remove();
  }
  const cancel = document.createElement('button');
  cancel.innerText = "Mégsem";
  cancel.style.width = "132px";
  cancel.onclick = () => {
    d.remove();
  }
  d.appendChild(document.createElement('p'));
  d.appendChild(ok);
  d.appendChild(cancel);

  document.body.appendChild(d);
  d.showModal();
}


function CSSPrettify(css) {
  const keywords = [
    'animation-delay', 'animation-direction', 'animation-duration', 'animation-fill-mode', 'animation-iteration-count',
    'animation-name', 'animation-play-state', 'animation-range-end', 'animation-range-start', 'animation',
    'backdrop-filter', 'background-attachment', 'background-blend-mode', 'background-clip', 'background-color',
    'background-image', 'background-origin', 'background-position-x', 'background-position-y', 'background-position',
    'background-repeat', 'background-size', 'background', 'border-bottom-color', 'border-bottom-left-radius',
    'border-bottom-right-radius', 'border-bottom-style', 'border-bottom-width', 'border-left-color', 'border-left-style',
    'border-left-width', 'border-right-color', 'border-right-style', 'border-right-width', 'border-spacing', 'border-radius',
    'border-top-color', 'border-top-style', 'border-top-width', 'border-style', 'border-color', 'border-width',
    'border-image', 'border', 'bottom', 'box-shadow', 'box-sizing',
    'contain', 'content', 'cursor', 'display', 'filter', 'float', 'font-family', 'font-size', 'font-style', 'font-weight',
    'height', 'left', 'letter-spacing', 'margin', 'margin-block-end', 'margin-block-start', 'margin-bottom',
    'margin-inline-end', 'margin-inline-start', 'margin-left', 'margin-right', 'margin-top', 'margin-trim', 'max-height',
    'max-width', 'min-height', 'min-width', 'opacity', 'outline-color', 'outline', 'outline-offset', 'outline-style', 'outline-width',
    'overflow', 'overflow-x', 'overflow-y', 'padding', 'padding-block-end', 'padding-block-start', 'padding-bottom',
    'padding-inline-end', 'padding-inline-start', 'padding-left', 'padding-right', 'padding-top', 'position',
    'print-color-adjust', 'quotes', 'reading-flow', 'reading-order', 'resize', 'right', 'rotate', 'row-gap', 'scale',
    'stroke', 'text-align', 'text-decoration', 'text-indent', 'text-justify', 'text-orientation', 'text-overflow',
    'text-shadow', 'text-transform', 'top', 'transform-box', 'transform-origin', 'transform-style', 'transform',
    'transition-behavior', 'transition-delay', 'transition-duration', 'transition-property', 'transition-timing-function',
    'translate', 'vertical-align', 'visibility', 'white-space-collapse', 'white-space', 'widows', 'width', 'will-change',
    'word-break', 'word-spacing', 'z-index', 'zoom', 'color'
  ];
  const units = [
    'em', 'ex', '%', 'px', 'cm', 'mm', 'in', 'pt', 'pc', 'ch', 'rem', 'vw', 'vh', 'vmin', 'vmax', 'deg'
  ];
  const highlight1 = [
    'rgba(', 'rgb(', 'url(', 'var(', 'scaleX(', 'scaleY(', 'scale('
  ];
  const highlight2 = [
    'absolute', 'auto', 'block', 'black', 'bold', 'border-box', 'center', 'clip', 'col-resize', 'column', 'darkblue',
    'darkgray', 'darkgreen', 'darkorange', 'dimgray', 'dodgerblue', 'ellipsis', 'FiraCode', 'fixed', 'flex',
    'grabbing', 'gray', 'hidden', 'inline-block', 'italic', 'lavender', 'left', 'lightblue', 'lightgray', 'middle',
    'monospace', 'no-repeat', 'none', 'nowrap', 'pointer', 'red', 'relative', 'row', 'scroll', 'separate', 'sticky',
    'text-bottom', 'top', 'white', 'whitesmoke', 'solid', 'cyan', 'dotted', ')'
  ]

  for (let i = 0; i < keywords.length; i++) {
    css = css.replaceAll(keywords[i] + ':', `<span class="keyword">${keywords[i]}</span>:`);
  }

  for (let i = 0; i < units.length; i++) {
    css = css.replaceAll(new RegExp("([\\d.]+\\s*?)" + units[i] + "([^a-z<>-])", "g"), `<span class="unit">$1${units[i]}</span>$2`);
  }

  for (let i = 0; i < units.length; i++) {
    css = css.replaceAll(new RegExp("(\\d+);", "g"), `<span class="unit">$1</span>;`);
  }

  for (let i = 0; i < highlight1.length; i++) {
    css = css.replaceAll(' ' + highlight1[i], ` <span class="highlight">${highlight1[i]}</span>`);
  }

  for (let i = 0; i < highlight2.length; i++) {
    css = css.replaceAll(highlight2[i] + ';', `<span class="highlight">${highlight2[i]}</span>;`);
    css = css.replaceAll(' ' + highlight2[i] + ' ', ` <span class="highlight">${highlight2[i]}</span> `);
  }

  return css;

}

function CreateRange(node, chars, range) {
  if (!range) {
    range = document.createRange()
    range.selectNode(node);
    range.setStart(node, 0);
  }

  if (chars.count === 0) {
    range.setEnd(node, chars.count);
  } else if (node && chars.count > 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.length < chars.count) {
        chars.count -= node.textContent.length;
      } else {
        range.setEnd(node, chars.count);
        chars.count = 0;
      }
    } else {
      for (var lp = 0; lp < node.childNodes.length; lp++) {
        range = CreateRange(node.childNodes[lp], chars, range);

        if (chars.count === 0) {
          break;
        }
      }
    }
  }

  return range;
}

function SetCurrentCursorPosition(node, chars) {
  if (chars >= 0) {
    var selection = window.getSelection();

    var range = CreateRange(node.parentNode, { count: chars });

    if (range) {
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

function GetCaretPosition(element) {
  let position = 0;
  const isSupported = typeof window.getSelection !== "undefined";

  if (isSupported) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();

      // Kijelöljük a tartományt a div elejétől a kurzorig
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);

      // A kijelölt szöveg hossza adja meg a kurzor pozícióját
      position = preCaretRange.toString().length;
    }
  }
  return position;
}

function TestCssOk(/** @type {string} */CSStext) {
  CSStext = CSStext.replaceAll(/\n/g, '');
  var cssEntryes = CSStext.split(';');
  var isOk = true;
  for (let i = 0; i < cssEntryes.length; i++) {
    if (cssEntryes[i].match(/\S/) && CSS.supports(cssEntryes[i]) == false) isOk = false;
  }

  return isOk;
}

function AllObjectHas(prop, OBJTypes) {
  var has = true;
  if (prop.split('.').length == 1) {
    for (let i = 0; i < OBJTypes.length; i++) {
      has = wuiObjects[OBJTypes[i]][prop] != undefined ? has : false;
    }
  }
  else if (prop.split('.').length == 2) {
    for (let i = 0; i < OBJTypes.length; i++) {
      has = wuiObjects[OBJTypes[i]][prop.split('.')[0]][prop.split('.')[1]] != undefined ? has : false;
    }
  }
  else if (prop.split('.').length == 3) {
    for (let i = 0; i < OBJTypes.length; i++) {
      has = wuiObjects[OBJTypes[i]][prop.split('.')[0]][prop.split('.')[1]][prop.split('.')[2]] != undefined ? has : false;
    }
  }
  else {
    has = false;
  }

  return has;
}

function GetCommon(prop, objects) {
  var common = [];
  if (prop.length == 1) {
    for (let i = 0; i < objects.length; i++) {
      if (!common.includes(objects[i][prop[0]])) common.push(objects[i][prop]);
    }
  }
  else if (prop.length == 2) {
    for (let i = 0; i < objects.length; i++) {
      if (!common.includes(objects[i][prop[0]][prop[1]])) {
        common.push(objects[i][prop[0]][prop[1]]);
      }
    }
  }
  else if (prop.length == 3) {
    for (let i = 0; i < objects.length; i++) {
      if (!common.includes(objects[i][prop[0]][prop[1]][prop[2]])) {
        common.push(objects[i][prop[0]][prop[1]][prop[2]]);
      }
    }
  }
  else {
    return "";
  }
  return common.length == 1 ? common[0] : "";
}

function AddSelectorRectangle(element) {
  element.onmousedown = (e) => {
    if (ID('selectRectangle')) {
      ID('selectRectangle').remove();
    }
    var rect = element.getBoundingClientRect();
    var x = (e.clientX - rect.left) / zoom;
    var y = (e.clientY - rect.top) / zoom;
    const selectRectangle = document.createElement("DIV");
    selectRectangle.style.position = 'absolute';
    selectRectangle.style.top = y + 'px';
    selectRectangle.style.left = x + 'px';
    selectRectangle.style.width = '0px';
    selectRectangle.style.height = '0px';
    selectRectangle.style.backgroundColor = 'rgba(50,50,255,0.2)';
    selectRectangle.style.zIndex = "1000";
    selectRectangle.setAttribute('id', "selectRectangle");
    element.appendChild(selectRectangle);

    element.onmousemove = (e) => {
      rect = element.getBoundingClientRect();
      var nowX = (e.clientX - rect.left) / zoom;
      var nowY = (e.clientY - rect.top) / zoom;
      if (nowY - y >= 0) {
        selectRectangle.style.height = (nowY - y) + 'px';
        selectRectangle.style.top = y + 'px';
      }
      else {
        selectRectangle.style.top = nowY + 'px';
        selectRectangle.style.height = (y - nowY) + 'px'
      }
      if (nowX - x >= 0) {
        selectRectangle.style.width = (nowX - x) + 'px';
        selectRectangle.style.left = x + 'px';
      }
      else {
        selectRectangle.style.left = nowX + 'px';
        selectRectangle.style.width = (x - nowX) + 'px'
      }
      HandleRectangleSelect(selectRectangle);
    };

    element.onmouseup = element.onmouseleave = () => {
      selectRectangle.remove();
      element.onmousemove = element.onmouseup = null;
    };
  }
}

function HandleRectangleSelect(rectangle) {
  var x1 = parseInt(rectangle.style.left);
  var x2 = parseInt(rectangle.style.left) + parseInt(rectangle.style.width);
  var y1 = parseInt(rectangle.style.top);
  var y2 = parseInt(rectangle.style.top) + parseInt(rectangle.style.height);

  var objects = ID('editor').querySelectorAll('[data-obj-type]');
  for (let i = 0; i < objects.length; i++) {
    if (IsInCoordRange(x1, x2, y1, y2, objects[i])) {
      objects[i].className = "selectedObj";
    }
    else {
      if (!cntrlIsPressed) objects[i].className = "";
    }
  }
  UpdateSelection();
  SelectionChanged();
}

function IsInCoordRange(x1, x2, y1, y2, element) {
  if (x2 < x1) {
    let tmp = x2;
    x2 = x1;
    x1 = tmp;
  }
  if (y2 < y1) {
    let tmp = y2;
    y2 = y1;
    y1 = tmp;
  }
  var top = parseInt(element.style.top);
  var bottom = top + parseInt(element.offsetHeight)
  var left = parseInt(element.style.left);
  var right = left + parseInt(element.offsetWidth);
  return x1 < left && x2 > right && y1 < top && y2 > bottom;
}

function UpdateSelection() {
  let selectedObjs = QSA(".selectedObj");
  ID("selectedTag").value = '';
  let options = ID("selectedTag").options;
  for (let i = 0; i < selectedObjs.length; i++) {
    for (let j = 0; j < options.length; j++) {
      if (options[j].value == selectedObjs[i].id) {
        options[j].selected = true;
      }
    }
  }
}

function AddCoords() {
  const coords = document.createElement("span");
  coords.style.fontSize = "12px";
  coords.style.position = "fixed";
  coords.style.zIndex = "1000";
  coords.style.bottom = "5px";
  coords.style.right = "5px";
  coords.style.backgroundColor = "rgba(255,255,255,0.5)";
  coords.innerHTML = "";
  coords.setAttribute('id', 'coords')
  const rb = ID("rightbar");
  rb.appendChild(coords);
  rb.onclick =  rb.onmousemove = UpdateCoords;
}

function UpdateCoords(e = null){
  const rb = ID("rightbar");
  var nowX = e ? Math.trunc((e.clientX + rb.scrollLeft - rb.offsetLeft) / zoom) : 0;
  var nowY = e ? Math.trunc((e.clientY + rb.scrollTop - rb.offsetTop) / zoom) : 0;
  var type = "Cur";
  if (
    selectionCount == 1 &&
    ID("selectedTag").value &&
    ID(ID("selectedTag").value) &&
    ID(ID("selectedTag").value).style &&
    !isNaN(parseInt(ID(ID("selectedTag").value).style.top))
  ) {
    nowX = parseInt(ID(ID("selectedTag").value).style.left);
    nowY = parseInt(ID(ID("selectedTag").value).style.top);
    type = ID("selectedTag").value;
  }
  ID('coords').innerHTML = `${type}: (X:${nowX}, Y:${nowY})`;
}

class UndoCache{
  cache = [];
  size = 10;
  actualState = -1;
  element;
  callback;

  constructor(cacheSize, elementToSave, CallbackOnSave) {
    this.size = cacheSize;
    this.element = elementToSave;
    this.callback = CallbackOnSave;
  }
  
  save(){
    if(this.cache[this.actualState] == this.element.innerHTML){
      return;
    }

    while(this.cache.length >= this.size){
      this.cache.shift();
    }

    this.actualState++;
    if(this.actualState > (this.size - 1)){
      this.actualState = (this.size - 1);
    }

    this.cache[this.actualState] = this.element.innerHTML;
    this.callback();
  }

  get getPrev(){
    if(this.actualState <= 0){
      this.actualState = 0;
      return this.cache[0];
    }
    else{
      this.actualState --;
      return this.cache[(this.actualState)];
    }
  }

  get getNext(){
    this.actualState++;
    if(this.actualState >= this.cache.length){
      this.actualState = this.cache.length - 1;
      return this.cache[(this.actualState)];
    }
    else{
      return this.cache[(this.actualState)];
    }
  }

  get havePrev(){
    return this.actualState > 0;
  }

  get haveNext(){
    return this.actualState < (this.cache.length - 1);
  }

}

function Undo(dir = 0){
  if((dir == -1 && undo.havePrev) || (dir == 1 && undo.haveNext)){
    if(dir < 0){
      ID('editor').innerHTML = undo.getPrev;
    }
    else{
      ID('editor').innerHTML = undo.getNext;
    }
    ScrollEntries();
    UpdateSelectOtions();
    UnselectAll();
  }
  if(undo.havePrev){
    ID('undoIcon').className = 'active';
    ID('undoIcon').removeAttribute('disabled');
  }
  else{
    ID('undoIcon').className = 'inactive';
    ID('undoIcon').setAttribute('disabled', 'disabled')
  }

  if(undo.haveNext){
    ID('redoIcon').className = 'active';
    ID('redoIcon').removeAttribute('disabled');
  }
  else{
    ID('redoIcon').className = 'inactive';
    ID('redoIcon').setAttribute('disabled', 'disabled')
  }
}

function DocumentChanged(){
  window.onbeforeunload = (e) => {
    var m = "Nem mentette a munkáját!";
    e.returnValue = m; //Gecko + IE
    return m; //Webkit, Safari, Chrome etc.
  }
  if(undo != undefined && undo instanceof UndoCache) undo.save();
}