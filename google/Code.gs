/** Missão Bentinho. Cole este arquivo inteiro no Apps Script vinculado à planilha. */
const FAMILY_SHEET_ID = '1XRHyBTS8dvAz45pP6iq7zOkhxpa-ataLUGtw4RW5zHI';
const APP_ORIGIN = 'https://guibraganca11-cyber.github.io';
const APP_URL = APP_ORIGIN + '/missao-ps5/';
const JOURNAL_COLUMNS = 54;

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Missão Bentinho')
    .addItem('1. Ativar família', 'configurar_')
    .addItem('2. Ver conexão dos celulares', 'conexao_')
    .addItem('Atualizar consultas', 'atualizarConsultas_')
    .addToUi();
}

function configurar_() {
  const ui = SpreadsheetApp.getUi(), props = PropertiesService.getScriptProperties();
  if (props.getProperty('FAMILY_KEY')) { ui.alert('A família já está configurada. Use Ver conexão dos celulares.'); return; }
  const answer = ui.prompt('PIN da área do pai', 'Escolha de 6 a 12 dígitos. Não use o código familiar como PIN.', ui.ButtonSet.OK_CANCEL);
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  const pin = answer.getResponseText().trim();
  if (!/^\d{6,12}$/.test(pin)) { ui.alert('O PIN precisa ter de 6 a 12 dígitos.'); return; }
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    if (props.getProperty('FAMILY_KEY')) return;
    const book = SpreadsheetApp.openById(FAMILY_SHEET_ID);
    book.setSpreadsheetTimeZone('America/Sao_Paulo');
    if (!book.getSheetByName('_Estado')) {
      const sheet = book.insertSheet('_Estado');
      sheet.insertColumnsAfter(sheet.getMaxColumns(), JOURNAL_COLUMNS - sheet.getMaxColumns());
      sheet.getRange(1, 1, 1, JOURNAL_COLUMNS).setValues([['Revisão', 'Operação', 'Atualizado', 'SHA256', ...Array.from({length:50}, (_, i) => 'Parte ' + (i+1))]]);
      sheet.hideSheet();
    }
    const salt = Utilities.getUuid();
    props.setProperties({FAMILY_KEY: Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''), PIN_SALT: salt, PIN_HASH: hash_(salt + ':' + pin)});
    book.getSheetByName('Resumo').getRange('B4').setValue('Configurada; aguardando primeiro celular');
    ui.alert('Configuração salva. Agora publique como aplicativo da Web e depois use Ver conexão dos celulares. Nenhum histórico foi substituído.');
  } finally { lock.releaseLock(); }
}

function conexao_() {
  const key = PropertiesService.getScriptProperties().getProperty('FAMILY_KEY');
  if (!key) { SpreadsheetApp.getUi().alert('Use Ativar família primeiro.'); return; }
  const endpoint = ScriptApp.getService().getUrl();
  if (!endpoint) { SpreadsheetApp.getUi().alert('Publique em Implantar → Nova implantação → Aplicativo da Web primeiro.'); return; }
  // Secrets only appear in this owner-opened dialog; never in sheet cells or public source.
  const html = '<p>Abra o mesmo aplicativo em cada celular. Toque em Conectar família e preencha:</p>' +
    '<label>Endereço do serviço<textarea readonly style="width:100%;height:65px">' + escape_(endpoint) + '</textarea></label>' +
    '<label>Código familiar<textarea readonly style="width:100%;height:65px">' + escape_(key) + '</textarea></label>' +
    '<p>Compartilhe estes dois campos somente com a família. Quem tiver o código pode ver os dados e marcar tarefas. O PIN separado protege dinheiro e configurações.</p>' +
    '<a target="_blank" rel="noopener" href="' + APP_URL + '">Abrir o aplicativo</a>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(500).setHeight(370), 'Conexão dos celulares');
}

function doGet(e) {
  const channel = String(e && e.parameter && e.parameter.channel || '');
  if (!/^[a-f0-9-]{36}$/i.test(channel)) return HtmlService.createHtmlOutput('Conexão da Missão Bentinho. Abra o aplicativo da família.');
  // This bridge solves browser cross-origin restrictions without exposing data in JSONP/URLs.
  const html = '<!doctype html><meta charset="utf-8"><script>' +
    'const channel=' + JSON.stringify(channel) + ',origin=' + JSON.stringify(APP_ORIGIN) + ';' +
    'window.addEventListener("message",e=>{if(e.origin!==origin||e.source!==window.top||!e.data||e.data.channel!==channel||e.data.type!=="mission-request")return;' +
    'const id=e.data.id;google.script.run.withSuccessHandler(result=>window.top.postMessage({type:"mission-response",channel,id,result},origin))' +
    '.withFailureHandler(()=>window.top.postMessage({type:"mission-response",channel,id,result:{error:"Serviço indisponível. Tente novamente."}},origin)).mission(e.data.request);});' +
    'window.top.postMessage({type:"mission-ready",channel},origin);<\/script>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// The only remotely callable data operation. Everything else is private (trailing underscore).
function mission(request) {
  try {
    const props = PropertiesService.getScriptProperties(), key = props.getProperty('FAMILY_KEY');
    if (!key || !request || !equal_(String(request.key || ''), key)) return {error:'Código familiar inválido.', auth:true};
    if (!['mission_read','mission_check_pin','mission_commit'].includes(request.action)) throw Error('Operação inválida.');
    const lock = LockService.getScriptLock(); lock.waitLock(15000);
    try {
      const book = SpreadsheetApp.openById(FAMILY_SHEET_ID), sheet = book.getSheetByName('_Estado');
      if (!sheet) throw Error('Ative a família pela planilha primeiro.');
      const body = request.body || {};
      if (request.action === 'mission_check_pin') return {value:checkPin_(body.p_pin, props)};
      const current = read_(sheet);
      if (request.action === 'mission_read') return {value:current};
      if (!/^[a-f0-9-]{36}$/i.test(String(body.p_operation || ''))) throw Error('Operação sem identificador válido.');
      const count = sheet.getLastRow()-1;
      if (count && sheet.getRange(2,2,count,1).createTextFinder(body.p_operation).matchEntireCell(true).findNext()) return {value:Object.assign(current,{ok:true})};
      if (body.p_revision !== current.revision) return {value:Object.assign(current,{ok:false,conflict:true})};
      validate_(body.p_data);
      const parent = body.p_pin != null && checkPin_(body.p_pin, props);
      if (!parent && !childChange_(current.data, body.p_data, today_())) return {value:{ok:false,denied:true}};
      const text = JSON.stringify(body.p_data), encoded = Utilities.base64EncodeWebSafe(text, Utilities.Charset.UTF_8);
      if (encoded.length > 1400000) throw Error('A base atingiu o limite desta versão. Não apague o histórico; peça uma ampliação.');
      const result = {family:FAMILY_SHEET_ID,name:'Família do Bentinho',revision:current.revision+1,updated_at:new Date().toISOString(),data:body.p_data};
      const row = [result.revision, body.p_operation, result.updated_at, hash_(text)];
      for (let i=0;i<50;i++) row.push(encoded.slice(i*28000,(i+1)*28000));
      // Append one complete record. Old versions stay intact; retries use the operation ID.
      const nextRow = sheet.getLastRow()+1;
      if (nextRow>sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),100);
      sheet.getRange(nextRow,1,1,JOURNAL_COLUMNS).setValues([row]);
      SpreadsheetApp.flush();
      const verified=read_(sheet);
      if (verified.revision!==result.revision) throw Error('A gravação não pôde ser confirmada.');
      try { project_(book, verified); } catch (_) { verified.report_warning=true; }
      return {value:Object.assign(verified,{ok:true})};
    } finally { lock.releaseLock(); }
  } catch (error) { return {error:String(error.message || 'Falha na conexão.')}; }
}

function hash_(text) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8).map(x=>(x & 255).toString(16).padStart(2,'0')).join(''); }
function equal_(a,b) { if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0; }
function today_() { return Utilities.formatDate(new Date(),'America/Sao_Paulo','yyyy-MM-dd'); }
function checkPin_(pin,props) {
  let attempts=JSON.parse(props.getProperty('PIN_ATTEMPTS')||'{"count":0,"since":0}');
  if(Date.now()-attempts.since>300000)attempts={count:0,since:Date.now()};
  if(attempts.count>=5)return false;
  const valid=equal_(hash_(props.getProperty('PIN_SALT')+':'+String(pin||'')),props.getProperty('PIN_HASH')||'');
  if(valid)attempts.count=0;else attempts.count++;
  props.setProperty('PIN_ATTEMPTS',JSON.stringify(attempts));return valid;
}
function read_(sheet) {
  if(sheet.getLastRow()<2)return {family:FAMILY_SHEET_ID,name:'Família do Bentinho',revision:0,data:null,updated_at:null};
  const row=sheet.getRange(sheet.getLastRow(),1,1,JOURNAL_COLUMNS).getValues()[0];
  const text=Utilities.newBlob(Utilities.base64DecodeWebSafe(row.slice(4).join(''))).getDataAsString('UTF-8');
  if(hash_(text)!==row[3])throw Error('A última gravação está incompleta. Histórico preservado; solicite revisão.');
  return {family:FAMILY_SHEET_ID,name:'Família do Bentinho',revision:Number(row[0]),updated_at:String(row[2]),data:JSON.parse(text)};
}
function stable_(value) { if(Array.isArray(value))return '['+value.map(stable_).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable_(value[k])).join(',')+'}';return JSON.stringify(value); }
function copy_(value) { return JSON.parse(JSON.stringify(value)); }
function monday_(day) { const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10); }
function validate_(data) {
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.prototype.hasOwnProperty.call(data,'pin')||JSON.stringify(data).length>500000)throw Error('Dados inválidos ou grandes demais.');
  function walk(v){if(!v||typeof v!=='object')return;Object.keys(v).forEach(k=>{if(['__proto__','constructor','prototype'].includes(k))throw Error('Campo inválido.');walk(v[k]);});}walk(data);
  if(!data.pots||!data.routine||!Array.isArray(data.history)||!Array.isArray(data.claimedWeeks)||!Array.isArray(data.routine.plans)||!data.routine.plans.length||!data.routine.weeks||!Array.isArray(data.routine.extras)||!Array.isArray(data.routine.extraEntries))throw Error('Base incompleta.');
  if(!Number.isFinite(data.goal)||data.goal<=0||!Number.isFinite(data.weekly)||data.weekly<=0)throw Error('Meta ou recompensa inválida.');
  ['ps5','spend','future'].forEach(k=>{if(!Number.isFinite(data.pots[k])||data.pots[k]<0)throw Error('Saldo inválido.');});
  const safeId=id=>typeof id==='string'&&/^[a-zA-Z0-9_.:-]{1,100}$/.test(id);
  const task=t=>{if(!safeId(t.id)||typeof t.name!=='string'||!t.name.trim()||t.name.length>300||!Number.isInteger(t.count)||t.count<1||t.count>10||!Array.isArray(t.days)||!t.days.length||t.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Tarefa inválida.');};
  data.routine.plans.forEach(p=>{if(!Array.isArray(p.tasks)||!p.tasks.length||new Set(p.tasks.map(t=>t.id)).size!==p.tasks.length||!(p.threshold>0&&p.threshold<=100)||!(p.reward>0))throw Error('Plano inválido.');p.tasks.forEach(task);});
  Object.values(data.routine.weeks).forEach(w=>{if(!Array.isArray(w.tasks)||!w.marks||typeof w.paid!=='boolean')throw Error('Semana inválida.');w.tasks.forEach(task);});
  [...data.routine.extras,...data.routine.extraEntries].forEach(e=>{if(!safeId(e.id)||typeof e.name!=='string'||!Number.isFinite(e.value)||e.value<=0)throw Error('Extra inválido.');});
}
function childChange_(before,after,today) {
  if(!before)return false;
  try {
    const a=copy_(before),b=copy_(after),week=monday_(today);
    delete a.routine.weeks;delete b.routine.weeks;delete a.routine.extraEntries;delete b.routine.extraEntries;
    if(stable_(a)!==stable_(b))return false;
    const oldWeeks=before.routine.weeks,newWeeks=after.routine.weeks;
    if(Object.keys(oldWeeks).some(k=>!Object.prototype.hasOwnProperty.call(newWeeks,k)))return false;
    for(const start of Object.keys(newWeeks)){
      let old=oldWeeks[start];const next=newWeeks[start];
      if(stable_(old)===stable_(next))continue;
      if(start!==week)return false;
      if(!old){const p=before.routine.plans.filter(p=>p.effective<=week).sort((a,b)=>b.effective.localeCompare(a.effective))[0];if(!p)return false;old={start:week,tasks:p.tasks,threshold:p.threshold,reward:p.reward,marks:{},paid:false,legacyPaid:false};}
      const x=copy_(old),y=copy_(next);delete x.marks;delete y.marks;
      if(old.paid||stable_(x)!==stable_(y)||Object.keys(old.marks).some(k=>!Object.prototype.hasOwnProperty.call(next.marks,k)))return false;
      for(const key of Object.keys(next.marks)){
        if(next.marks[key]===old.marks[key])continue;
        const parts=key.split('|');if(parts.length!==3||typeof next.marks[key]!=='boolean')return false;
        const [day,id,n]=parts,slot=Number(n),t=next.tasks.find(t=>t.id===id),date=new Date(day+'T12:00:00Z');
        if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==day||monday_(day)!==week||day>today||!t||!Number.isInteger(slot)||slot<0||slot>=t.count||!t.days.includes((date.getUTCDay()+6)%7))return false;
      }
    }
    const oldEntries=before.routine.extraEntries,newEntries=after.routine.extraEntries;
    if(new Set(newEntries.map(e=>e.id)).size!==newEntries.length)return false;
    for(const entry of newEntries){const old=oldEntries.find(e=>e.id===entry.id);if(old){if(stable_(old)!==stable_(entry))return false;continue;}const extra=before.routine.extras.find(e=>e.id===entry.extraId&&e.active);if(!extra||stable_(Object.keys(entry).sort())!==stable_(['day','extraId','id','name','status','value'])||entry.status!=='pending'||entry.day!==today||entry.name!==extra.name||entry.value!==extra.value)return false;}
    return !oldEntries.some(e=>e.status!=='pending'&&!newEntries.some(n=>n.id===e.id));
  }catch(_){return false;}
}

function escape_(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cell_(value) { return typeof value==='string'&&/^[=+@-]/.test(value)?"'"+value:value; }
function writeView_(book,name,rows,width) {
  const sheet=book.getSheetByName(name);if(!sheet)throw Error('Aba ausente: '+name);
  const size=Math.max(rows.length,sheet.getLastRow()-4,1);
  if(size+4>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),size+4-sheet.getMaxRows());
  const values=Array.from({length:size},(_,i)=>rows[i]?rows[i].map(cell_):Array(width).fill(''));
  sheet.getRange(5,1,size,width).setValues(values);
  sheet.getRange(5,1,size,width).setFontFamily('Arial').setFontSize(11);
}
function project_(book,record) {
  if(!record.data)return;
  const state=record.data,today=today_(),week=monday_(today),plan=state.routine.plans.filter(p=>p.effective<=week).sort((a,b)=>b.effective.localeCompare(a.effective))[0],w=state.routine.weeks[week]||plan;
  const summary=book.getSheetByName('Resumo');
  summary.getRange('B4:B11').setValues([['Conectada'],[record.updated_at],[state.pots.ps5],[state.pots.spend],[state.pots.future],[state.goal],[w.reward],[w.threshold/100]]);
  summary.getRange('A18').setValue('Última revisão: '+record.revision+'. As consultas abaixo são atualizadas pelo app.');
  summary.getRange('A20').setValue('Não edite estas consultas manualmente: use o aplicativo para manter o histórico consistente.');
  const days=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  writeView_(book,'Rotina',w.tasks.map(t=>[t.name,t.count,t.days.length,t.count*t.days.length,t.days.map(d=>days[d]).join(', ')]),5);
  book.getSheetByName('Rotina').getRange(5,4,w.tasks.length,1).setFormulas(w.tasks.map((_,i)=>['=B'+(i+5)+'*C'+(i+5)]));
  summary.getRange('B12').setFormula('=SUM(Rotina!D5:D'+(4+w.tasks.length)+')');
  summary.getRange('B13').setFormula('=ROUNDUP(B12*B11;0)');
  const marks=[];
  Object.keys(state.routine.weeks).sort().forEach(start=>{const w=state.routine.weeks[start];Object.keys(w.marks).sort().forEach(k=>{const [day,id,slot]=k.split('|'),t=w.tasks.find(t=>t.id===id);marks.push([start,day,t?t.name:id,Number(slot)+1,w.marks[k]?'Sim':'Não',w.paid?'Sim':'Não']);});});
  writeView_(book,'Marcações',marks,6);
  writeView_(book,'Dinheiro',state.history.map(h=>[h.date||'',h.type||'',h.source||'',Number.isFinite(h.value)?h.value:'',JSON.stringify(h)]),5);
  if(state.history.length)book.getSheetByName('Dinheiro').getRange(5,4,state.history.length,1).setNumberFormat('"R$" #,##0.00');
}
function atualizarConsultas_() {
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{const book=SpreadsheetApp.openById(FAMILY_SHEET_ID),sheet=book.getSheetByName('_Estado');if(!sheet)throw Error('Ative a família primeiro.');project_(book,read_(sheet));}finally{lock.releaseLock();}
}
