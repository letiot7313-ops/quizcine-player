let socket=null, room=null, me=null, allowChange=true, accepting=false;
const $=id=>document.getElementById(id);
function qsParam(k){ const u=new URL(window.location.href); return u.searchParams.get(k); }

function connect(){
  const stored = localStorage.getItem('ws-server') || DEFAULT_WS || prompt('URL serveur WebSocket (ex: wss://quizcine-server-1.onrender.com)');
  if(!stored){ alert('Serveur requis'); return; }
  localStorage.setItem('ws-server', stored);
  socket=io(stored,{transports:['websocket']});
  socket.on('connect', ()=>{});
  socket.on('question', (q)=>{ showQuestion(q); });
  socket.on('accepting', (v)=>{ accepting=v; updateStatus(); });
  socket.on('reveal', ()=>{ accepting=false; updateStatus('Révélé.'); });
  socket.on('joined', ()=>{ $('screen').style.display='block'; });
}

function updateStatus(extra){ $('status').textContent = (accepting? 'Répondez maintenant' : 'En attente…') + (extra? ' '+extra:''); }

function showQuestion(q){
  $('qtext').textContent = q.text || '';
  const img=$('qimg');
  if(q.image){ img.src=q.image; img.style.display='block'; } else { img.style.display='none'; }
  const box=$('choices'); box.innerHTML='';
  allowChange = !!q.allowChange;
  const isOpen = (q.type||'mcq')==='open';
  $('openBox').style.display = isOpen ? 'block' : 'none';
  if(!isOpen){
    (q.choices||[]).forEach((c)=>{
      const d=document.createElement('div'); d.className='choice'; d.textContent=c||'';
      d.onclick = ()=> sendAnswer(c,d);
      box.appendChild(d);
    });
  }else{
    $('sendOpen').onclick = ()=> {
      const val = ($('openAnswer').value||'').trim();
      if(!val) return;
      sendAnswer(val, $('sendOpen'));
    };
  }
  accepting=true; updateStatus();
  window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'});
}

function sendAnswer(val, node){
  if(!accepting) return;
  if(!allowChange){
    const already = document.querySelector('.choice.selected');
    if(already) return;
  }
  document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));
  if(node && node.classList) node.classList.add('selected');
  socket.emit('answer',{room, name:me, answer:val});
  updateStatus('Réponse envoyée ✅');
}

document.getElementById('join').onclick = ()=>{
  room = ($('code').value || '').trim().toUpperCase();
  me = ($('name').value || '').trim();
  if(!room || !me){ alert('Code et pseudo requis'); return; }
  connect();
  socket.emit('join', {room, name:me});
};

const codeFromUrl = qsParam('code'); if(codeFromUrl){ $('code').value = codeFromUrl.toUpperCase(); }
