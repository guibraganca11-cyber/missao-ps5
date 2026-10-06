/* Optional family sync. Google Sheets is the default; legacy Supabase remains compatible. */
(() => {
  const cfg={...(window.MISSION_CLOUD_CONFIG||{})},google=cfg.provider==='google-sheets',M=MissionSyncModel;
  if(google&&!cfg.url)cfg.url=localStorage.getItem('missaoGoogleEndpoint')||'';
  let configured=google?!!cfg.url:!!(cfg.url&&cfg.publishableKey);
  const $=id=>document.getElementById(id),SESSION='missaoFamilySession',PENDING='missaoFamilyPending';
  let session=null,remote=null,pending=null,parentPin=null,busy=false,ready=false,signingIn=false,unlockPass=false,lastSync=null,needsLogin=false;
  try{session=JSON.parse(localStorage.getItem(SESSION)||'null');pending=JSON.parse(localStorage.getItem(PENDING)||'null')}catch{}
  if(session?.project!==cfg.url)session=null;
  const button=document.createElement('button');button.type='button';button.id='familyStatus';button.className='family-status';button.textContent='Neste aparelho · conectar família';document.querySelector('.journal-header').after(button);
  const dialog=document.createElement('dialog');dialog.id='familyDialog';dialog.setAttribute('aria-labelledby','familyTitle');dialog.innerHTML=`<form method="dialog" class="modal family-modal"><button class="close" aria-label="Fechar">×</button><p class="modal-kicker">MESMA MISSÃO, EM TODOS OS CELULARES</p><h2 id="familyTitle">Nossa família</h2><p id="familyExplanation" class="routine-note"></p><section id="familyLogin"><label>E-mail do responsável<input id="familyEmail" type="email" autocomplete="username" required></label><label>Senha da conta<input id="familyPassword" type="password" autocomplete="current-password" required></label><button type="button" id="familySignIn" class="cta big">Entrar na família</button></section><section id="familyConnected" hidden><p id="familyWho" class="routine-note"></p><button type="button" id="familyRetry" class="secondary big">Atualizar agora</button><button type="button" id="familySignOut" class="secondary big">Sair deste aparelho</button></section><section id="familyInitialize" hidden><p class="routine-note">A família ainda não tem registros online. O primeiro responsável pode iniciar com os dados deste aparelho. Nos demais celulares, os dados da família serão carregados automaticamente.</p><label>PIN do responsável<input id="familyInitialPin" type="password" inputmode="numeric" autocomplete="off"></label><button type="button" id="familyStart" class="cta big">Iniciar família com estes dados</button></section><p id="familyFeedback" class="routine-note" role="status"></p></form>`;document.body.append(dialog);
  dialog.querySelector('form').noValidate=true;
  if(google){
    $('familyEmail').closest('label').hidden=true;
    $('familyPassword').closest('label').firstChild.textContent='Código familiar';
    $('familyPassword').autocomplete='off';
    const label=document.createElement('label');label.textContent='Endereço do serviço Google';
    const input=document.createElement('input');input.id='familyEndpoint';input.type='url';input.placeholder='https://script.google.com/macros/s/…/exec';input.value=cfg.url;label.append(input);$('familyLogin').prepend(label);
  }
  function message(text){$('familyFeedback').textContent=text}
  function status(text){button.textContent=text;button.dataset.online=ready&&!pending?'true':'false'}
  function show(){
    $('familyExplanation').textContent=google?'Use o endereço do serviço e o código mostrados no menu Missão Bentinho da planilha. Configure uma vez em cada celular. Quem tiver o código pode ver a família e marcar tarefas; o PIN separado protege dinheiro e ajustes.':!configured?'A conexão online está preparada, mas o serviço da família ainda precisa ser ativado. Por enquanto, as marcações ficam somente neste navegador.':session?'Entre com as contas autorizadas da mesma família nos dois aparelhos. O PIN continua protegendo a área do pai.':'Use a conta de responsável cadastrada para esta família. Compartilhar só o link não libera acesso aos dados.';
    $('familyLogin').hidden=(!google&&!configured)||(!!session&&!needsLogin);$('familyConnected').hidden=!session;$('familyInitialize').hidden=!session||!remote||remote.data!==null;
    $('familyWho').textContent=session?`Conta conectada: ${session.user.email}. ${lastSync?`Última confirmação: ${lastSync.toLocaleTimeString('pt-BR')}.`:''}`:'';
  }
  button.onclick=()=>{show();dialog.showModal()};
  function storeSession(value){session=value?{...value,project:cfg.url,expires_at:Date.now()+value.expires_in*1000}:null;if(session)localStorage.setItem(SESSION,JSON.stringify(session));else localStorage.removeItem(SESSION)}
  async function auth(grant,body){
    if(google){
      const url=grant==='password'?$('familyEndpoint').value.trim():cfg.url,key=grant==='password'?body.password.trim():body.refresh_token;
      if(pending&&pending.project!==url)throw Error('Conclua a gravação pendente no serviço original antes de trocar.');
      const record=await MissionGoogleTransport.call(url,key,'mission_read');
      cfg.url=url;configured=true;localStorage.setItem('missaoGoogleEndpoint',url);
      return {access_token:key,refresh_token:key,expires_in:31536000,user:{id:record.family,email:'Família do Bentinho'}};
    }
    const r=await fetch(`${cfg.url}/auth/v1/token?grant_type=${grant}`,{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});const data=await r.json();if(!r.ok)throw Error('Não foi possível entrar. Confira e-mail, senha e conexão.');return data
  }
  async function token(){if(!session)throw Error('Entre na conta da família.');if(Date.now()>session.expires_at-60000){try{storeSession(await auth('refresh_token',{refresh_token:session.refresh_token}))}catch(error){needsLogin=true;show();throw error}}return session.access_token}
  async function rpc(name,body={}){const bearer=await token();
    if(google){try{return await MissionGoogleTransport.call(cfg.url,bearer,name,body)}catch(error){if(error.auth){needsLogin=true;ready=false;show()}throw error}}
    const r=await fetch(`${cfg.url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});let data;try{data=await r.json()}catch{throw Error('O serviço não respondeu. Tente novamente.')}if(!r.ok){if(r.status===401){needsLogin=true;ready=false;show();throw Error('Sua sessão expirou. Entre novamente.')}if(data.message?.includes('FAMILY_ACCESS_DENIED'))throw Error('Esta conta ainda não foi autorizada para a família.');throw Error('Não foi possível gravar na família. Confira a configuração do serviço.')}return data}
  function accept(record){
    remote=record;if(record.data){const localPin=state.pin;state={...structuredClone(record.data),pin:localPin};localStorage.setItem('missaoPs5V2',JSON.stringify(state));renderAll();if(missionsDialog.open)renderMissionDialog();document.dispatchEvent(new Event('mission:cloud-updated'));}
    ready=record.data!==null;lastSync=new Date();status(ready?'Família conectada · salvo online':'Família conectada · iniciar registros');show();
    if(record.report_warning){message('Dados salvos. A consulta visual da planilha ficou pendente; use Atualizar consultas no menu da planilha.');toast('Salvo online. A consulta da planilha precisa ser atualizada.');}
  }
  function savePending(){if(pending)localStorage.setItem(PENDING,JSON.stringify(pending));else localStorage.removeItem(PENDING)}
  async function send(){
    if(busy||!session||!pending)return;busy=true;status('Enviando para a família…');
    try{
      if(pending.owner!==session.user.id||pending.project!==cfg.url)throw Error('Há uma gravação de outra conta aguardando. Entre na conta original para concluir.');
      let result=await rpc('mission_commit',{p_revision:pending.revision,p_data:pending.after,p_operation:pending.operation,p_pin:parentPin});
      if(result.conflict){
        const merged=M.rebaseMarks(pending.before,pending.after,result.data);
        if(merged){pending={...pending,before:result.data,after:merged,revision:result.revision};savePending();result=await rpc('mission_commit',{p_revision:pending.revision,p_data:pending.after,p_operation:pending.operation,p_pin:parentPin});}
      }
      if(result.ok){pending=null;savePending();accept(result)}
      else if(result.conflict){
        localStorage.setItem('missaoFamilyConflict',JSON.stringify(pending));pending=null;savePending();accept(result);toast('Outro aparelho atualizou estes dados. Confira antes de repetir a alteração.');message('A alteração não foi aplicada porque outro aparelho gravou primeiro. Os dados online foram carregados; confira os valores antes de tentar novamente.');
      }else if(result.denied){status('Pendente · confirme o PIN do responsável');message('Esta alteração exige o PIN do responsável. Abra a área do pai e confirme o PIN para concluir.');}
      else throw Error('Resposta inesperada do serviço. A alteração continua pendente.');
    }catch(error){status('Pendente neste aparelho · sem confirmação online');message(error.message)}finally{busy=false;if(!parentDialog.open&&!pending)parentPin=null;show()}
  }
  async function pull(){
    if(!session||busy)return;if(pending){await send();return}
    busy=true;
    try{const record=await rpc('mission_read');if(!remote||record.revision!==remote.revision||!ready)accept(record);else{lastSync=new Date();status('Família conectada · salvo online')}}catch(error){ready=false;status('Sem conexão · reconectar família');message(error.message)}finally{busy=false;show()}
  }
  const localSave=saveState;
  saveState=function(){
    if(!configured||!session){localSave();return}
    if(!ready||busy||pending){toast('Aguarde a confirmação online antes de alterar novamente.');return}
    const after=M.wire(state);pending={owner:session.user.id,project:cfg.url,operation:crypto.randomUUID(),revision:remote.revision,before:remote.data,after};savePending();localSave();send();
  };
  // Block a new action before it mutates state while saving/reconnecting.
  const mutations='[data-mark],[data-extra-done],[data-cancel-extra],[data-toggle-extra],[data-approve-extra],[data-reject-extra],#saveIncome,#addBonus,#saveParent,#saveRoutinePlan,#createExtra,#confirmBalances,#approveRoutineWeek,#claimWeek,#useMission';
  document.addEventListener('click',e=>{const b=e.target.closest(mutations);if(!b||!configured||!session)return;if(!ready||busy||pending){e.preventDefault();e.stopImmediatePropagation();toast('Aguarde a conexão e a confirmação das alterações.');}},true);
  unlockParent.addEventListener('click',async e=>{
    if(!configured||!session||unlockPass)return;e.preventDefault();e.stopImmediatePropagation();const pin=pinInput.value;
    try{if(await rpc('mission_check_pin',{p_pin:pin})){parentPin=pin;const localPin=state.pin;state.pin=pin;unlockPass=true;try{unlockParent.click()}finally{unlockPass=false;state.pin=localPin}if(pending)send()}else pinFeedback.textContent='PIN incorreto ou muitas tentativas. Aguarde e tente novamente.'}catch(error){pinFeedback.textContent=error.message}
  },true);
  parentDialog.addEventListener('close',()=>{if(!pending)parentPin=null});
  $('familySignIn').onclick=async()=>{
    if(signingIn)return;signingIn=true;message('Conectando…');
    try{
      const email=$('familyEmail').value.trim(),password=$('familyPassword').value;
      const result=await auth('password',{email,password});
      if(pending&&pending.owner!==result.user.id)throw Error('Conclua primeiro a gravação pendente com a conta original.');
      storeSession(result);needsLogin=false;$('familyPassword').value='';remote=null;ready=false;await pull();if(ready)message('Pronto. Este aparelho está usando os dados compartilhados da família.');
    }catch(error){message(error.message)}finally{signingIn=false;show()}
  };
  $('familyStart').onclick=async()=>{
    if(busy||!remote||remote.data!==null)return;const pin=$('familyInitialPin').value;
    try{if(!await rpc('mission_check_pin',{p_pin:pin})){message('Confira o PIN do responsável.');return}parentPin=pin;pending={owner:session.user.id,project:cfg.url,operation:crypto.randomUUID(),revision:remote.revision,before:null,after:M.wire(state)};savePending();$('familyInitialPin').value='';await send();if(ready)message('Família iniciada. O outro aparelho já pode entrar.')}catch(error){message(error.message)}
  };
  $('familyRetry').onclick=()=>pull();
  $('familySignOut').onclick=()=>{if(pending||busy){message('Conclua a gravação pendente antes de sair.');return}storeSession(null);parentPin=null;ready=false;remote=null;document.querySelectorAll('dialog[open]').forEach(d=>d.close());status('Neste aparelho · conectar família');message('Sessão encerrada. A cópia local continua neste aparelho.');show()};
  // A session identifies its cache. Unrelated local progress is never auto-uploaded on login.
  addEventListener('online',pull);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!parentDialog.open&&!incomeDialog.open)pull()});
  setInterval(()=>{if(!document.hidden&&!parentDialog.open&&!incomeDialog.open)pull()},google?15000:5000);
  show();if(configured&&session){status('Conectando à família…');pull()}else status(google?'Neste aparelho · conectar família pelo Google':configured?'Neste aparelho · entrar na família':'Neste aparelho · conexão familiar em preparação');
})();
