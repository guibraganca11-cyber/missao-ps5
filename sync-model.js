/* Pure three-way merge for marks. Money/approvals are never merged or replayed blindly. */
(function(root){
  const copy=x=>JSON.parse(JSON.stringify(x));
  function wire(state){const out=copy(state);delete out.pin;return out}
  function stripMarks(s){const c=copy(s);Object.values(c.routine?.weeks||{}).forEach(w=>{w.marks={}});return c}
  function rebaseMarks(before,after,remote){
    if(!before||!after||!remote)return null;
    if(JSON.stringify(stripMarks(before))!==JSON.stringify(stripMarks(after)))return null;
    const out=copy(remote);
    for(const [start,w] of Object.entries(after.routine?.weeks||{})){
      const old=before.routine.weeks[start],target=out.routine?.weeks?.[start];
      if(!old||!target)return null;
      const changed=Object.keys(w.marks||{}).some(k=>!!old.marks[k]!==!!w.marks[k]);
      if(!changed)continue;
      if(target.paid)return null;
      for(const [key,value] of Object.entries(w.marks||{})){
        if(!!old.marks[key]===!!value)continue;
        if(!target.tasks.some(t=>key.split('|')[1]===t.id))return null;
        // Each change is a set, not a toggle: retrying cannot undo the first device's mark.
        target.marks[key]=value;
      }
    }
    return out;
  }
  const api={wire,rebaseMarks};if(typeof module!=='undefined')module.exports=api;else root.MissionSyncModel=api;
})(globalThis);
