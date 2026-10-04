/* The personal mission journal: presentation independent from saved balances. */
const glyphs={home:'M3 10 12 3l9 7v11h-6v-7H9v7H3z',target:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8',bolt:'m13 2-9 12h7l-1 8 10-13h-7z',wallet:'M3 6h17v15H3z M3 6V3h14 M15 12h6v5h-6z',shield:'m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6',cup:'M7 3h10v7a5 5 0 0 1-10 0z M7 5H3v3c0 3 4 4 4 4m10-7h4v3c0 3-4 4-4 4m-5 3v6m-5 0h10',plus:'M12 4v16M4 12h16',bag:'M4 7h16l1 14H3z M8 7V5a4 4 0 0 1 8 0v2',check:'m5 12 4 4L20 5',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'};
function symbol(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${glyphs[name]||glyphs.target}"/></svg>`;}
const shell=document.querySelector('.app-shell');
shell.insertAdjacentHTML('afterbegin',`<header class="journal-header"><a href="#" class="journal-brand">${symbol('bolt')}<span>MISSÃO <b>PS5</b></span></a><span class="edition">DIÁRIO DE UM FUTURO HERÓI / 04</span><button class="agent-profile" aria-label="Abrir área do pai">B<span>BENTINHO<small>AGENTE EM TREINAMENTO</small></span></button></header>`);
document.querySelector('.agent-profile').onclick=()=>navParent.click();
document.querySelector('.hero').innerHTML=`<div class="hero-copy"><p class="chapter"><span></span> SEU PRÓXIMO GRANDE FEITO</p><h1>Grandes conquistas.<br><em>Pequenas missões.</em></h1><p class="hero-description">A cidade tem seus heróis.<br>Esta missão tem você.</p><div class="level-pill" id="levelPill"></div></div><div class="city-scene" aria-hidden="true"><svg viewBox="0 0 600 420"><defs><pattern id="windows" width="18" height="24" patternUnits="userSpaceOnUse"><rect width="4" height="9" fill="#63a7e6" opacity=".28"/></pattern></defs><circle cx="370" cy="180" r="155" fill="#183a68"/><g fill="none" stroke="#4776a4" opacity=".4"><path d="M-20 0 580 420M100-40l420 460M240-20l240 440M390-20l40 440M550-20 380 420M0 55q260 200 600 45M0 135q260 200 600 45M0 235q260 160 600 45"/></g><g fill="#081526" stroke="#426186" stroke-width="1"><path d="M15 420V220h80v-70h55v270M168 420V260h65v-45h45v205M296 420V100h80v-30h30v350M436 420V200h90v-45h30v265M560 420V295h40v125"/></g><path d="M30 240h50v180H30zm150 35h85v145h-85zm130-155h80v300h-80zm140 100h60v200h-60z" fill="url(#windows)"/><path d="M0 395 600 285" stroke="#ff344e" stroke-width="3"/><path d="M0 407 600 297" stroke="#ff344e" opacity=".3"/><circle cx="398" cy="178" r="44" fill="#fa2947"/><path d="m403 146-26 37h20l-4 27 29-41h-22z" fill="#fff"/><g fill="#a4c6eb" font-family="monospace" font-size="10"><text x="309" y="55">ALVO LOCALIZADO</text><text x="440" y="113">40° / 73°</text></g><path d="M320 140v-15h15m128 0h15v15m0 83v15h-15m-128 0h-15v-15" fill="none" stroke="#f2f5fa" stroke-width="2"/></svg><span class="scene-caption">OPERAÇÃO: PRIMEIRO PS5 <b>EM ANDAMENTO</b></span></div>`;
document.querySelector('.goal-card').insertAdjacentHTML('afterbegin','<div class="card-label">01 / OBJETIVO PRINCIPAL <span>ATIVO</span></div>');
document.querySelector('.console-art').innerHTML=symbol('target');
document.querySelector('.goal-label').insertAdjacentText('afterbegin','guardados ');
document.querySelector('.missions-card .mini-eyebrow').textContent='02 / AGENDA DA SEMANA';
document.querySelector('.missions-card h2').textContent='Pequenos atos. Grandes passos.';
document.querySelector('.missions-card').append(document.getElementById('openMissions'));
document.querySelector('#openMissions').innerHTML=`<b>Começar minhas missões</b>${symbol('plus')}`;
document.querySelectorAll('.pot-card').forEach((p,i)=>{p.querySelector('.jar').innerHTML=symbol(['target','wallet','shield'][i]);p.querySelector('.pot-title').textContent=['Missão PS5','Para usar','Reserva futura'][i];});
document.querySelectorAll('.info-icon').forEach((p,i)=>p.innerHTML=symbol(i?'bolt':'cup'));
document.querySelectorAll('.action-grid .action-icon').forEach((p,i)=>p.innerHTML=symbol(i?'bag':'plus'));
document.querySelectorAll('.bottom-nav .nav-btn span').forEach((p,i)=>p.innerHTML=symbol(['home','target','cup','grid'][i]));
document.querySelector('.bottom-nav').setAttribute('aria-label','Navegação principal');
document.querySelector('.nav-btn[data-screen]').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
const previewV4=renderMissionPreview;
renderMissionPreview=function(){previewV4();document.querySelectorAll('.preview-icon').forEach((p,i)=>p.innerHTML=`<span>0${i+1}</span>`);document.querySelectorAll('.preview-status').forEach((p,i)=>p.innerHTML=state.completedTasks[i]?symbol('check'):symbol('plus'));};
document.querySelectorAll('.close').forEach(b=>b.setAttribute('aria-label','Fechar'));
toastEl.setAttribute('role','status');
renderAll();
// Network update checks replace the old indefinitely cached shell.
if('serviceWorker' in navigator){let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload();});navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});}
