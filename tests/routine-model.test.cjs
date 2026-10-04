const assert=require('node:assert/strict');const R=require('../routine-model.js');
function fixture(){const s={weekly:10,pots:{ps5:300},claimedWeeks:[],history:[]};R.init(s,'2026-10-05');return s}
const s=fixture(),w=R.week(s,'2026-10-05');assert.equal(R.totals(w).total,66);assert.equal(R.totals(w).needed,53);
assert.equal(R.isoWeek('2021-01-01'),'2020-W53');assert.equal(R.isoWeek('2025-12-29'),'2026-W01');assert.equal(R.monday('2026-10-11'),'2026-10-05');
assert.equal(R.mark(w,'2026-10-06','teeth',0,'2026-10-05'),false);assert.equal(R.mark(w,'2026-10-10','homework',0,'2026-10-11'),false);assert.equal(R.mark(w,'2026-10-05','teeth',3,'2026-10-11'),false);
const all=[];R.days(w.start).forEach((d,i)=>w.tasks.forEach(t=>{if(t.days.includes(i))for(let n=0;n<t.count;n++)all.push([d,t.id,n])}));
all.slice(0,52).forEach(args=>R.mark(w,...args,'2026-10-11'));assert.equal(R.totals(w).done,52);assert.ok(R.approve(s,w,'2026-10-11'));assert.equal(s.pots.ps5,300);
R.mark(w,...all[52],'2026-10-11');assert.ok(R.approve(s,w,'2026-10-10'));assert.equal(R.approve(s,w,'2026-10-11'),null);assert.equal(s.pots.ps5,310);assert.ok(R.approve(s,w,'2026-10-11'));assert.equal(s.pots.ps5,310);assert.equal(R.mark(w,...all[0],'2026-10-11'),false);
const old=JSON.stringify(w);s.routine.plans.push({effective:'2026-10-12',tasks:[{id:'x',name:'Nova',count:1,days:[0]}],threshold:100,reward:20});const next=R.week(s,'2026-10-12');assert.equal(R.totals(next).total,1);assert.equal(JSON.stringify(w),old);assert.equal(next.reward,20);
const legacy=fixture();legacy.claimedWeeks.push('2026-W41');assert.equal(R.week(legacy,'2026-10-05').paid,true);assert.equal(legacy.pots.ps5,300);
const gap=fixture();gap.claimedWeeks=['2026-W39'];const gw=R.week(gap,'2026-10-05');all.forEach(args=>R.mark(gw,...args,'2026-10-11'));R.approve(gap,gw,'2026-10-11');assert.equal(gap.streak,1);
console.log('PASS: 66 targets; 53 required; date boundaries; future/weekend guards; approval; idempotency; frozen plans; migration; streak gaps.');
