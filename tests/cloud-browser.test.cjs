const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{createDB}=require('./cloud-fixture.cjs');
(async()=>{
 const fixture=await createDB();let queue=Promise.resolve(),dropNext=false;
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');let body='';for await(const chunk of req)body+=chunk;
  res.setHeader('Content-Type','application/json');
  if(url.pathname==='/auth/v1/token'){const data=JSON.parse(body),id=data.email?.startsWith('mother')?fixture.b:fixture.a;return res.end(JSON.stringify({access_token:id,refresh_token:id,expires_in:3600,user:{id,email:data.email}}))}
  if(url.pathname.startsWith('/rest/v1/rpc/')){
   const name=url.pathname.split('/').at(-1),id=req.headers.authorization?.replace('Bearer ','');
   try{const data=await(queue=queue.catch(()=>{}).then(()=>fixture.rpc(id,name,JSON.parse(body))));if(dropNext&&name==='mission_commit'){dropNext=false;req.socket.destroy();return}return res.end(JSON.stringify(data))}catch(e){res.statusCode=403;return res.end(JSON.stringify({message:e.message}))}
  }
  if(url.pathname==='/cloud-config.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.MISSION_CLOUD_CONFIG={url:"http://127.0.0.1:4180",publishableKey:"test-public"};')}
  const file=path.join(__dirname,'..',url.pathname.slice(1)||'index.html');try{const data=fs.readFileSync(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data)}catch{res.statusCode=404;res.end('{}')}
 });await new Promise(r=>server.listen(4180,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge'}),a=await browser.newContext({serviceWorkers:'block'}),b=await browser.newContext({serviceWorkers:'block'}),pa=await a.newPage(),pb=await b.newPage(),errors=[];
 for(const p of [pa,pb])p.on('pageerror',e=>errors.push(e.message));
 async function saved(p){await p.waitForFunction(()=>document.getElementById('familyStatus').textContent.includes('salvo online'))}
 async function login(p,email){await p.goto('http://127.0.0.1:4180');await p.click('#familyStatus');await p.fill('#familyEmail',email);await p.fill('#familyPassword','test-password');await p.click('#familySignIn')}
 await login(pa,'father@example.test');await pa.locator('#familyInitialize').waitFor({state:'visible'});await pa.fill('#familyInitialPin','2026');await pa.click('#familyStart');await saved(pa);await pa.locator('#familyDialog .close').click();
 await login(pb,'mother@example.test');await saved(pb);await pb.locator('#familyDialog .close').click();
 await pa.click('#questDone');await saved(pa);await pb.click('#questDone');await saved(pb);await pa.click('#familyStatus');await pa.click('#familyRetry');await saved(pa);await pa.locator('#familyDialog .close').click();
 const sa=await pa.evaluate(()=>JSON.stringify(state.routine.weeks)),sb=await pb.evaluate(()=>JSON.stringify(state.routine.weeks));assert.equal(sa,sb);console.log('PASS two independent browsers share marks; same-mark conflict does not undo');
 await a.setOffline(true);await pa.click('#questDone');await pa.waitForFunction(()=>document.getElementById('familyStatus').textContent.includes('Pendente'));assert.ok(await pa.evaluate(()=>localStorage.getItem('missaoFamilyPending')));await a.setOffline(false);await saved(pa);console.log('PASS offline pending action retries');
 const priorRevision=(await fixture.rpc(fixture.a,'mission_read')).revision;dropNext=true;await pa.click('#questDone');await pa.waitForFunction(()=>!localStorage.getItem('missaoFamilyPending'));await saved(pa);assert.equal((await fixture.rpc(fixture.a,'mission_read')).revision,priorRevision+1);console.log('PASS lost response retry is idempotent');
 async function parent(p){await p.click('#navParent');await p.fill('#pinInput','2026');await p.click('#unlockParent');await p.locator('#routineParent').waitFor({state:'visible'});await p.click('[data-routine-tab=settings]')}
 await pb.click('#familyStatus');await pb.click('#familyRetry');await saved(pb);await pb.locator('#familyDialog .close').click();await parent(pa);await parent(pb);
 const balance=await pa.evaluate(()=>state.pots.ps5);await pa.fill('#parentBonus','10');await pa.click('#addBonus');await saved(pa);await pb.fill('#parentBonus','20');await pb.click('#addBonus');await saved(pb);assert.equal(await pa.evaluate(()=>state.pots.ps5),balance+10);assert.equal(await pb.evaluate(()=>state.pots.ps5),balance+10);assert.ok(await pb.evaluate(()=>localStorage.getItem('missaoFamilyConflict')));console.log('PASS simultaneous money changes require review instead of overwriting');
 await pa.locator('#parentDialog .close').click();await pa.setViewportSize({width:390,height:844});await pa.click('#familyStatus');assert.equal(await pa.locator('#familyDialog .modal').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);await pa.locator('#familyDialog .close').click();await pa.reload();await saved(pa);assert.equal(await pa.evaluate(()=>state.pots.ps5),balance+10);assert.deepEqual(errors,[]);console.log('PASS session reload, mobile modal, zero browser errors');
 await browser.close();await new Promise(r=>server.close(r));await fixture.db.close();
})().catch(e=>{console.error(e);process.exit(1)});
