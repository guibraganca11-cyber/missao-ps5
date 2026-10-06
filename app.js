function safeText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const DEFAULT_STATE={
  goal:4000,
  weekly:10,
  pots:{ps5:300,spend:0,future:0},
  streak:0,
  claimedWeeks:[],
  completedTasks:[],
  tasks:["Arrumar o quarto","Guardar as próprias coisas","Tarefa especial"],
  pin:"2026",
  history:[{type:"initial",value:300,date:new Date().toISOString()}]
};

const milestones=[
  {v:300,level:1,name:"Começando a missão",emoji:"🚀"},
  {v:500,level:2,name:"Poupador",emoji:"🥉"},
  {v:750,level:3,name:"Planejador",emoji:"🥈"},
  {v:1000,level:4,name:"Investidor",emoji:"🥇"},
  {v:1500,level:5,name:"Mestre da economia",emoji:"⭐"},
  {v:2000,level:6,name:"Metade do caminho",emoji:"🔥"},
  {v:3000,level:7,name:"Reta final",emoji:"⚡"},
  {v:4000,level:8,name:"PS5 desbloqueado",emoji:"🎮"}
];

let state=loadState();

function loadState(){
  const raw=localStorage.getItem("missaoPs5V2");
  if(!raw) return structuredClone(DEFAULT_STATE);
  try{
    const parsed=JSON.parse(raw);
    return {...structuredClone(DEFAULT_STATE),...parsed,pots:{...DEFAULT_STATE.pots,...(parsed.pots||{})}};
  }catch(e){return structuredClone(DEFAULT_STATE);}
}
function saveState(){localStorage.setItem("missaoPs5V2",JSON.stringify(state));renderAll();}
function money(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function weekKey(){
  const d=new Date();
  const date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const day=date.getUTCDay()||7;
  date.setUTCDate(date.getUTCDate()+4-day);
  const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const week=Math.ceil((((date-yearStart)/86400000)+1)/7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2,"0")}`;
}
function currentLevel(){
  let cur=milestones[0];
  milestones.forEach(m=>{if(state.pots.ps5>=m.v) cur=m;});
  return cur;
}
function nextMilestone(){
  return milestones.find(m=>m.v>state.pots.ps5)||milestones[milestones.length-1];
}
function renderAll(){
  const p=state.pots.ps5;
  const pct=Math.min(100,(p/state.goal)*100);
  const level=currentLevel(), next=nextMilestone();
  mainMoney.textContent=money(p);
  goalMoney.textContent=money(state.goal);
  progressFill.style.width=`${pct}%`;
  progressPct.textContent=`${pct.toFixed(1).replace(".",",")}%`;
  remaining.textContent=`Faltam ${money(Math.max(0,state.goal-p))}`;
  potPs5.textContent=money(state.pots.ps5);
  potSpend.textContent=money(state.pots.spend);
  potFuture.textContent=money(state.pots.future);
  potPs5Pct.textContent=`${pct.toFixed(1).replace(".",",")}% da meta`;
  levelPill.textContent=`Nível ${level.level} — ${level.name}`;
  streak.textContent=state.streak;
  document.getElementById('nextMilestone').textContent=money(next.v);
  nextText.textContent=p>=state.goal?"Missão concluída!":`Faltam ${money(next.v-p)}`;
  renderMissionPreview();
  renderProjection();
}
function renderMissionPreview(){
  const done=state.completedTasks.filter(Boolean).length;
  missionCount.textContent=`${done} de ${state.tasks.length}`;
  missionPreview.innerHTML=state.tasks.map((t,i)=>`
    <div class="preview-row">
      <div class="preview-icon">${["🛏️","🧺","⭐"][i]||"🎯"}</div>
      <div class="preview-text">${safeText(t)}</div>
      <div class="preview-status">${state.completedTasks[i]?"✅":"○"}</div>
    </div>`).join("");
}
function renderMissionDialog(){
  const claimed=state.claimedWeeks.includes(weekKey());
  missionList.innerHTML=state.tasks.map((t,i)=>`
    <label class="mission-item">
      <input type="checkbox" data-task="${i}" ${state.completedTasks[i]?"checked":""} ${claimed?"disabled":""}>
      <span>${safeText(t)}</span>
    </label>`).join("");
  claimWeek.disabled=claimed;
  claimWeek.textContent=claimed?"Semana já concluída ✅":`Receber ${money(state.weekly)}`;
  missionFeedback.textContent=claimed?"Você já recebeu a recompensa desta semana.":"";
  missionList.querySelectorAll("input").forEach(cb=>{
    cb.addEventListener("change",()=>{
      state.completedTasks[Number(cb.dataset.task)]=cb.checked;
      saveState();
      renderMissionDialog();
    });
  });
}
function renderProjection(){
  const remain=Math.max(0,state.goal-state.pots.ps5);
  const weeks=state.weekly>0?Math.ceil(remain/state.weekly):0;
  const months=(weeks/4.345).toFixed(1).replace(".",",");
  projectionText.textContent=remain<=0
    ?"Você completou a missão. Agora é hora de escolher o melhor momento para comprar."
    :`Só com os ${money(state.weekly)} semanais, faltariam cerca de ${weeks} semanas (${months} meses). Presentes, aniversário e bônus podem acelerar muito.`;
}
function toast(msg){
  toastEl.textContent=msg;toastEl.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>toastEl.classList.remove("show"),2300);
}
function updateSplitPreview(){
  const v=Math.max(0,Number(incomeValue.value)||0);
  const a=Math.max(0,Number(splitPs5.value)||0);
  const b=Math.max(0,Number(splitSpend.value)||0);
  const c=Math.max(0,Number(splitFuture.value)||0);
  splitPreview.textContent=`PS5 ${money(v*a/100)} • Usar ${money(v*b/100)} • Futuro ${money(v*c/100)}`;
}
openMissions.addEventListener("click",()=>{renderMissionDialog();missionsDialog.showModal();});
navMissions.addEventListener("click",()=>{renderMissionDialog();missionsDialog.showModal();});
claimWeek.addEventListener("click",()=>{
  if(state.claimedWeeks.includes(weekKey())) return;
  if(state.completedTasks.length<state.tasks.length||state.completedTasks.some(v=>!v)){
    missionFeedback.textContent="Complete as três missões antes de receber.";
    return;
  }
  state.pots.ps5+=state.weekly;
  state.streak+=1;
  state.claimedWeeks.push(weekKey());
  state.history.push({type:"weekly",value:state.weekly,date:new Date().toISOString()});
  state.completedTasks=[false,false,false];
  saveState();renderMissionDialog();toast(`+ ${money(state.weekly)} na Missão PS5!`);
});
openIncome.addEventListener("click",()=>{incomeValue.value="";updateSplitPreview();incomeDialog.showModal();});
[incomeValue,splitPs5,splitSpend,splitFuture].forEach(el=>el.addEventListener("input",updateSplitPreview));
saveIncome.addEventListener("click",()=>{
  const v=Number(incomeValue.value),a=Number(splitPs5.value),b=Number(splitSpend.value),c=Number(splitFuture.value);
  if(!v||v<=0){incomeFeedback.textContent="Digite um valor maior que zero.";return;}
  if(a<0||b<0||c<0||a+b+c!==100){incomeFeedback.textContent="Os percentuais precisam somar 100%.";return;}
  state.pots.ps5+=v*a/100;state.pots.spend+=v*b/100;state.pots.future+=v*c/100;
  state.history.push({type:"income",source:incomeSource.value,value:v,split:{ps5:a,spend:b,future:c},date:new Date().toISOString()});
  saveState();incomeDialog.close();toast("Dinheiro dividido com sucesso!");
});
openBuy.addEventListener("click",()=>{buyName.value="";buyValue.value="";buyResult.innerHTML="";buyDialog.showModal();});
simulateBuy.addEventListener("click",()=>{
  const name=(buyName.value||"essa compra").trim(),v=Number(buyValue.value);
  if(!v||v<=0){buyResult.innerHTML=`<div class="buy-impact">Digite um valor válido.</div>`;return;}
  const free=state.pots.spend;
  let html=`<div class="buy-impact"><strong>${safeText(name)}: ${money(v)}</strong><br>`;
  if(v<=free){
    html+=`Você consegue pagar usando seu pote <b>Usar</b>. A Missão PS5 continua com ${money(state.pots.ps5)}.</div>`;
  }else{
    const missing=v-free;
    const weeks=state.weekly?Math.ceil(missing/state.weekly):0;
    html+=`Seu pote Usar tem ${money(free)}. Faltam ${money(missing)}.<br>Se tirar da Missão PS5, isso representa cerca de <b>${weeks} semanas de tarefas</b>.</div>`;
  }
  buyResult.innerHTML=html;
});
navProgress.addEventListener("click",()=>{
  achievementList.innerHTML=milestones.map(m=>`
    <div class="achievement ${state.pots.ps5>=m.v?"":"locked"}">
      <div class="achievement-emoji">${m.emoji}</div>
      <div><b>Nível ${m.level} — ${m.name}</b><span>${money(m.v)}</span></div>
    </div>`).join("");
  progressDialog.showModal();
});
navParent.addEventListener("click",()=>{
  pinInput.value="";pinFeedback.textContent="";pinGate.classList.remove("hidden");parentPanel.classList.add("hidden");parentDialog.showModal();
});
unlockParent.addEventListener("click",()=>{
  if(pinInput.value!==state.pin){pinFeedback.textContent="PIN incorreto.";return;}
  pinGate.classList.add("hidden");parentPanel.classList.remove("hidden");
  parentGoal.value=state.goal;parentWeekly.value=state.weekly;parentBonus.value="";
});
addBonus.addEventListener("click",()=>{
  const v=Number(parentBonus.value);
  if(!v||v<=0)return;
  state.pots.ps5+=v;
  state.history.push({type:"parent_bonus",value:v,date:new Date().toISOString()});
  saveState();parentBonus.value="";toast(`Bônus de ${money(v)} adicionado!`);
});
saveParent.addEventListener("click",()=>{
  state.goal=Math.max(500,Number(parentGoal.value)||4000);
  state.weekly=Math.max(1,Number(parentWeekly.value)||10);
  saveState();toast("Ajustes salvos.");
});
document.querySelectorAll(".pot-card").forEach(btn=>btn.addEventListener("click",()=>{
  const pot=btn.dataset.pot;
  const names={ps5:"Missão PS5",spend:"Dinheiro para usar",future:"Dinheiro do futuro"};
  toast(`${names[pot]}: ${money(state.pots[pot])}`);
}));
const toastEl=document.getElementById("toast");
// Keep installed phones on the current interface without clearing family data.
if("serviceWorker" in navigator){
  let reloadingForUpdate=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(reloadingForUpdate)return;
    reloadingForUpdate=true;
    location.reload();
  });
  const refreshApp=()=>navigator.serviceWorker.register("sw.js?v=12",{updateViaCache:"none"}).then(reg=>reg.update()).catch(()=>{});
  addEventListener("load",refreshApp,{once:true});
  addEventListener("pageshow",refreshApp);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshApp();});
}
renderAll();
// V3 enhancements: structured state, safe rendering, history and celebrations
state.profile=state.profile||{name:"Bentinho",avatar:"aventureiro"};
state.settings=state.settings||{version:3,reducedEffects:false};
state.achievements=state.achievements||[];
const esc=value=>String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
let lastKnownLevel=currentLevel().level;
const baseSaveState=saveState;
saveState=function(){
  const newLevel=currentLevel();
  const leveledUp=newLevel.level>lastKnownLevel;
  baseSaveState();
  if(leveledUp) showLevelUp(newLevel);
  lastKnownLevel=newLevel.level;
};

renderMissionPreview=function(){
  const done=state.completedTasks.filter(Boolean).length;
  missionCount.textContent=`${done} de ${state.tasks.length}`;
  missionPreview.innerHTML=state.tasks.map((t,i)=>`<div class="preview-row"><div class="preview-icon">${["🛏️","🧺","⭐","🎯","⚡"][i]||"🎯"}</div><div class="preview-text"><small>MISSÃO ${i+1}</small>${esc(t)}</div><div class="preview-status" aria-label="${state.completedTasks[i]?"concluída":"pendente"}">${state.completedTasks[i]?"✅":"○"}</div></div>`).join("");
};
renderMissionDialog=function(){
  const claimed=state.claimedWeeks.includes(weekKey());
  missionList.innerHTML=state.tasks.map((t,i)=>`<label class="mission-item"><input type="checkbox" data-task="${i}" ${state.completedTasks[i]?"checked":""} ${claimed?"disabled":""}><span><small>MISSÃO ${i+1}</small>${esc(t)}</span></label>`).join("");
  claimWeek.disabled=claimed;
  claimWeek.textContent=claimed?"Semana já concluída ✅":`Receber ${money(state.weekly)}`;
  missionFeedback.textContent=claimed?"Recompensa recebida. Volte na próxima semana!":"";
  missionList.querySelectorAll("input").forEach(cb=>cb.addEventListener("change",()=>{state.completedTasks[Number(cb.dataset.task)]=cb.checked;saveState();renderMissionDialog();}));
};

function showLevelUp(level){
  const overlay=document.createElement("div");
  overlay.className="level-up-overlay";
  overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
  overlay.innerHTML=`<div class="level-up-card"><b>LEVEL UP!</b><div class="medal">${level.level}</div><h2>Você virou ${esc(level.name)}!</h2><p>Você já guardou ${money(state.pots.ps5)}. Continue avançando!</p><button class="cta">Continuar missão</button></div>`;
  overlay.querySelector("button").addEventListener("click",()=>overlay.remove());
  document.body.appendChild(overlay);overlay.querySelector("button").focus();
}

function historyLabel(item){
  const map={initial:["🚀","Início da missão"],weekly:["✓","Missões da semana"],income:["＋",item.source||"Dinheiro recebido"],parent_bonus:["★","Bônus do investidor"],purchase:["◈","Escolha de compra"],correction:["↻","Correção"]};
  return map[item.type]||["•","Movimento da missão"];
}
function renderHistory(){
  let box=document.getElementById("historyListV3"); if(!box)return;
  const rows=[...(state.history||[])].reverse();
  box.innerHTML=rows.length?rows.map(item=>{const [icon,label]=historyLabel(item);const d=new Date(item.date);return `<div class="history-item"><span class="history-icon">${icon}</span><span><b>${esc(label)}</b><small>${d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</small></span><span class="history-value">${item.type==="purchase"?"−":"+"} ${money(item.value)}</span></div>`}).join(""):"<p>Nenhum registro ainda.</p>";
}
function ensureParentTools(){
  if(document.getElementById("parentToolsV3"))return;
  const tools=document.createElement("div");tools.id="parentToolsV3";
  tools.innerHTML=`<div class="parent-tabs"><button type="button" class="active" data-tab="settings">Ajustes</button><button type="button" data-tab="tasks">Missões</button><button type="button" data-tab="history">Histórico</button></div><section data-view="tasks" class="hidden"><h3>Editar missões</h3><div id="taskEditorV3"></div><button type="button" class="secondary big" id="saveTasksV3">Salvar missões</button></section><section data-view="history" class="hidden"><h3>Linha do tempo da missão</h3><div class="history-list" id="historyListV3"></div></section>`;
  parentPanel.prepend(tools);
  const settings=[...parentPanel.children].filter(el=>el!==tools);
  tools.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{
    tools.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b===btn));
    settings.forEach(el=>el.classList.toggle("hidden",btn.dataset.tab!=="settings"));
    tools.querySelectorAll("[data-view]").forEach(v=>v.classList.toggle("hidden",v.dataset.view!==btn.dataset.tab));
    if(btn.dataset.tab==="tasks") renderTaskEditor(); if(btn.dataset.tab==="history")renderHistory();
  }));
  tools.querySelector("#saveTasksV3").addEventListener("click",()=>{
    const values=[...tools.querySelectorAll("#taskEditorV3 input")].map(i=>i.value.trim()).filter(Boolean);
    if(values.length<1)return toast("Crie pelo menos uma missão.");
    state.tasks=values.slice(0,5);state.completedTasks=state.tasks.map((_,i)=>Boolean(state.completedTasks[i]));saveState();renderTaskEditor();toast("Missões atualizadas!");
  });
}
function renderTaskEditor(){
  const editor=document.getElementById("taskEditorV3");if(!editor)return;
  editor.innerHTML=state.tasks.map((t,i)=>`<label>Missão ${i+1}<input value="${esc(t)}" maxlength="60"></label>`).join("");
  if(state.tasks.length<5)editor.insertAdjacentHTML("beforeend",`<label>Nova missão (opcional)<input value="" maxlength="60" placeholder="Ex.: Ajudar a arrumar a mesa"></label>`);
}
unlockParent.addEventListener("click",()=>{if(pinInput.value===state.pin){ensureParentTools();renderHistory();}});

// More reflective purchase simulator with two clear paths.
simulateBuy.addEventListener("click",()=>{
  const name=(buyName.value||"Essa compra").trim(),v=Number(buyValue.value);if(!v||v<=0)return;
  const free=state.pots.spend,missing=Math.max(0,v-free),weeks=state.weekly?Math.ceil(missing/state.weekly):0;
  buyResult.innerHTML=v<=free?`<div class="buy-impact"><strong>${esc(name)} — ${money(v)}</strong><p>Boa notícia: seu Dinheiro Livre paga tudo. A Missão PS5 fica protegida.</p><button type="button" class="secondary big" id="keepSaving">Continuar guardando</button></div>`:`<div class="buy-impact"><strong>${esc(name)} — ${money(v)}</strong><p>Você tem <b>${money(free)}</b> livres e faltam <b>${money(missing)}</b>.</p><div class="impact-weeks">Isso equivale a <b>${weeks} ${weeks===1?"semana":"semanas"} de missões</b>.</div><button type="button" class="cta big" id="keepSaving">Continuar guardando</button><button type="button" class="secondary big" id="useMission">Registrar usando a missão</button><small>É só um registro. O app não faz compras.</small></div>`;
  document.getElementById("keepSaving")?.addEventListener("click",()=>{buyDialog.close();toast("Boa escolha! Sua missão continua forte.");});
  document.getElementById("useMission")?.addEventListener("click",()=>{if(missing>state.pots.ps5)return toast("Ainda não há valor suficiente.");state.pots.spend=Math.max(0,free-v);state.pots.ps5-=missing;state.history.push({type:"purchase",source:name,value:v,date:new Date().toISOString()});saveState();buyDialog.close();toast("Escolha registrada. Vamos recuperar esse progresso!");});
});

// Keyboard and accessibility polish.
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("close",()=>document.body.classList.remove("modal-open")));
document.querySelectorAll("button").forEach(b=>{if(!b.getAttribute("type")&&!b.closest("form"))b.type="button";});
renderAll();

// Final state consistency and accessible progress values.
const renderAllV3=renderAll;
renderAll=function(){
  renderAllV3();
  const pct=Math.min(100,(state.pots.ps5/state.goal)*100);
  document.querySelector(".progress-bar")?.setAttribute("role","progressbar");
  document.querySelector(".progress-bar")?.setAttribute("aria-valuemin","0");
  document.querySelector(".progress-bar")?.setAttribute("aria-valuemax","100");
  document.querySelector(".progress-bar")?.setAttribute("aria-valuenow",String(Math.round(pct)));
  const streakCard=document.querySelector(".info-card.orange .info-small");
  if(streakCard)streakCard.textContent=state.streak?"Você está criando um super hábito!":"Comece sua sequência!";
};
claimWeek.addEventListener("click",()=>{
  if(state.claimedWeeks.includes(weekKey())&&state.completedTasks.length!==state.tasks.length){
    state.completedTasks=Array(state.tasks.length).fill(false);
    localStorage.setItem("missaoPs5V2",JSON.stringify(state));renderAll();
  }
});
renderAll();
