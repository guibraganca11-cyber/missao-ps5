/* Apps Script bridge: no bearer credentials in URLs, HTML or the public repository. */
window.MissionGoogleTransport=(()=>{
  let endpoint='',frame=null,peer=null,peerOrigin='',channel='',connecting=null;
  const waiting=new Map();
  const allowedOrigin=origin=>/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(origin)||origin==='https://script.google.com';
  function validEndpoint(url){return /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url);}
  function reset(){if(frame)frame.remove();frame=null;peer=null;connecting=null;waiting.forEach(p=>{clearTimeout(p.timer);p.reject(Error('Conexão reiniciada. Tente novamente.'))});waiting.clear();}
  function connect(url){
    if(!validEndpoint(url))return Promise.reject(Error('Use o endereço do Apps Script terminado em /exec.'));
    if(endpoint===url&&peer)return Promise.resolve();
    if(endpoint===url&&connecting)return connecting;
    reset();endpoint=url;channel=crypto.randomUUID();
    connecting=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{window.removeEventListener('message',ready);reset();reject(Error('O Google não respondeu. Confira se o script foi publicado para acesso de qualquer pessoa.'))},25000);
      function ready(e){if(!allowedOrigin(e.origin)||!e.data||e.data.type!=='mission-ready'||e.data.channel!==channel)return;clearTimeout(timer);window.removeEventListener('message',ready);peer=e.source;peerOrigin=e.origin;resolve();}
      window.addEventListener('message',ready);
      frame=document.createElement('iframe');frame.hidden=true;frame.title='Conexão privada da família';frame.src=url+'?channel='+encodeURIComponent(channel);document.body.append(frame);
    });return connecting;
  }
  window.addEventListener('message',e=>{
    if(e.source!==peer||e.origin!==peerOrigin||!e.data||e.data.channel!==channel||e.data.type!=='mission-response')return;
    const p=waiting.get(e.data.id);if(!p)return;clearTimeout(p.timer);waiting.delete(e.data.id);
    const result=e.data.result;
    if(result?.error){const error=Error(result.error);error.auth=!!result.auth;p.reject(error)}else if(result&&Object.prototype.hasOwnProperty.call(result,'value'))p.resolve(result.value);else p.reject(Error('Resposta inválida do Google.'));
  });
  async function call(url,key,action,body={}){
    if(!navigator.onLine)throw Error('Sem internet. A alteração permanece neste aparelho.');
    await connect(url);
    return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>{waiting.delete(id);reject(Error('Sem confirmação do Google. A alteração será reenviada.'))},30000);waiting.set(id,{resolve,reject,timer});peer.postMessage({type:'mission-request',channel,id,request:{key,action,body}},peerOrigin)});
  }
  return {call,validEndpoint};
})();
