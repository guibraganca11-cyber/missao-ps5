/* Integer-cent allocation keeps tiny amounts and percentages consistent. */
(function(root){
  function split(amount,percentages){
    if(!Number.isFinite(amount)||amount<.01||amount>1000000||percentages.length!==3||percentages.some(n=>!Number.isFinite(n)||n<0||n>100)||Math.abs(percentages.reduce((a,b)=>a+b,0)-100)>1e-7)throw Error('Informe um valor de R$ 0,01 a R$ 1.000.000 e percentuais que somem 100%.');
    const cents=Math.round(amount*100),raw=percentages.map(p=>cents*p/100),allocated=raw.map(Math.floor);
    const order=[0,1,2].sort((a,b)=>(raw[b]-allocated[b])-(raw[a]-allocated[a]));
    for(let n=0,remaining=cents-allocated.reduce((a,b)=>a+b,0);n<remaining;n++)allocated[order[n%3]]++;
    return {ps5:allocated[0]/100,spend:allocated[1]/100,future:allocated[2]/100};
  }
  if(typeof module!=='undefined')module.exports={split};else root.MissionMoney={split};
})(globalThis);
