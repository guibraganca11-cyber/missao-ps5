/* Comeback story: celebrates recorded progress and offers a gentle way back. */
(() => {
  const R=Routine,$=id=>document.getElementById(id),today=()=>R.dateKey(new Date());
  const dayMs=86400000;
  const daysBetween=(a,b)=>Math.max(0,Math.round((R.parse(b)-R.parse(a))/dayMs));
  const weekScore=w=>R.totals(w);
  const moneyValue=n=>money(Number(n||0));
  const recordedDays=w=>{
    const scores=[];
    R.days(w.start).forEach((day,dayIndex)=>{
      let done=0,total=0;
      w.tasks.filter(t=>t.days.includes(dayIndex)).forEach(t=>{
        total+=t.count;
        for(let slot=0;slot<t.count;slot++)if(w.marks[R.key(day,t.id,slot)])done++;
      });
      if(done)scores.push({day,done,total,perfect:done===total});
    });
    return scores;
  };
  function summary(){
    const weeks=Object.values(state.routine?.weeks||{}).filter(Boolean);
    const days=weeks.flatMap(recordedDays).sort((a,b)=>a.day.localeCompare(b.day));
    const finished=weeks.filter(w=>R.add(w.start,6)<today());
    const qualified=finished.filter(w=>{const s=weekScore(w);return s.total&&s.done>=s.needed});
    const paid=qualified.filter(w=>w.paid),pending=qualified.filter(w=>!w.paid);
    const taskCounts={};let stages=0;
    weeks.forEach(w=>w.tasks.forEach(t=>{for(const d of R.days(w.start))for(let slot=0;slot<t.count;slot++)if(w.marks[R.key(d,t.id,slot)]){stages++;taskCounts[t.name]=(taskCounts[t.name]||0)+1}}));
    const top=Object.entries(taskCounts).sort((a,b)=>b[1]-a[1])[0]||['Primeira missão',0];
    const last=days.at(-1)?.day||state.routine?.started||today();
    return {weeks,days,stages,perfect:days.filter(d=>d.perfect).length,last,gap:daysBetween(last,today()),qualified,paid,pending,paidValue:paid.reduce((n,w)=>n+w.reward,0),pendingValue:pending.reduce((n,w)=>n+w.reward,0),top};
  }
  const dialog=document.createElement('dialog');dialog.id='rescueDialog';dialog.setAttribute('aria-labelledby','rescueTitle');dialog.innerHTML='<div class="rescue-screen"><button type="button" class="rescue-close" aria-label="Fechar">×</button><div id="rescueBody"></div></div>';document.body.append(dialog);
  dialog.querySelector('.rescue-close').onclick=()=>dialog.close();
  const banner=document.createElement('section');banner.id='rescueBanner';banner.className='rescue-banner';
  document.querySelector('.missions-card').before(banner);
  function render(){
    const s=summary();
    if(!s.stages){banner.hidden=true;return}
    const dormant=s.gap>=3;
    banner.hidden=false;banner.classList.toggle('active-return',dormant);
    banner.innerHTML=`<div><small>${dormant?'SINAL DE RETORNO DETECTADO':'ARQUIVO DA MISSÃO'}</small><b>${dormant?'O herói não perdeu o progresso.':'Seu progresso está registrado.'}</b><span>${s.stages} etapas salvas · ${s.perfect} dias perfeitos</span></div><button type="button" id="openRescue">${dormant?'Ver missão de retorno':'Ver minha história'} <span>→</span></button>`;
    $('openRescue').onclick=()=>open(s);
  }
  function open(s=summary()){
    const pending=s.pendingValue?`${moneyValue(s.pendingValue)} conquistados nas metas e aguardando aprovação do pai`:'Nenhuma recompensa semanal aguardando aprovação';
    $('rescueBody').innerHTML=`<header class="rescue-hero"><p>ARQUIVO SECRETO // BENTINHO</p><h2 id="rescueTitle">A missão não acabou.<br><em>Ela estava esperando você.</em></h2><span>Último registro: ${R.parse(s.last).toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})} · ${s.gap} dias desde a última marcação</span></header>
      <section class="rescue-proof"><p>ANTES DA PAUSA, VOCÊ CONSTRUIU ISTO</p><div class="rescue-stats"><article><strong>${s.stages}</strong><span>etapas concluídas</span></article><article><strong>${s.perfect}</strong><span>dias perfeitos</span></article><article><strong>${s.qualified.length}</strong><span>semanas acima da meta</span></article></div><div class="rescue-money"><span>DINHEIRO DA MISSÃO</span><b>${moneyValue(state.pots.ps5)} <small>em caixa</small></b><p>${pending}. Nada do que você fez foi apagado.</p></div><p class="rescue-highlight">Seu superpoder mais usado: <b>${esc(s.top[0])}</b> — ${s.top[1]} etapas.</p></section>
      <section class="rescue-plan"><div><p>OPERAÇÃO: VOLTA AO JOGO</p><h3>Não precisa recuperar os dias passados.</h3><span>Só precisamos reacender a sequência.</span></div><ol><li><b>Hoje</b><span>Faça 3 etapas fáceis e marque no app.</span></li><li><b>Amanhã</b><span>Suba para 5 etapas, no seu ritmo.</span></li><li><b>Próxima semana</b><span>Volte para a missão completa e busque os 80%.</span></li></ol><button type="button" id="resumeMission">Começar meu retorno <span>→</span></button><small>Os dias sem marcação ficam no passado. A pontuação recomeça a partir de hoje.</small></section>`;
    $('resumeMission').onclick=()=>{dialog.close();document.querySelector('.daily-quest')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});document.querySelector('#questDone')?.focus({preventScroll:true})};
    dialog.showModal();
  }
  document.addEventListener('mission:cloud-updated',()=>{render();const s=summary(),key=`missaoRescueSeen:${today()}`;if(s.gap>=7&&!localStorage.getItem(key)){localStorage.setItem(key,'1');setTimeout(()=>{if(!document.querySelector('dialog[open]'))open(s)},500)}});
  render();
})();
