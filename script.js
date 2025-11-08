// ===== Utils =====
const $ = id => document.getElementById(id);
const qs = k => new URL(location.href).searchParams.get(k);

// ✅ URL Socket.IO du serveur (Render)
const IO_URL = "https://quizcine-server-1.onrender.com";

let socket = null;
let room = null;
let me = null;
let accepting = false;
let allowChange = true;

function connectIO(){
  socket = io(IO_URL, {
    transports: ["websocket"],
    path: "/socket.io"
  });

  socket.on("connect", ()=> {
    // rien à faire ici ; on join quand l'user clique
  });

  socket.on("joined", ()=> {
    $('screen').style.display = "block";
  });

  socket.on("question", (q)=> {
    showQuestion(q);
  });

  socket.on("accepting", (v)=> {
    accepting = !!v;
    updateStatus();
  });

  socket.on("reveal", (data)=> {
    accepting = false;
    updateStatus("Révélé.");
  });
}

function updateStatus(extra){
  $('status').textContent = (accepting ? "Répondez maintenant" : "En attente…") + (extra? " " + extra : "");
}

function showQuestion(q){
  $('qtext').textContent = q.text || "";
  const img = $('qimg');
  if(q.image){ img.src = q.image; img.style.display = 'block'; }
  else { img.style.display = 'none'; }

  const box = $('choices');
  box.innerHTML = "";
  allowChange = !!q.allowChange;

  const isOpen = (q.type || "mcq") === "open";
  $('openBox').style.display = isOpen ? 'block' : 'none';

  if(!isOpen){
    (q.choices || []).forEach((c)=>{
      const d = document.createElement('div');
      d.className = 'choice';
      d.textContent = c || '';
      d.onclick = ()=> sendAnswer(c, d);
      box.appendChild(d);
    });
  } else {
    $('sendOpen').onclick = ()=>{
      const v = ($('openAnswer').value || '').trim();
      if(!v) return;
      sendAnswer(v, $('sendOpen'));
    };
  }

  accepting = true;
  updateStatus();
}

function sendAnswer(val, node){
  if(!accepting) return;
  if(!allowChange){
    const already = document.querySelector('.choice.selected');
    if(already) return;
  }
  document.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));
  if(node && node.classList) node.classList.add('selected');

  socket.emit("answer", { room, name: me, answer: val });
  updateStatus("Réponse envoyée ✅");
}

$('join').onclick = ()=>{
  room = ($('code').value || '').trim().toUpperCase();
  me   = ($('name').value || '').trim();
  if(!room || !me){ alert("Code + pseudo requis"); return; }

  connectIO();
  socket.emit("join", { room, name: me });
};

// préremplir avec ?code=XYZ
const codeFromUrl = qs("code");
if(codeFromUrl){ $('code').value = codeFromUrl.toUpperCase(); }
