const assert=require('node:assert/strict'),{split}=require('../money-model.js');
assert.deepEqual(split(100,[70,20,10]),{ps5:70,spend:20,future:10});
assert.deepEqual(split(.01,[50,50,0]),{ps5:.01,spend:0,future:0});
assert.deepEqual(split(.03,[0,50,50]),{ps5:0,spend:.02,future:.01});
for(const amount of [0,-1,NaN,Infinity,1000001])assert.throws(()=>split(amount,[70,20,10]));
for(const percentages of [[70,20,20],[-1,100,1],[NaN,20,80],[101,0,-1]])assert.throws(()=>split(100,percentages));
for(let cents=1;cents<1000;cents++){const r=split(cents/100,[33.33,33.33,33.34]);assert.equal(Math.round((r.ps5+r.spend+r.future)*100),cents);assert.ok(Object.values(r).every(n=>n>=0))}
console.log('PASS: cent-exact allocation, small values, invalid input, no negative allocation.');
