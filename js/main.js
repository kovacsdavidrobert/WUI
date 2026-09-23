// @ts-check

/** @type {(id: string) => any} */
function ID(id) {
  return document.getElementById(id);
}

/** @type {(q: string) => any} */
function QSA(q) {
  return document.querySelectorAll(q);
}

function Confirm(text,yesText,noText,yesCallback) {
  var d = document.createElement('dialog');
  var p = document.createElement('pre');
  p.appendChild(document.createTextNode(text));
  p.style.fontWeight = "bold";
  p.style.fontFamily = 'sans-serif';
  d.appendChild(p);
  let y = document.createElement('button');
  y.setAttribute('class', 'yn warning');
  y.appendChild(document.createTextNode(yesText));
  let n = document.createElement('button');
  n.setAttribute('class', 'yn');
  n.appendChild(document.createTextNode(noText));
  y.onclick = () => {
    yesCallback();
    document.body.removeChild(d);
  }
  n.onclick = () => {
    document.body.removeChild(d);
  }
  d.appendChild(y);
  d.appendChild(n);
  document.body.appendChild(d);
  d.showModal();
}

const DConfirm = (text, yes, no, yColor, nColor) => {
  return new Promise(resolve => {
    const dConfirmObj = document.createElement("dialog");
    dConfirmObj.appendChild(document.createTextNode(text));
    dConfirmObj.appendChild(document.createElement("br"));
    dConfirmObj.style.textAlign = "center";
    const yesButton = document.createElement("button");
    yesButton.appendChild(document.createTextNode(yes));
    const noButton = document.createElement("button");
    noButton.appendChild(document.createTextNode(no));
    yesButton.style.width = "45%";
    yesButton.style.backgroundColor = yColor;
    noButton.style.width = "45%";
    noButton.style.backgroundColor = nColor;
    dConfirmObj.appendChild(yesButton);
    if (no.length > 0) dConfirmObj.appendChild(noButton);
    ID("maindiv").appendChild(dConfirmObj);
    dConfirmObj.showModal();
    const onClick = pass => {
      resolve(pass);
      dConfirmObj.remove();
    };
    yesButton.addEventListener('click', onClick.bind(null, true));
    noButton.addEventListener('click', onClick.bind(null, false));
  });
};


function Alert(text,yesText) {
  var d = document.createElement('dialog');
  var p = document.createElement('p');
  p.appendChild(document.createTextNode(text));
  p.style.fontWeight = "bold";
  d.appendChild(p);
  let y = document.createElement('button');
  y.setAttribute('class', 'yn warning');
  y.appendChild(document.createTextNode(yesText));

  y.onclick = () => {
    document.body.removeChild(d);
  }
  d.appendChild(y);
  document.body.appendChild(d);
  d.showModal();
}


function Toast(text, colorClass) {
  var t = document.createElement('div');
  t.innerText = text;
  t.classList.add('toast');
  if(colorClass.length) t.classList.add(colorClass);
  t.onclick = (/** @type {any} */e) => {
    e.target.remove();
  }
  onanimationend = () => {
    t.remove();
  };
  document.body.appendChild(t);
}


function ObjArrayToCSV(objArray, separator = ',', header = true){
  var csv = "";
  let keys = Object.keys(objArray[0]);
  if(header){
    csv = '"'+keys.join('"'+separator+'"') + '"\n';
  }
  for(let i = 0; i < objArray.length; i++){
    let row = [];
    for(let j = 0; j < keys.length; j++){
      row.push('"' + objArray[i][keys[j]] + '"');
    }
    csv += row.join(separator) + "\n";
  }

  return csv;
}

function Tekero(en){
  if(en){
    if(!ID('tekero')){
      let tekero = document.createElement('div');//Animáció indítása
      tekero.className = 'wait';
      tekero.setAttribute('id','tekero');
      document.body.appendChild(tekero);
    }
  }
  else if(ID('tekero')){
    ID('tekero').remove();
  }

}

function CSVToObjArray(csv, separator = ','){
  var rows = csv.split("\n");
  var result = [];
  var reg = new RegExp('"[^"]*"'+separator+'|[^'+separator+']*('+separator+'|$)', 'g');
  var keys = rows[0].match(reg);
  for(let k = 0; k < keys.length; k++){
    keys[k] = keys[k].replaceAll('"','').replaceAll(',','');
  }
  for(let i = 1; i < rows.length; i++){
    let obj = {};
    let row = rows[i].match(reg);
    if(row.length >= 5){
      for(let k = 0; k < row.length; k++){
        row[k] = row[k].replaceAll('"','').replaceAll(',','');
      }
      for(let j = 0; j < keys.length; j++){
        if(keys[j].length) obj[keys[j]] = row[j];
      }
      result.push(obj);
    }
  }
  console.log(result);
  return result;
}

function ExpressionTest(exp, notBool = false){
  if (exp.match(/[^xA-Za-z0-9' )(.|&=<>!\-\+*/%]/g)) {
    return false;
  }
  exp = "let x=42; " + exp;
  try {eval(exp)}
  catch (err) {return false;}
  if (eval(exp) !== true && eval(exp) !== false && (!notBool)) {
    return false;
  }
  return !isNaN(eval(exp));
}