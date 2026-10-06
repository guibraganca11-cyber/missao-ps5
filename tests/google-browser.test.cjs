const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{fixture}=require('./google-fixture.cjs');
(async()=>{
 const f=fixture(),app='https://guibraganca11-cyber.github.io/missao-ps5/',endpoint='https://script.google.com/macros/s/TEST_DEPLOYMENT/exec';let dropNext=false;
 const browser=await chromium.launch({channel:'msedge'}),contexts=[];
 try{
 async function page(){const context=await browser.newContext({serviceWorkers:'block'});contexts.push(context);await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.hostname==='script.google.com'&&url.pathname.endsWith('/exec'))return route.fulfill({contentType:'text/html',body:`<iframe src="https://test-script.googleusercontent.com/bridge?channel=${url.searchParams.get('channel')}"></iframe>`});
  if(url.hostname==='test-script.googleusercontent.com'&&url.pathname==='/bridge'){
   const bridge=f.context.doGet({parameter:{channel:url.searchParams.get('channel')}}).html;
   const shim='<script>window.google={script:{run:{withSuccessHandler(fn){this.success=fn;return this},withFailureHandler(fn){this.failure=fn;return this},mission(request){const ok=this.success,fail=this.failure;fetch("/rpc",{method:"POST",body:JSON.stringify(request)}).then(r=>r.json()).then(ok,fail)}}}};</script>';
   return route.fulfill({contentType:'text/html',body:shim+bridge});
  }
  if(url.hostname==='test-script.googleusercontent.com'&&url.pathname==='/rpc'){
   const req=JSON.parse(route.request().postData()),result=f.call(req.action,req.body,req.key);
   if(dropNext&&req.action==='mission_commit'){dropNext=false;return route.abort('failed')}
   return route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  }
  if(url.hostname==='guibraganca11-cyber.github.io'){
   const relative=url.pathname.replace(/^\/missao-ps5\//,'')||'index.html',file=path.resolve(__dirname,'..',relative);
   if(!file.startsWith(path.resolve(__dirname,'..')+path.sep))return route.abort();
   try{return route.fulfill({contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)})}catch{return route.fulfill({status:404,body:''})}
  }return route.abort();
 });return {context,page:await context.newPage()};}
 const a=await page(),b=await page(),pa=a.page,pb=b.page,errors=[];
 for(const p of [pa,pb])p.on('pageerror',e=>errors.push(e.message));
 async function saved(p){await p.waitForFunction(()=>document.getElementById('familyStatus').textContent.includes('salvo online')&&!localStorage.getItem('missaoFamilyPending'))}
 async function login(p){await p.goto(app);await p.click('#familyStatus');await p.fill('#familyEndpoint',endpoint);await p.fill('#familyPassword',f.key);await p.click('#familySignIn')}
 await login(pa);await pa.locator('#familyInitialize').waitFor({state:'visible'});await pa.fill('#familyInitialPin',f.pin);await pa.click('#familyStart');await saved(pa);await pa.locator('#familyDialog .close').click();
 await login(pb);await saved(pb);await pb.locator('#familyDialog .close').click();
 await pa.evaluate(()=>{const yesterday=Routine.add(Routine.dateKey(new Date()),-1),w=Routine.week(state,Routine.monday(yesterday));w.tasks.filter(t=>t.days.includes(Routine.days(w.start).indexOf(yesterday))).forEach(t=>{for(let i=0;i<t.count;i++)w.marks[Routine.key(yesterday,t.id,i)]=true});saveState()});await saved(pa);await pa.reload();await saved(pa);assert.match(await pa.locator('.previous-day-proof').innerText(),/Dia concluído e salvo[\s\S]*10\/10/);console.log('PASS completed previous day stays visible after reload');
 await pa.click('#questDone');await saved(pa);await pb.click('#questDone');await saved(pb);assert.equal(f.call('mission_read').value.revision,4);console.log('PASS Google nested iframe bridge + two browsers + mark conflict');
 await a.context.setOffline(true);await pa.click('#questDone');await pa.waitForFunction(()=>document.getElementById('familyStatus').textContent.includes('Pendente'));await a.context.setOffline(false);await saved(pa);console.log('PASS Google offline queue retry');
 const revision=f.call('mission_read').value.revision;dropNext=true;await pa.click('#questDone');await pa.waitForFunction(()=>document.getElementById('familyStatus').textContent.includes('Pendente'));await pa.click('#familyStatus');await pa.click('#familyRetry');await saved(pa);await pa.locator('#familyDialog .close').click();assert.equal(f.call('mission_read').value.revision,revision+1);console.log('PASS Google lost response is deduplicated');
 async function refresh(p){await p.click('#familyStatus');await p.click('#familyRetry');await saved(p);await p.locator('#familyDialog .close').click()}
 async function parent(p){await p.click('#navParent');await p.fill('#pinInput',f.pin);await p.click('#unlockParent');await p.locator('#routineParent').waitFor({state:'visible'});await p.click('[data-routine-tab=settings]')}
 await refresh(pb);await parent(pa);await parent(pb);const balance=await pa.evaluate(()=>state.pots.ps5);await pa.fill('#parentBonus','10');await pa.click('#addBonus');await saved(pa);await pb.fill('#parentBonus','20');await pb.click('#addBonus');await saved(pb);assert.equal(await pb.evaluate(()=>state.pots.ps5),balance+10);assert.ok(await pb.evaluate(()=>localStorage.getItem('missaoFamilyConflict')));console.log('PASS Google concurrent money never overwrites silently');
 await pa.locator('#parentDialog .close').click();await pa.reload();await saved(pa);assert.equal(await pa.evaluate(()=>state.pots.ps5),balance+10);await pa.setViewportSize({width:390,height:844});await pa.click('#familyStatus');assert.equal(await pa.locator('#familyDialog .modal').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);assert.deepEqual(errors,[]);console.log('PASS Google session reload + mobile + no browser errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
