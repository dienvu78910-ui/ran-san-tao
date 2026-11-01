import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const COL = "apple_snake_scores";
const $ = id => document.getElementById(id);
const cv = $("cv"), ctx = cv.getContext("2d"), N = 20, S = cv.width / N;
const cloud = !firebaseConfig.apiKey.startsWith("DAN_");
const db = cloud ? getFirestore(initializeApp(firebaseConfig)) : null;

let snake, dir, nextDir, apple, score, timer, state = "idle";
let best = +localStorage.getItem("snakeBest") || 0;
$("best").textContent = best;

function reset() {
  snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  dir = nextDir = {x:1,y:0}; score = 0; $("score").textContent = 0;
  placeApple(); draw();
}
function placeApple() {
  do apple = {x:Math.floor(Math.random()*N), y:Math.floor(Math.random()*N)};
  while (snake.some(s => s.x === apple.x && s.y === apple.y));
}
function start() {
  reset(); state = "run"; $("overlay").hidden = true; $("saveForm").hidden = true;
  schedule();
}
function schedule() { clearTimeout(timer); timer = setTimeout(tick, Math.max(60, 140 - score * 4)); }
function tick() {
  if (state !== "run") return;
  dir = nextDir;
  const h = {x:snake[0].x + dir.x, y:snake[0].y + dir.y};
  if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some(s => s.x === h.x && s.y === h.y)) return over();
  snake.unshift(h);
  if (h.x === apple.x && h.y === apple.y) { score++; $("score").textContent = score; placeApple(); }
  else snake.pop();
  draw(); schedule();
}
function over() {
  state = "over";
  if (score > best) { best = score; localStorage.setItem("snakeBest", best); $("best").textContent = best; }
  $("msg").textContent = `Hết lượt! Bạn ăn ${score} quả táo.`;
  $("saveForm").hidden = score === 0; $("startBtn").textContent = "Chơi lại";
  $("overlay").hidden = false;
}
function draw() {
  ctx.fillStyle = "#f6fbff"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = "#e6f1f8";
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) ctx.fillRect(x*S, y*S, S, S);
  ctx.fillStyle = "#e8453c"; ctx.beginPath();
  ctx.arc(apple.x*S + S/2, apple.y*S + S/2, S/2 - 3, 0, 7); ctx.fill();
  snake.forEach((s, i) => {
    ctx.fillStyle = i ? "#3fa34d" : "#1b2a49";
    ctx.beginPath(); ctx.roundRect(s.x*S + 1, s.y*S + 1, S - 2, S - 2, 6); ctx.fill();
  });
}
function turn(x, y) { if (x !== -dir.x || y !== -dir.y) nextDir = {x, y}; }
function toggle() {
  if (state === "run") { state = "pause"; $("msg").textContent = "Tạm dừng"; $("startBtn").textContent = "Tiếp tục"; $("overlay").hidden = false; }
  else if (state === "pause") { state = "run"; $("overlay").hidden = true; schedule(); }
  else start();
}
const keys = {ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === " ") { e.preventDefault(); toggle(); }
  else if (keys[e.key]) { e.preventDefault(); turn(...keys[e.key]); }
});
let t0;
cv.addEventListener("touchstart", e => { t0 = e.touches[0]; }, {passive:true});
cv.addEventListener("touchend", e => {
  if (!t0) return;
  const dx = e.changedTouches[0].clientX - t0.clientX, dy = e.changedTouches[0].clientY - t0.clientY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy));
});
$("startBtn").onclick = toggle;

// ---------- Bảng xếp hạng (Firestore hoặc localStorage) ----------
async function loadBoard() {
  let rows = [];
  try {
    if (cloud) {
      const snap = await getDocs(query(collection(db, COL), orderBy("score", "desc"), limit(5)));
      rows = snap.docs.map(d => d.data());
      $("status").textContent = "Dữ liệu từ Firebase Firestore.";
    } else {
      rows = JSON.parse(localStorage.getItem("snakeRows") || "[]");
      $("status").textContent = "Chưa nối Firebase: đang lưu tạm trên máy.";
    }
  } catch (err) { $("status").textContent = "Không tải được bảng xếp hạng: " + err.code; }
  const ol = $("list"); ol.replaceChildren();
  if (!rows.length) ol.append(Object.assign(document.createElement("li"), {textContent: "Chưa có ai. Hãy là người đầu tiên!"}));
  rows.forEach(r => {
    const li = document.createElement("li"), sp = document.createElement("span");
    li.textContent = r.name; sp.textContent = r.score; li.append(sp); ol.append(li);
  });
}
$("saveForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("name").value.trim().slice(0, 12); if (!name) return;
  $("saveForm").hidden = true;
  try {
    if (cloud) await addDoc(collection(db, COL), {name, score, createdAt: serverTimestamp()});
    else {
      const r = JSON.parse(localStorage.getItem("snakeRows") || "[]");
      r.push({name, score}); r.sort((a, b) => b.score - a.score);
      localStorage.setItem("snakeRows", JSON.stringify(r.slice(0, 5)));
    }
  } catch (err) { $("status").textContent = "Lưu thất bại: " + err.code; }
  loadBoard();
});

reset(); loadBoard();
