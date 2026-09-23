/*
 * Web based User Interface (WUI)
 * Copyright (c) 2026 Dávid Róbert Kovács
 * Licensed under the MIT License.
 */
var scanTime = 1000;
var objects = QSA("[data-tag-connection]");
var tagObjects = [];
var onlyExpressionObjects = [];
var nodes = [];
var loopTimeoutID;
var alarmTextCache = {};
var originalCRC = 0;
var trendbox = [];
var trendboxExp = [];


//TAG csatlakozású objektumok összegyűjtése
for (let i = 0;i < objects.length;i++) {
  if (objects[i].dataset.tagConnection.length && objects[i].dataset.tagConnection.match(/\//ig).length == 2) {
    tagObjects.push(objects[i]);
    if(!nodes.includes(objects[i].dataset.tagConnection.split('/')[0] + '/' + objects[i].dataset.tagConnection.split('/')[1])){
      nodes.push(objects[i].dataset.tagConnection.split('/')[0] + '/' + objects[i].dataset.tagConnection.split('/')[1]);
    }
  }
  //TAG nélküli, de js kifejezést tartalmazó objektumok:
  else if(objects[i].dataset.expressionForValue != undefined && objects[i].dataset.expressionForValue.length){
    onlyExpressionObjects.push(objects[i]);
  }
}
console.log('Node-ok száma: ' + nodes.length);
var nodeVars = [];

//Scriptgombok aktiválása:
var scriptButtons = QSA('[data-script]');
for(let i = 0; i < scriptButtons.length; i++){
  scriptButtons[i].onclick = (e)=> {
    eval(e.target.dataset.script);
  }
}

//Szükséges nodok meghatározása a lekérdezéshez:
for (let i = 0;i < nodes.length;i++) {
  nodeVars[i] = {};
  nodeVars[i].clientname = nodes[i].split('/')[0];
  nodeVars[i].nodename = nodes[i].split('/')[1];
  nodeVars[i].data = [];
}

for (let i = 0;i < objects.length;i++) {
  let c = "";
  let n = "";
  let s = "";
  if (objects[i].dataset.tagConnection.length && objects[i].dataset.tagConnection.match(/\//ig).length == 2) {
    c = objects[i].dataset.tagConnection.split('/')[0];
    n = objects[i].dataset.tagConnection.split('/')[1];
    s = objects[i].dataset.tagConnection.split('/')[2];
    for (let j = 0;j < nodeVars.length;j++) {
      if(nodeVars[j].clientname == c && nodeVars[j].nodename == n){
        let benne = 0;
        for (let k = 0;k < nodeVars[j].data.length;k++) {
          if (nodeVars[j].data[k] && nodeVars[j].data[k].symbol == s){
            benne = 1;
            break;
          }
        }
        if(benne == 0) nodeVars[j].data.push({symbol: s});
      }
    }
  }
}

//Változó írásokhoz szükséges eseménykezelők hozzáadása:
for (let i = 0;i < objects.length;i++) {
  if (objects[i].dataset.objType == 'button') {//_________GOMB__________
    objects[i].onclick = (e) =>{
      if(e.target.dataset.disable == 1) return;
      var c = e.target.dataset.tagConnection.split('/')[0];
      var n = e.target.dataset.tagConnection.split('/')[1];
      var s = e.target.dataset.tagConnection.split('/')[2];
      var v = e.target.value;
      console.log("Beírási kérelem gomb...");
      if (c.length > 0 && n.length > 0 && s.length > 0) {
        fetch('?p=viewrest&req=set', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: `{"clientname": "${c}", "nodename": "${n}", "symbol": "${s}", "value": ${v}}`
        }).then(increaseScan());
      }
    }
  }
  if (objects[i].dataset.objType == 'switch') {//_________KAPCSOLÓ_________
    objects[i].onclick = (e) =>{
      if(e.target.className.match('wait')) return;
      if(e.target.dataset.disable == 1) return;
      var c = e.target.dataset.tagConnection.split('/')[0];
      var n = e.target.dataset.tagConnection.split('/')[1];
      var s = e.target.dataset.tagConnection.split('/')[2];
      var v = e.target.src.match(e.target.dataset.onImg) ? 0 : 1;
      console.log("Beírási kérelem kapcsoló...");
      if (c.length > 0 && n.length > 0 && s.length > 0) {
        e.target.classList.add('wait1');
        fetch('?p=viewrest&req=set', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: `{"clientname": "${c}", "nodename": "${n}", "symbol": "${s}", "value": ${v}}`
        }).then(increaseScan());
      }
    }
  }
  if (objects[i].dataset.objType == 'entry' || objects[i].dataset.objType == 'entryButton') {
    objects[i].onclick = newValuePrompt;
  }

  //Naplózott adatok megnyitása:
  if(objects[i].dataset.tagConnection.split('/').length == 3 && !["button", "alarmtext", "entryButton"].includes(objects[i].dataset.objType)){
    objects[i].onmouseenter = (e) => {
      var path = objects[i].dataset.tagConnection;
      var exp = 'x';
      if(objects[i].dataset.expression && ExpressionTest(objects[i].dataset.expression, true)) exp = objects[i].dataset.expression;
      if(objects[i].dataset.expressionForValue && ExpressionTest(objects[i].dataset.expressionForValue, true)) exp = objects[i].dataset.expressionForValue;
      var bubble = document.createElement('div');
      bubble.style.minWidth = '70px';
      bubble.style.height = '36px';
      const log = document.createElement('img');
      log.src = 'img/log.png';
      log.style.width = '32px';
      log.style.display = 'inline-block';
      log.style.marginLeft = '4px';
      log.style.cursor = "pointer";
      log.title = "Open data log";
      bubble.appendChild(log);
      log.onclick = () => {
        window.open('?p=loggeddata&vp=' + path, 'ld_' + path, 'width=600,height=800,popup');
      }
      const trend = document.createElement('img');
      trend.src = 'img/trend.png';
      trend.style.width = '32px';
      trend.style.display = 'inline-block';
      trend.style.marginLeft = '4px';
      trend.style.cursor = "pointer";
      trend.title = "Add to trend";
      bubble.appendChild(trend);
      trend.onclick = () => {
        AddVarPathToTrendbox(path, exp);
      }
      bubble.style.backgroundColor = '#FFFFFF08';
      bubble.style.position = 'absolute';
      bubble.style.left = (e.target.offsetLeft + e.target.offsetWidth - 1) + 'px';
      bubble.style.top = e.target.offsetTop + 'px';
      bubble.style.zIndex = 1000;
      setTimeout(() => {
        if(bubble) e.target.parentNode.appendChild(bubble);
      }, 100);
      var lock = false;
      bubble.onmouseenter = (e) => {
        lock = true;
      }
      bubble.onmouseleave = (e) => {
        e.target.remove();
        bubble = null;
      }
      bubble.onclick = (e) => {
        bubble.remove();
        bubble = null;
      }
      e.target.onmouseleave = () => {
        setTimeout(()=>{
          if(!lock){
            bubble.remove();
            bubble = null;
          }
        },200);
      }
    }
  }
}

//node változó nélküli, de kifejezéssel rendelkező objektumok:
setInterval(()=>{
  for(let i = 0; i < onlyExpressionObjects.length; i++){

    if(onlyExpressionObjects[i].dataset.objType == "entry"){
      onlyExpressionObjects[i].value = handleEntry(onlyExpressionObjects[i], 0);
    }
    else if(onlyExpressionObjects[i].dataset.objType == "bar"){
      onlyExpressionObjects[i].style.background = handleBar(onlyExpressionObjects[i], 0);
    }
  }
},500);

//Ha megváltozik az oldal, újratöltődik:
setInterval(() => {
  GetCRC().then((json) => {
    if(json.crc != originalCRC){
      Toast('Az oldal megváltozott a szerveren. Újratöltés...', 'ok');
      setTimeout(()=>{
        window.location.reload(true);
      },3000);
    }
  });
},5000);

//Üzenetablekok naplói:
var alarmwindows = document.querySelectorAll('[data-obj-type="alarmwindow"]');
for(let aw of alarmwindows){

  //Üzenetnapló:
  let ats = aw.querySelectorAll('[data-obj-type="alarmtext"]');
  aw.setAttribute('title', "Kattintson az üzenetnapló megnyitásához!");
  aw.style.cursor = "cell";
  aw.onclick = (e) => {
    ShowAlarmLog(ats);
  }
}

//Villogó objektunok blink osztályhoz rendelése:
var Blink = QSA('[data-blink="true"]');
for (let b = 0;b < Blink.length;b++) {
  Blink[b].classList.add('blink');
}
//console.log(nodeVars);
readVariables(nodeVars);
loop();
function loop(){
  loopTimeoutID = setTimeout(() => {
    readVariables(nodeVars);
    loop();
  },scanTime);
}
function readVariables(o) {
  for (let i = 0;i < o.length;i++) {
    fetch('?p=viewrest&req=get', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(o[i])
    })
    .then(response => response.json())
    .then(response => {
      handleValues(response);
      Tekero(false);
    })
    .catch( (message) => {
      Toast(message, 'error');
      Tekero(true);
    });
  }

}

function handleValues(r) {
  for (let i = 0;i < tagObjects.length;i++) {
    if (r.data) {
      for (let j = 0;j < r.data.length;j++) {
        if(tagObjects[i].dataset.tagConnection.split('/')[0] == r.clientname &&
         tagObjects[i].dataset.tagConnection.split('/')[1] == r.nodename &&
         tagObjects[i].dataset.tagConnection.split('/')[2] == r.data[j].symbol){
          if(r.data[j].value == null){
            tagObjects[i].style.opacity = "0.4";
            tagObjects[i].style.outline = "5px dotted tomato";
            tagObjects[i].title = "Online data not available.";
            tagObjects[i].style.visibility = 'visible';
            tagObjects[i].dataset.disable = "1";
            if (tagObjects[i].value && tagObjects[i].value[0] == '#') tagObjects[i].value = '---';
          }
          else {
            tagObjects[i].style.opacity = "1";
            tagObjects[i].title = "";
            tagObjects[i].style.outline = 'none';
            tagObjects[i].dataset.disable = "0";

            if (tagObjects[i].dataset.objType == "entry") {
              var t = r.data[j].value;
              var show = handleEntry(tagObjects[i], t);

              tagObjects[i].value = show;
              if(tagObjects[i].dataset.hi !== undefined && !isNaN(Number(tagObjects[i].dataset.hi))){
                if(t > Number(tagObjects[i].dataset.hi)){
                  tagObjects[i].classList.add('blinkbhi');
                }
                else{
                  tagObjects[i].classList.remove('blinkbhi');
                  }
              }
              if(tagObjects[i].dataset.lo !== undefined && !isNaN(Number(tagObjects[i].dataset.lo))){
                if(t < Number(tagObjects[i].dataset.lo)){
                  tagObjects[i].classList.add('blinkblo');
                  }
                else{
                  tagObjects[i].classList.remove('blinkblo');
                  }
              }
              if(tagObjects[i].classList.contains('blinkbhi')) tagObjects[i].title = "> " + tagObjects[i].dataset.hi;
              else if(tagObjects[i].classList.contains('blinkblo')) tagObjects[i].title = "< " + tagObjects[i].dataset.lo;
              else tagObjects[i].title = "";
            }
            else if (tagObjects[i].dataset.objType == "bar") {
              var t = r.data[j].value;
              tagObjects[i].style.background = handleBar(tagObjects[i], t);
            }
            else if (tagObjects[i].dataset.objType == "lamp") {
              if(Math.round(Number(r.data[j].value)) == 0) tagObjects[i].style.backgroundColor = tagObjects[i].dataset.offColor;
              else tagObjects[i].style.backgroundColor = tagObjects[i].dataset.onColor;
            }
            else if (tagObjects[i].dataset.objType == "switch") {
              if(Math.round(Number(r.data[j].value)) == 0) tagObjects[i].src = tagObjects[i].dataset.offImg;
              else tagObjects[i].src = tagObjects[i].dataset.onImg;
              
              if(tagObjects[i].classList.contains('wait1')){
                tagObjects[i].classList.replace('wait1', 'wait2');
              }
              else if(tagObjects[i].classList.contains('wait2')){
                tagObjects[i].classList.remove('wait2');
              }
            }
            else if (!["button", "entryButton"].includes(tagObjects[i].dataset.objType)){
              if(tagObjects[i].dataset.objType == "alarmtext"){
                HandleAlarmText(tagObjects[i], r.data[j].value);
              }
              else{
                tagObjects[i].style.visibility =
                (RunExpression(r.data[j].value, tagObjects[i].dataset.expression) ^ (tagObjects[i].dataset.neg != 'false')) ? 'visible' : 'hidden';
              }
            }
          }
        }
      }
    }
    else {
      tagObjects[i].style.opacity = "0.4";
      tagObjects[i].style.outline = "5px dotted brown";
      tagObjects[i].title = "Empty response from server.";
      tagObjects[i].style.visibility = 'visible';
      tagObjects[i].dataset.disable = "1";
      if (tagObjects[i].value && tagObjects[i].value[0] == '#') tagObjects[i].value = '---';
    }
  }
}

function OpenTrendDialog() {
  var from = 0;
  var to = 0;
  const showHours = 6;

  var d = document.createElement('dialog');
  d.style.width = '90vw';
  d.style.height = '90vh';
  const div = document.createElement('div');
  div.setAttribute('id', 'plot');
  div.style.width ='100%';
  div.style.height ='75vh';
  const p = document.createElement('p');
  const closeBu = document.createElement('button');
  closeBu.appendChild(document.createTextNode('Bezár'));
  closeBu.style.width = "10rem";
  closeBu.onclick = () =>{
    d.remove();
    d = null;
  }
  const preBu = document.createElement('button');
  preBu.appendChild(document.createTextNode('Korábbi'));
  preBu.style.width = "10rem";
  preBu.onclick = () => {
    let now = Math.trunc(Date.now()/1000);
    to = to == 0 ? (now - (showHours*3600)) : (to - (showHours*3600));
    from = (to - (showHours*3600));
    Plot(from, to);
  }
  const lateBu = document.createElement('button');
  lateBu.appendChild(document.createTextNode('Későbbi'));
  lateBu.onclick = () => {
    let now = Math.trunc(Date.now()/1000);
    if(to <= 0){
      $to = 0;
    }
    else{
      to = ((to + (showHours*3600)) > now) ? 0 : to + showHours*3600;
    }
    from = (to - (showHours*3600)) < 0 ? 0 : (to - (showHours*3600));
    Plot(from, to);
  }
  lateBu.style.width = "10rem";
  p.appendChild(closeBu);
  p.appendChild(preBu);
  p.appendChild(lateBu);
  d.appendChild(div);
  d.appendChild(p);
  document.body.appendChild(d);
  d.showModal();
  Plot(from, to);

  function Plot(from = 0, to = 0){
    from = from == 0 ? Math.trunc(Date.now()/1000) - (showHours*3600) : from;
    var fromDate = new Date(from*1000);
    var toDate = to == 0 ? new Date(Date.now()) : new Date(to*1000);
    Promise.all(trendbox.map(varPath => 
      fetch(`?p=loggeddata&vp=${varPath}&req=get&from=${from}&to=${to}`)
      .then((res) => res.json())
      .then(data => ({"data": data, "path": varPath}))
    ))
    .then(toPlot => {
      var data = [];
      var rangeString = `Intervallum: ${showHours} óra,  <b>${fromDate.toLocaleString()} - ${toDate.toLocaleString()}</b>`;
      var layout = {title: {text: rangeString}};
      let k = 0;
      while((toPlot[0].data.error || toPlot[0].data.data.length == 0) && k < toPlot.length) {
        let first = toPlot.shift();
        toPlot.push(first);
        k++;
      }
      for(let i = 0; i < toPlot.length; i++){
        if (!toPlot[i].data.error && toPlot[i].data.data.length) {
          let x = [];
          let y = [];

          let expIndex = trendbox.indexOf(toPlot[i].path);
          let exp = 'x';
          if(expIndex >= 0 && ExpressionTest(trendboxExp[expIndex], true)) exp = trendboxExp[expIndex];

          for (let j = 0; j < toPlot[i].data.data.length; j++) {
            x.push(toPlot[i].data.data[j].time);
            y.push(RunExpression(toPlot[i].data.data[j].data,exp,true));
          }
          data.push(
            {
              x: x,
              y: y,
              type: 'scatter',
              showlegend: true,
              mode: (toPlot[i].data.data.length < 100 ? 'lines+markers' : 'lines'),
              name: '<b>' + toPlot[i].path.replaceAll(/\//g, '/<br>') + '</b>'
            }
          );
        }
        else{
          layout = {
            title: {text:
              rangeString + "<br><u><i>Az adott időpontban nincs meg minden kért adat!</i></u>"
            }
          }
          data.push(//Nincs adat:
            {
              x: [fromDate.toLocaleString()],
              y: [0], mode: 'lines',
              type: 'scatter',
              showlegend: true,
              name: `<i>Nincs adat:<br>${toPlot[i].path.replaceAll(/\//g, '/<br>')}</i>`
            }
          );
        }
      }
      Plotly.newPlot('plot', data, layout);
    });
  }
}

function newValuePrompt(e) {
  var inpObj = e.target;
  if(inpObj.dataset.writeable != 'true' ||
    inpObj.dataset.disable == 1){
    return;
  }
  console.log("Beírási dialog megnyitva.");
  const p = document.createElement("dialog");
  const s = document.createElement('small');
  s.appendChild(document.createTextNode(inpObj.dataset.tagConnection));
  s.style.fontStyle = 'italic';
  s.style.paddingLeft = '1rem';
  s.style.display = 'block';
  const h = document.createElement("h3");
  var Min = Number(inpObj.dataset.min);
  var Max = Number(inpObj.dataset.max);
  if(Min >= Max) Max = Min = "";
  if(isNaN(Min)) Min = "";
  if(isNaN(Max)) Max = "";    
  h.appendChild(document.createTextNode("Írja be az új értéket:"));
  p.appendChild(h);
  s.appendChild(document.createElement("br"));
  const Inp = document.createElement("input");
  Inp.setAttribute('type','text');
  if(inpObj.dataset.min.length > 0){
    s.appendChild(document.createTextNode("MIN: " + Min));
    s.appendChild(document.createElement("br"));
    Inp.dataset.min = Min;
  }
  if(inpObj.dataset.max.length > 0){
    s.appendChild(document.createTextNode("MAX: " + Max));
    s.appendChild(document.createElement("br"));
    Inp.dataset.max = Max;
  }
  p.appendChild(s);
  p.style.textAlign = "left";
  Inp.value = inpObj.value;
  Inp.required = "required";
  const d = document.createElement("div");
  d.style.textAlign = 'center';
  d.appendChild(Inp);
  d.appendChild(document.createElement("br"));
  const yesButton = document.createElement("button");
  yesButton.appendChild(document.createTextNode('OK'));
  const noButton = document.createElement("button");
  noButton.appendChild(document.createTextNode('Mégsem'));
  yesButton.style.backgroundColor = "royalblue";
  yesButton.style.color = "white";
  noButton.style.backgroundColor = "gray";
  noButton.style.color = "white";
  d.appendChild(yesButton);
  d.appendChild(noButton);
  p.appendChild(d);
  document.body.appendChild(p);
  p.showModal();
  Inp.focus();
  Inp.select();
  Inp.onkeydown = (e, bu = yesButton) => {
    if(e.key == 'Enter') bu.click();
  };
  noButton.onclick = (e, dialog = p) => {
    dialog.remove();
  };
  yesButton.onclick = (e, dialog = p, INP = Inp, INPOBJ = inpObj) => {
    var BEIR = INP.value.replaceAll(',','.');
    BEIR = Number(BEIR);
    if(!(String(BEIR).match(/[^\d\.\,\+\-]/) ||
    (INP.dataset.max !== undefined && (BEIR > Number(INP.dataset.max))) ||
    (INP.dataset.min !== undefined && (BEIR < Number(INP.dataset.min))))){
      var c = INPOBJ.dataset.tagConnection.split('/')[0];
      var n = INPOBJ.dataset.tagConnection.split('/')[1];
      var s = INPOBJ.dataset.tagConnection.split('/')[2];
      var v = BEIR;
      console.log("Beírási kérelem entry...");
      if (c.length > 0 && n.length > 0 && s.length > 0) {
        fetch('?p=viewrest&req=set', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: `{"clientname": "${c}", "nodename": "${n}", "symbol": "${s}", "value": ${v}}`
        }).then(increaseScan());
      }
    dialog.remove();      
    }
    else {
    	INP.value = "";
    	INP.placeholder = "Írjon be helyes értéket!";
    }
  };
}

function increaseScan() {
  console.log("Írás: SCAN GYORSÍTÁS...");
  clearTimeout(loopTimeoutID);
  for(var time = 1000; time < 2000; time += 500){
    setTimeout(() => {readVariables(nodeVars);}, time);
  }
  setTimeout(() => {
    readVariables(nodeVars);
    console.log("Scan alaphelyzetbe.");
    loop();
  }, time);
}

//Indulási animáció:
document.addEventListener("DOMContentLoaded", (event) => {
  Tekero(true);
});

//Oldal betöltődését követően:
window.addEventListener("load", (event) => {
  GetCRC().then(json => originalCRC = json.crc);
  if(ID('editor').dataset.hamburger != undefined && ID('editor').dataset.hamburger == 'false'){
    ID('hamburger').style.display = 'none';
    //Nem lacafacázunk a lenti animációval:
    Tekero(false);
    ID('editor').style.display = 'block';
    return;
  }

  document.addEventListener('keydown', (e) => {
    if(e.key == "F2"){
      if(ID('trendbox')){
        ID('trendbox').remove();
      }
      else{
        UpdateTrendbox();
      }
    }
  });
  
  setTimeout(() => { //Még várunk egy kicsit
    let feher = document.createElement('div');//Áttűnés az oldal megjelenítésekor
    feher.className = 'whitehide';
    feher.setAttribute('id','feher');
    document.body.appendChild(feher);
    ID('editor').style.display = 'block';
    Tekero(false);
    setTimeout(() => {
      ID('feher').remove();
      Toast('A Ternd Box-ot az F2 billentyűvel nyithatja meg.', 'none');
    },1000);
  }, 200);
});


function RunExpression(x, exp, notBool = false) {
  if (ExpressionTest(exp, notBool)) {
    exp = "let x=" + x + '; ' + exp;
    return eval(exp);
  }
  return false;
}

function HandleAlarmText(at, x){
  let oldState = at.style.visibility;
  at.style.visibility = (RunExpression(x, at.dataset.expression) ^ (at.dataset.neg != 'false')) ? 'visible' : 'collapse';

  if(oldState != at.style.visibility && at.style.visibility == 'visible'){
    const date = new Date(); 

    const pad = (n) => (n < 10 ? '0' + n : n);

    const formattedDate = [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate())
    ].join('-') + ' ' + [
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      pad(date.getUTCSeconds())
    ].join(':');
    at.children[1].innerText = formattedDate;

    if(at.dataset.sound == "true" && ID('soundenabled').checked) ID("alarmsound").play();
  }
}

function SetSound(){
  if(ID('soundenabled').checked){
    ID("alarmsound").play();
    setTimeout(() => {
      ID("alarmsound").pause();
      ID("alarmsound").currentTime = 0;
    }, 620);
  }
}

async function GenerateAlarmLog(at){
  let path = at.dataset.tagConnection;
  var json = {};
  if(alarmTextCache[path] != undefined){
    json = alarmTextCache[path];
  }
  else{
    const response = await fetch(`?p=loggeddata&vp=${path}&pn=export`);
    json = await response.json();
    alarmTextCache[path] = json;
  }
  if(!json.data) return;
  let alarmLog = [];
  let setTime = "";
  let resetTime = "";
  let text = at.children[0].innerHTML;
  let exp = at.dataset.expression;
  let neg = at.dataset.neg;

  for(let record of json.data){
    if(setTime == ""){
      if(RunExpression(Number(record.data), exp) ^ (neg != 'false')){
        setTime = record.time;//.substring(0, record.time.length - 3);
      }
    }
    else{
      if(!(RunExpression(Number(record.data), exp) ^ (neg != 'false'))){
        resetTime = record.time;//.substring(0, record.time.length - 3);
        alarmLog.push({"text": text, "setTime": setTime, "resetTime": resetTime});
        setTime = "";
        resetTime = "";
      }
    }
  }
  if(setTime != ""){
    alarmLog.push({"text": text, "setTime": setTime, "resetTime": ""});
  }
  return alarmLog;
}

async function ShowAlarmLog(ats){
  alarmTextCache = {};
  Tekero(true);
  let alarmLog = [];
  let alarmLogOfAlarmText= "";
  for(let at of ats){
    alarmLogOfAlarmText = await GenerateAlarmLog(at);
    for(let log of alarmLogOfAlarmText){
      log.color = at.style.backgroundColor;
    }
    alarmLog.push(...alarmLogOfAlarmText);
  }
  alarmLog.sort((a, b) => {
    const timeA = a.setTime.toUpperCase();
    const timeB = b.setTime.toUpperCase();
    if (timeA < timeB) {
      return -1;
    }
    if (timeA > timeB) {
      return 1;
    }
    return 0;
  });
  let dialog = document.createElement("dialog");
  let p = document.createElement("p");
  p.innerText = "Üzenet napló:";
  p.style.fontWeight = "bold";
  let expBu = document.createElement("button");
  expBu.innerHTML = "CSV exportálás";
  expBu.onclick = () => {
    let toCSV = [];
    for(let item of alarmLog){
      toCSV.push({
        'Text': item.text,
        'Set time': item.setTime,
        'Reset time': item.resetTime
      });
    }

    let csv = ObjArrayToCSV(toCSV);
    let blob = new Blob([csv], {
      type: "text/csv",
    });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.download = "AlarmLog.csv";
    a.href = url;
    a.click();
    a.remove();
  }
  dialog.appendChild(expBu);
  expBu.style.position = "absolute";
  expBu.style.right = "1rem";
  expBu.style.bottom = "1rem";
  let closeBu = document.createElement("button");
  closeBu.innerText = "X";
  closeBu.style.position = "absolute";
  closeBu.style.top = "2px";
  closeBu.style.right = "2px";
  closeBu.style.width = "2rem";
  closeBu.style.height = "2rem";
  closeBu.style.lineHeight = "2rem";
  closeBu.style.padding = "0rem";
  closeBu.onclick = () => {
    dialog.remove();
  }
  dialog.appendChild(closeBu);
  dialog.appendChild(p);
  dialog.style.height = "90vh";
  let scroll = document.createElement("div");
  scroll.style.overflow = "scroll";
  scroll.style.height = "75vh";
  let table = document.createElement("table");
  table.className = "alarmlog";
  let tr = document.createElement("tr");
  let th0 = document.createElement("th");
  th0.innerText = "Üzenet";
  let th1 = document.createElement("th");
  th1.innerText = "Létrejött";
  let th2 = document.createElement("th");
  th2.innerText = "Megszűnt";
  tr.appendChild(th0);
  tr.appendChild(th1);
  tr.appendChild(th2);
  table.appendChild(tr);
  for(let row of alarmLog){
    let td0 = document.createElement("td");
    td0.innerText = row.text;
    let td1 = document.createElement("td");
    td1.innerText = row.setTime;
    let td2 = document.createElement("td");
    td2.innerText = row.resetTime;
    let tr = document.createElement("tr");
    tr.style.backgroundColor =row.color.replace('rgb(', 'rgba(').replace(')', ', 0.5)');
    tr.appendChild(td0);
    tr.appendChild(td1);
    tr.appendChild(td2);
    table.appendChild(tr);
  }
  scroll.appendChild(table);
  dialog.appendChild(scroll);


  document.body.appendChild(dialog);
  dialog.showModal();
  Tekero(false);
}

function handleEntry(tag, val){
  if (!tag.dataset.dec) tag.dataset.dec = 0;
  if (!tag.dataset.expressionForValue) tag.dataset.expressionForValue = 'x';
  val = RunExpression(val, tag.dataset.expressionForValue, true);
  val = Math.round(val * (10 ** Number(tag.dataset.dec)));
  val = val / (10 ** Number(tag.dataset.dec));

  let parts = String(val).split('.');
  let show = '';
  if (parts.length > 1) {
    while (parts[1].length < tag.dataset.dec) {
      parts[1] += '0';
    }
    show = parts.join('.');
  }
  else if (parts.length == 1 && tag.dataset.dec > 0) {
    show = String(parts[0]) + '.' + '0'.repeat(tag.dataset.dec);
  }
  else {
    show = String(val);
  }

  if(tag.dataset.zeros && tag.dataset.zeros.length){
    parts = show.split('.');
    while(parts[0].length < tag.dataset.zeros) parts[0] = '0' + parts[0];
    show = parts.join('.');
  }
  if(tag.dataset.unit != undefined) show += tag.dataset.unit;
  return show;
}

function handleBar(tag, val) {
  val = RunExpression(val, tag.dataset.expressionForValue, true);
  val = val > 100.0 ? 100.0 : val;
  val = val < 0.0 ? 0.0 : val;
  val = parseInt(val * 100) / 100.0;
  var color = tag.dataset.barColor;
  return `linear-gradient(to top, ${color} ${val}%, transparent ${val}%)`;
}

async function GetCRC(){
  let params = new URLSearchParams(document.location.search);
  var page = params.get("page");

  const response = await fetch('?p=view&req=crc&page=' + page, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  return await response.json();
}

function AddVarPathToTrendbox(path, exp = 'x'){
  if(!trendbox.includes(path)){
    trendbox.push(path);
    trendboxExp.push(exp);
  }
  UpdateTrendbox();
}

function UpdateTrendbox(){
  if(!ID("trendbox")){
    const tbContainer = document.createElement('DIV');
    tbContainer.style.position = 'fixed';
    tbContainer.style.top = '0px';
    tbContainer.style.left = '0px';
    tbContainer.style.minHeight = '50px';
    tbContainer.style.minWidth = '200px';
    tbContainer.style.backgroundColor = 'LemonChiffon';
    tbContainer.style.opacity = '0.95';
    tbContainer.setAttribute('id', 'trendbox');
    const p = document.createElement('P');
    p.appendChild(document.createTextNode('Trend Box'));
    p.style.textAlign = 'center';
    p.style.margin = '10px';
    const open = document.createElement('BUTTON');
    open.appendChild(document.createTextNode('Megnyitás'));
    open.style.width = '50%';
    open.style.boxSizing = 'border-box';
    open.style.padding = '5px';
    open.style.backgroundColor = "dodgerblue";
    open.style.borderRadius = '0px';
    open.setAttribute('id', 'trendOpenButton');
    open.onclick = () => {
      tbContainer.remove();
      OpenTrendDialog();
    }
    const close = document.createElement('BUTTON');
    close.appendChild(document.createTextNode('Bezárás'));
    close.style.width = '50%';
    close.style.boxSizing = 'border-box';
    close.style.padding = '5px';
    close.style.backgroundColor = "lightgray";
    close.style.borderRadius = '0px';
    close.onclick = () => {
      tbContainer.remove();
    };
    const tbPathes = document.createElement('DIV');
    tbPathes.setAttribute('id', 'trendboxPathes');
    tbContainer.appendChild(p);
    tbContainer.appendChild(tbPathes);
    tbContainer.appendChild(open);
    tbContainer.appendChild(close);
    document.body.appendChild(tbContainer);
  }
  ID("trendboxPathes").innerHTML = '';
  if(trendbox.length == 0){
    let row = document.createElement('p');
    row.style.padding = "2px";
    row.style.border = "solid 1px black";
    row.style.margin = '0px';
    row.style.backgroundColor = 'lightgray';
    row.style.textAlign = 'center';
    row.appendChild(document.createTextNode('(üres)'));
    ID("trendboxPathes").appendChild(row);
    ID('trendOpenButton').setAttribute('disabled', 'disabled');
    return;
  }
  ID('trendOpenButton').removeAttribute('disabled');
  for(let i = 0; i < trendbox.length; i++){
    let row = document.createElement('p');
    row.style.padding = "2px";
    row.style.border = "solid 1px black";
    row.style.margin = '0px';
    row.style.backgroundColor = 'lightsteelblue';
    row.appendChild(document.createTextNode(trendbox[i]));
    row.onclick = (e) => {
      let index = trendbox.indexOf(e.target.innerHTML);
      if(index >= 0){
        trendbox.splice(index, 1);
        trendboxExp.splice(index, 1);
      }
      UpdateTrendbox();
    };
    row.title = "Kattintson a törléshez";
    ID("trendboxPathes").appendChild(row);
  }
}