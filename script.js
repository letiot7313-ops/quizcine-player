// === SOCKET.IO CONFIG ===
const IO_URL = "https://quizcine-server-1.onrender.com";
const socket = io(IO_URL, { transports: ["websocket"], path: "/socket.io" });

// === UI ELEMENTS ===
const joinBox = document.getElementById("joinBox");
const gameBox = document.getElementById("gameBox");
const roomInput = document.getElementById("roomInput");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");

const questionBox = document.getElementById("questionBox");
const choicesBox = document.getElementById("choices");
const timerEl = document.getElementById("timer");
const qImage = document.getElementById("qImage");

const openInput = document.getElementById("openInput");
const sendOpen = document.getElementById("sendOpen");

const revealBox = document.getElementById("revealBox");
const revealText = document.getElementById("revealText");
const answerImage = document.getElementById("answerImage");

let currentRoom = null;
let canAnswer = false;
let countdown = null;

// === PLAYER JOINS ROOM ===
joinBtn.onclick = () => {
  const room = roomInput.value.trim().toUpperCase();
  const name = nameInput.value.trim();
  if (!room || !name) return alert("Code + nom requis !");

  currentRoom = room;
  socket.emit("join", { room, name });
};

// === SERVER CONFIRMS JOIN ===
socket.on("joined", () => {
  joinBox.style.display = "none";
  gameBox.style.display = "block";
});

// === NEW QUESTION ===
socket.on("question", q => {
  canAnswer = true;

  // Reset everything
  revealBox.style.display = "none";
  answerImage.style.display = "none";
  choicesBox.innerHTML = "";
  qImage.style.display = "none";
  openInput.style.display = "none";
  sendOpen.style.display = "none";

  // Set text
  questionBox.innerHTML = `<h2>${q.text}</h2>`;

  // Set question image
  if (q.image) {
    qImage.src = q.image;
    qImage.style.display = "block";
  }

  // === QCM ===
  if (q.type === "mcq" && q.choices?.length) {
    q.choices.forEach(choice => {
      const btn = document.createElement("div");
      btn.className = "choice";
      btn.textContent = choice;
      btn.onclick = () => sendMcq(choice, btn);
      choicesBox.appendChild(btn);
    });
  }

  // === QUESTION OUVERTE ===
  if (q.type === "open") {
    openInput.value = "";
    openInput.style.display = "block";
    sendOpen.style.display = "inline-block";

    sendOpen.onclick = () => {
      if (!canAnswer) return;
      const txt = openInput.value.trim();
      if (!txt) return alert("Tape une réponse !");

      canAnswer = false;
      socket.emit("answer", {
        room: currentRoom,
        name: nameInput.value,
        answer: txt
      });

      openInput.style.display = "none";
      sendOpen.style.display = "none";
    };
  }

  startTimer(q.duration || 30);
});

// === ACCEPTING STATUS ===
socket.on("accepting", state => {
  canAnswer = state;
});

// === REVEAL PHASE ===
socket.on("reveal", data => {
  canAnswer = false;
  revealText.textContent = data.answer;
  revealBox.style.display = "block";

  if (data.answerImage) {
    answerImage.src = data.answerImage;
    answerImage.style.display = "block";
  }

  openInput.style.display = "none";
  sendOpen.style.display = "none";
});

// === TIMER ===
function startTimer(sec) {
  clearInterval(countdown);
  timerEl.textContent = sec;

  countdown = setInterval(() => {
    sec--;
    timerEl.textContent = sec;
    if (sec <= 0) clearInterval(countdown);
  }, 1000);
}

// === SEND MCQ ANSWER ===
function sendMcq(ans, btn) {
  if (!canAnswer) return;
  canAnswer = false;

  socket.emit("answer", {
    room: currentRoom,
    name: nameInput.value,
    answer: ans
  });

  btn.classList.add("selected");
}
