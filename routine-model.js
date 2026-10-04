(function(root){
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const parse=s=>new Date(`${s}T12:00:00`);
  const add=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return dateKey(d)};
  const monday=s=>add(s,-((parse(s).getDay()+6)%7));
  const days=start=>Array.from({length:7},(_,i)=>add(start,i));
  function isoWeek(start){const d=parse(add(monday(start),3)),y=d.getFullYear(),f=parse(monday(`${y}-01-04`));return `${y}-W${String(Math.floor((Date.UTC(y,d.getMonth(),d.getDate())-Date.UTC(f.getFullYear(),f.getMonth(),f.getDate()))/604800000)+1).padStart(2,'0')}`}
  const defaults=()=>[
    {id:'granola-clean',name:'Recolher o cocô da Granola',count:2,days:[0,1,2,3,4,5,6]},
    {id:'teeth',name:'Escovar os dentes',count:3,days:[0,1,2,3,4,5,6]},
    {id:'granola-food',name:'Dar comida e água à Granola',count:2,days:[0,1,2,3,4,5,6]},
    {id:'homework',name:'Fazer o dever de casa',count:1,days:[0,1,2,3,4]},
    {id:'schoolbag',name:'Arrumar a mochila da escola',count:1,days:[0,1,2,3,4]},
    {id:'bed',name:'Arrumar a cama',count:1,days:[0,1,2,3,4,5,6]}
  ];
  function init(state,today){if(state.routine)return state.routine;return state.routine={version:1,started:today,plans:[{effective:monday(today),tasks:defaults(),threshold:80,reward:state.weekly}],weeks:{},extras:[],extraEntries:[]}}
  function week(state,start){const r=state.routine;start=monday(start);if(r.weeks[start])return r.weeks[start];const p=r.plans.filter(p=>p.effective<=start).sort((a,b)=>b.effective.localeCompare(a.effective))[0];if(!p)return null;return r.weeks[start]={start,tasks:structuredClone(p.tasks),threshold:p.threshold,reward:p.reward,marks:{},paid:state.claimedWeeks.includes(isoWeek(start)),legacyPaid:state.claimedWeeks.includes(isoWeek(start))}}
  const key=(day,id,slot)=>`${day}|${id}|${slot}`;
  function totals(w){let done=0,total=0;const rows=w.tasks.map(t=>{let n=0,target=0;days(w.start).forEach((d,i)=>{if(t.days.includes(i)){for(let s=0;s<t.count;s++){target++;if(w.marks[key(d,t.id,s)])n++}}});done+=n;total+=target;return {task:t,done:n,total:target}});return {done,total,percent:total?done/total*100:0,needed:Math.ceil(total*w.threshold/100),rows}}
  function mark(w,day,id,slot,today){const t=w.tasks.find(t=>t.id===id),i=days(w.start).indexOf(day);if(w.paid||day>today||!t||!t.days.includes(i)||!Number.isInteger(slot)||slot<0||slot>=t.count)return false;const k=key(day,id,slot);w.marks[k]=!w.marks[k];return true}
  function approve(state,w,today){const s=totals(w);if(w.paid||state.claimedWeeks.includes(isoWeek(w.start)))return 'Esta semana já foi paga.';if(today<add(w.start,6))return 'O fechamento fica disponível no domingo.';if(!s.total||s.done<s.needed)return 'A semana ainda não atingiu a meta.';w.paid=true;w.approvedAt=new Date().toISOString();w.finalScore=s.percent;state.claimedWeeks.push(isoWeek(w.start));state.pots.ps5=Math.round((state.pots.ps5+w.reward)*100)/100;state.history.push({type:'weekly',source:`Semana de ${w.start}`,week:w.start,value:w.reward,date:w.approvedAt,done:s.done,total:s.total});const paid=new Set(state.claimedWeeks);let cursor=monday(today);if(!paid.has(isoWeek(cursor)))cursor=add(cursor,-7);let streak=0;while(paid.has(isoWeek(cursor))&&streak<10000){streak++;cursor=add(cursor,-7)}state.streak=streak;return null}
  const api={dateKey,parse,add,monday,days,isoWeek,defaults,init,week,key,totals,mark,approve};if(typeof module!=='undefined')module.exports=api;else root.Routine=api;
})(globalThis);
