// === Config Socket.IO ===
const IO_URL = "https://quizcine-server-1.onrender.com";
const socket = io(IO_URL, { transports:["websocket"], path:"/socket.io" });

// === UI Elements ===
const joinBox = document.getElementById("joinBox");
const gameBox = document.getElementById("gameBox");
const roomInput = document.getElementById("roomInput");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");
const questionBox = document.getElementById("questionBox");
const choicesBox = document.getElementById("choices");
const timerEl = document.getElementById("timer");
const qImage = document.getElementById("qImage");
const revealBox = document.getElementById("revealBox");
const revealText = document.getElementById("revealText");
const answerImage = document.getElementById("answerImage");

let currentRoom = null;
let canAnswer = false;
let countdown = null;

// === Join Room ===
joinBtn.onclick = () => {
  const room = roomInput.value.trim().toUpperCase();
  const name = nameInput.value.trim();
  if(!room || !name) return alert("Code et pseudo nécessaires!");

  currentRoom = room;
  socket.emit("join", { room, name });
};

// === Joined OK ===
socket.on("joined", () => {
  joinBox.style.display = "none";
  gameBox.style.display = "block";
});

// === New Question ===
socket.on("question", q => {
  canAnswer = true;

  revealBox.style.display = "none";
  answerImage.style.display = "none";
  choicesBox.innerHTML = "";
  qImage.style.display = "none";

  // Text
  questionBox.innerHTML = `<h2>${q.text}</h2>`;

  // Image
  if(q.image){
    qImage.src = q.image;
    qImage.style.display = "block";
  }

  // Choices
  if(q.type === "mcq" && q.choices.length){
    q.choices.forEach((c,idx)=>{
      const btn = document.createElement("div");
      btn.className = "choice";
      btn.textContent = c;
      btn.onclick = ()=> sendAnswer(c, btn);
      choicesBox.appendChild(btn);
    });
  }

  // Timer
  startTimer(q.duration || 30);
});

// === Accepting State ===
socket.on("accepting", state => {
  canAnswer = state;
});

// === Reveal ===
socket.on("reveal", data => {
  canAnswer = false;
  revealText.textContent = data.answer;
  revealBox.style.display = "block";

  if(data.answerImage){
    answerImage.src = data.answerImage;
    answerImage.style.display = "block";
  }
});

// === Timer ===
function startTimer(sec){
  clearInterval(countdown);
  timerEl.textContent = sec;

  countdown = setInterval(()=>{
    sec--;
    timerEl.textContent = sec;
    if(sec <= 0){
      clearInterval(countdown);
    }
  },1000);
}

// === Send Answer ===
function sendAnswer(ans, btn){
  if(!canAnswer) return;

  canAnswer = false;
  socket.emit("answer", {
    room: currentRoom,
    name: nameInput.value,
    answer: ans
  });

  btn.classList.add("selected");
}
