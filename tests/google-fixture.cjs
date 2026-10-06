const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function fixture(){
 const props=new Map(),sheets=new Map(),key='a'.repeat(64),pin='123456';let locked=false;
 function sheet(name){const rows=[];let maxRows=1000,maxColumns=26;
  function range(row,col,height=1,width=1){if(typeof row==='string'){const m=/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(row),num=s=>[...s].reduce((a,c)=>a*26+c.charCodeAt(0)-64,0);col=num(m[1]);row=Number(m[2]);height=m[4]?Number(m[4])-row+1:1;width=m[3]?num(m[3])-col+1:1;}
   const r={getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row-1+i]?.[col-1+j]??'')),setValues(values){if(values.length!==height||values.some(x=>x.length!==width))throw Error('Bad range shape');values.forEach((v,i)=>{rows[row-1+i]??=[];v.forEach((x,j)=>rows[row-1+i][col-1+j]=x)});return r;},setValue(v){return r.setValues([[v]])},setFormula(v){return r.setValue(v)},setFormulas(v){return r.setValues(v)},setFontFamily(){return r},setFontSize(){return r},setNumberFormat(){return r},createTextFinder(value){return {matchEntireCell(){return this},findNext(){return r.getValues().some(x=>x[0]===value)?{}:null}}}};return r;
  }
  return {rows,getRange:range,getLastRow(){let n=rows.length;while(n&&!rows[n-1]?.some(x=>x!==''&&x!==null&&x!==undefined))n--;return n},getMaxRows:()=>maxRows,getMaxColumns:()=>maxColumns,insertRowsAfter(_,n){maxRows+=n},insertColumnsAfter(_,n){maxColumns+=n},hideSheet(){}};
 }
 const book={getSheetByName:n=>sheets.get(n)||null,insertSheet(n){const s=sheet(n);sheets.set(n,s);return s},setSpreadsheetTimeZone(){}};
 for(const n of ['Resumo','Rotina','Marcações','Dinheiro','_Estado']){const s=book.insertSheet(n);if(n==='_Estado')s.getRange(1,1).setValue('Revisão');}
 const properties={getProperty:k=>props.get(k)||null,setProperty(k,v){props.set(k,v)},setProperties(obj){Object.entries(obj).forEach(([k,v])=>props.set(k,v))}};
 const context={console,Date,JSON,Math,Number,String,Object,Array,Set,RegExp,Error,PropertiesService:{getScriptProperties:()=>properties},LockService:{getScriptLock:()=>({waitLock(){if(locked)throw Error('lock conflict');locked=true},releaseLock(){locked=false}})},SpreadsheetApp:{openById:()=>book,flush(){}},Utilities:{getUuid:()=>crypto.randomUUID(),Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(algo,t)=>[...crypto.createHash(algo).update(t).digest()],base64EncodeWebSafe:t=>Buffer.from(t).toString('base64url'),base64DecodeWebSafe:t=>Buffer.from(t,'base64url'),newBlob:b=>({getDataAsString:()=>Buffer.from(b).toString('utf8')}),formatDate:d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(d)},HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALLOWALL'},createHtmlOutput:html=>({html,setXFrameOptionsMode(){return this}})}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../google/Code.gs'),'utf8'),context);
 props.set('FAMILY_KEY',key);props.set('PIN_SALT','test-salt');props.set('PIN_HASH',context.hash_('test-salt:'+pin));
 const call=(action,body={},overrideKey=key)=>context.mission({key:overrideKey,action,body});
 return {context,book,props,key,pin,call};
}
module.exports={fixture};
