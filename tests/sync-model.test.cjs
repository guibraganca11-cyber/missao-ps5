const assert=require('node:assert/strict'),M=require('../sync-model.js');
const state={pin:'2026',pots:{ps5:300},routine:{weeks:{old:{paid:true,tasks:[{id:'t'}],marks:{}},now:{paid:false,tasks:[{id:'t'}],marks:{}}}}};
const before=M.wire(state),a=structuredClone(before),b=structuredClone(before);a.routine.weeks.now.marks['2026-10-05|t|0']=true;b.routine.weeks.now.marks['2026-10-05|t|1']=true;
const merged=M.rebaseMarks(before,a,b);assert.equal(Object.keys(merged.routine.weeks.now.marks).length,2);assert.equal(M.wire(state).pin,undefined);assert.equal(state.pin,'2026');
assert.deepEqual(M.rebaseMarks(before,a,a),a);a.pots.ps5=310;assert.equal(M.rebaseMarks(before,a,b),null);a.pots.ps5=300;b.routine.weeks.now.paid=true;assert.equal(M.rebaseMarks(before,a,b),null);assert.equal(M.rebaseMarks(null,a,b),null);
console.log('PASS sync merge: disjoint marks, same-mark idempotency, paid-week protection, money conflicts, PIN excluded.');
