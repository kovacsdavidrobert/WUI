var delSymbol = [], delSymbolBackup = [];
var templateRow = {};

window.onload = () => {
  templateRow = document.querySelector('[data-vlistrow]').cloneNode(true);
  templateRow.children[0].innerHTML = '0';
}

function  unsaved(inp) {
  var count = 0;
  if (event && event.target.className == "primarycolumn") {
  	let pri = QSA(".primarycolumn");
  	for (let i =0;i < pri.length;i++) {
  		if (pri[i].value == event.target.value) count++;
  	}
  }
  var tr = inp.parentNode.parentNode;
  if (tr.children[1].children[0].checkValidity()
      && tr.children[3].children[0].checkValidity()
      && tr.children[4].children[0].checkValidity()
      && count <= 1){
        tr.children[1].children[0].dataset.newvalue = tr.children[1].children[0].value;
        tr.children[2].children[0].dataset.newvalue = tr.children[2].children[0].value;
        tr.children[3].children[0].dataset.newvalue = tr.children[3].children[0].value;
        tr.children[4].children[0].dataset.newvalue = tr.children[4].children[0].value;
        tr.children[5].children[0].dataset.newvalue = tr.children[5].children[0].checked ? '1' : '0';
        if(tr.children[1].children[0].dataset.newvalue != tr.children[1].children[0].dataset.sqlvalue ||
           tr.children[2].children[0].dataset.newvalue != tr.children[2].children[0].dataset.sqlvalue ||
           tr.children[3].children[0].dataset.newvalue != tr.children[3].children[0].dataset.sqlvalue ||
           tr.children[4].children[0].dataset.newvalue != tr.children[4].children[0].dataset.sqlvalue ||
           tr.children[5].children[0].dataset.newvalue != tr.children[5].children[0].dataset.sqlvalue){
             //tr.children[0].style.color = 'orange';
             tr.className = "thisRowChanged";
             if(!tr.dataset.sql) tr.dataset.sql = "update";

           }
           else {
             //tr.children[0].style.color = '';
             tr.className = "";
           }
        checkGlobalChanges();
  }
  else {
    let err = 0;
  	if (!tr.children[1].children[0].checkValidity()) {
  		tr.children[1].children[0].value =
  		tr.children[1].children[0].dataset.newvalue == undefined ? tr.children[1].children[0].dataset.sqlvalue : tr.children[1].children[0].dataset.newvalue;
  		if (!tr.children[1].children[0].checkValidity()) err++;
  	}
  	if (!tr.children[3].children[0].checkValidity()) {
  		tr.children[3].children[0].value =
  		tr.children[3].children[0].dataset.newvalue == undefined ? tr.children[3].children[0].dataset.sqlvalue : tr.children[3].children[0].dataset.newvalue;
  		if (!tr.children[3].children[0].checkValidity()) err++;
  	}
  	if (!tr.children[4].children[0].checkValidity()) {
  		tr.children[4].children[0].value =
  		tr.children[4].children[0].dataset.newvalue == undefined ? tr.children[4].children[0].dataset.sqlvalue : tr.children[4].children[0].dataset.newvalue;
  		if (!tr.children[4].children[0].checkValidity()) err++;
  	}
  	if (count > 1) {
  		event.target.value =
  		event.target.dataset.newvalue == undefined ? event.target.dataset.sqlvalue : event.target.dataset.newvalue;
  	}
  	if (err > 0) {
  		ID('savebutton').setAttribute('disabled', '');
  	}
  }
}

function addrow(obj = null) {
  let tr = QSA("[data-vlistrow]");
  if(tr.length == 0){
    var lasttr = templateRow;
  }
  else{
	  var lasttr = tr[tr.length - 1];
    if(lasttr.children[1].children[0].value == ''){
      lasttr.parentNode.removeChild(lasttr);
    }
  }
	let newtr = lasttr.cloneNode(true);
  newtr.children[0].innerHTML = Number(newtr.children[0].innerHTML) + 1;

  if(obj == null || obj["symbol"] == undefined || obj["address"] == undefined ||
    obj["datatype"] == undefined || obj["comment"] == undefined || obj["readonly"] == undefined){

    newtr.children[1].children[0].value = stringIncrement(newtr.children[1].children[0].value);
    var pri = QSA(".primarycolumn");
    while (1){
      var ok = 1;
      for (let i = 0;i < pri.length;i++) {
        if (pri[i].value == newtr.children[1].children[0].value){
          ok = 0;
          newtr.children[1].children[0].value = stringIncrement(newtr.children[1].children[0].value);
          break;
        }
      }
      if (ok == 1) break;
    }
    newtr.children[3].children[0].value = siemensIncrement(newtr.children[3].children[0].value);
    newtr.children[2].children[0].value = lasttr.children[2].children[0].value;
    newtr.children[1].children[0].setAttribute('required', '');
    newtr.children[3].children[0].setAttribute('required', '');
    newtr.children[1].children[0].dataset.newvalue = newtr.children[1].children[0].value;
    newtr.children[1].children[0].dataset.sqlvalue = "";
    newtr.children[4].children[0].value = "";
  }
  else{
    var pri = QSA(".primarycolumn");
    for(let cell of pri){
      if(cell.value.toUpperCase() == obj.symbol.toUpperCase()){
        newtr.remove();
        return false;
      }
    }
    newtr.children[3].children[0].value = obj.address;
    newtr.children[2].children[0].value = obj.datatype;
    newtr.children[1].children[0].value = obj.symbol;
    newtr.children[1].children[0].dataset.newvalue = obj.symbol;
    newtr.children[3].children[0].dataset.newvalue = obj.address;
    newtr.children[4].children[0].dataset.newvalue = obj.comment;
    newtr.children[1].children[0].setAttribute('required', '');
    newtr.children[3].children[0].setAttribute('required', '');
    newtr.children[1].children[0].dataset.sqlvalue = "";
    newtr.children[4].children[0].value = obj.comment;
    newtr.children[5].children[0].checked = obj.readonly != "false" ? true : false;
  }
  newtr.className = "thisRowChanged";
  newtr.dataset.sql = "insert";
  //newtr.children[0].style.color = 'orange';
	document.getElementById('vartablebody').appendChild(newtr);
	ID('savebutton').setAttribute('disabled', '');
	checkGlobalChanges();
	setTimeout(() => {
	  ID("maindiv").scrollTo(0, ID("maindiv").scrollHeight);
	},1);
  return true;
}

function markToDelete(tr, forse = false) {
  if(ID('delalert').checked && !forse){
    Confirm("Biztos törli a változót? (" + tr.children[1].children[0].value + ")", "Törlés" ,"Mégsem", ()=>{
      //if(tr.parentNode.children.length <= 2) return;
      if (tr.children[1].children[0].value.length > 0 && tr.dataset.sql != 'insert') delSymbol.push(tr.children[1].children[0].value);
      console.log("Delete Array:");
      console.log(delSymbol);
      tr.remove();
      checkGlobalChanges();
    });
  }
  else{
    if (tr.children[1].children[0].value.length > 0 && tr.dataset.sql != 'insert') delSymbol.push(tr.children[1].children[0].value);
    console.log("Delete Array:");
    console.log(delSymbol);
    tr.remove();
    checkGlobalChanges();
  }
}

function checkGlobalChanges() {
  if (QSA(".thisRowChanged").length > 0 || delSymbol.length > 0) {
  	ID('unsavedalert').style.display = 'block';
  	ID('savebutton').removeAttribute('disabled');
  	window.onbeforeunload = (e) => {
      var m = "Nem mentette a munkáját!";
      (e || window.event).returnValue = m; //Gecko + IE
      return m; //Webkit, Safari, Chrome etc.
  	}
  }
  else {
  	ID('unsavedalert').style.display = 'none';
  	ID('savebutton').setAttribute('disabled', '');
  	window.onbeforeunload = null;
  }
}

function saveToSQL(firstRun = false) {
  if(firstRun){
    Tekero(true);
    delSymbolBackup = [].concat(delSymbol);//Klón
  }
  var tmp = delSymbol.pop();
  if(tmp != undefined) sqlDelete(tmp);
	else if(QSA('[data-sql="insert"].thisRowChanged')[0]) sqlInsert(QSA('[data-sql="insert"].thisRowChanged')[0]);
	else if(QSA('[data-sql="update"].thisRowChanged')[0]) sqlUpdate(QSA('[data-sql="update"].thisRowChanged')[0]);
	else {
		//Minden feltöltve
		console.log("Minden feltöltve");
		window.onbeforeunload = null;
    Tekero(false);
    ResetUI();
    Toast("Mentés sikeres.", 'ok');
		//location.reload(true);
	}
}

function ResetUI(){
  var allSql = QSA('[data-sql]');
  for(i = 0; i < allSql.length; i++){
    delete allSql[i].dataset.sql;
  }
  var allNewValue = QSA('[data-newvalue]');
  for(i = 0; i < allNewValue.length; i++){
    allNewValue[i].dataset.sqlvalue = allNewValue[i].dataset.newvalue;
    allNewValue[i].value = allNewValue[i].dataset.newvalue;
    delete allNewValue[i].dataset.newvalue;
  }
  var allChanged = QSA('.thisRowChanged');
  for(i = 0; i < allChanged.length; i++){
    allChanged[i].classList.remove('thisRowChanged');
  }
  ReNum();
  checkGlobalChanges();
}

function ReNum(){
  var renum = QSA('tr[data-vlistrow]');
  for(i = 0; i < renum.length; i++){
    renum[i].dataset.vlistrow = i + 1;
    renum[i].children[0].innerHTML = i + 1;
  } 
}

function stringIncrement(s) {
	if (s.length < 1) return "Var0";
	let t = s.match(/[^0-9]+|[0-9]+/g);
	if(isNaN(t[t.length - 1])) return s + "0";
	else {
	  t[t.length - 1]++;
	  return t.join('');
	}
}
function siemensIncrement(addr) {
  var t = [];
  if(addr.match(/^db\d+\.dbb\d+/i)){
    t = addr.match(/[^0-9]+|[0-9]+/g);
    t[t.length - 1] = Number(t[t.length - 1]) + 1;
    return t.join('').toUpperCase();
  }
  else if(addr.match(/^db\d+\.dbw\d+/i)){
    t = addr.match(/[^0-9]+|[0-9]+/g);
    t[t.length - 1] = Number(t[t.length - 1]) + 2;
    return t.join('').toUpperCase();
  }
  else if(addr.match(/^db\d+\.dbd\d+/i)){
    t = addr.match(/[^0-9]+|[0-9]+/g);
    t[t.length - 1] = Number(t[t.length - 1]) + 4;
    return t.join('').toUpperCase();
  }
  else if(addr.match(/^db\d+\.dbx\d+\.\d/i)){
    t = addr.match(/[^0-9]+|[0-9]+/g);
    t[t.length - 1] = Number(t[t.length - 1]) + 1;
    if(t[t.length - 1] > 7){
      t[t.length - 1] = 0;
      t[t.length - 3] = Number(t[t.length - 3]) + 1;
    }
    return t.join('').toUpperCase();
  }
  else if(addr.match(/^[iqm]b\d+/i)){
    t = addr.match(/[^0-9]+|[0-9]+/g);
    t[t.length - 1] = Number(t[t.length - 1]) + 1;
    return t.join('').toUpperCase();
  }
  else if(addr.match(/^[iqm]w\d+/i)){
    t = addr.match(/[^0-9]+|[0-9]+/g);
    t[t.length - 1] = Number(t[t.length - 1]) + 2;
    return t.join('').toUpperCase();
  }
  else if(addr.match(/^[iqm]d\d+/i)){
    t = addr.match(/[^0-9]+|[0-9]+/g);
    t[t.length - 1] = Number(t[t.length - 1]) + 4;
    return t.join('').toUpperCase();
  }
  else if(addr.match(/^[iqm]\d+\.\d/i)){
    t = addr.match(/[^0-9]+|[0-9]+/g);
    t[t.length - 1] = Number(t[t.length - 1]) + 1;
    if(t[t.length - 1] > 7){
      t[t.length - 1] = 0;
      t[t.length - 3] = Number(t[t.length - 3]) + 1;
    }
    return t.join('').toUpperCase();
  }
  else return addr;
}

function ExportVariables(){
  var rows = QSA("[data-vlistrow]");
  var table = [];
  for(let i = 0; i < rows.length; i++){
    table.push({
      "symbol": rows[i].children[1].children[0].value,
      "datatype": rows[i].children[2].children[0].value,
      "address": rows[i].children[3].children[0].value,
      "comment": rows[i].children[4].children[0].value,
      "readonly": rows[i].children[5].children[0].checked
    });
  }
  let csv = ObjArrayToCSV(table);
  let blob = new Blob([csv], {
    type: "text/csv",
  });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.download = "VariablesExport.csv";
  a.href = url;
  a.click();
  a.remove();
}

function ImportVariables(){
  var file = document.createElement('input');
  file.setAttribute('type', 'file');
  file.setAttribute('accept', 'text/csv');
  file.click();
  file.onchange = (e) =>{
    const reader = new FileReader();
    reader.onload = () => {
      ImportFromArray(CSVToObjArray(reader.result));
    };
    reader.readAsText(file.files[0]);
    file.remove();
  }
}

function ImportFromArray(arr){
  var countAdd = 0;
  var countAll = 0;
  for(var elem of arr){
    if(addrow(elem)) countAdd++;
    countAll++;
  }
  Alert(`${countAdd}/${countAll} elem hozzáadva.`, 'OK');
}

function DelAll(){
  Confirm("Biztos törli a csomópont összes változóját?", "Törlés" ,"Mégsem", ()=>{
    var rows = QSA("[data-vlistrow]");
    for(var row of rows){
      markToDelete(row, true);
    }
  });
}