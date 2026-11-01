import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const COL = "bep_truong_scores";
const $ = id => document.getElementById(id);
const cv = $("cv"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
const cloud = !firebaseConfig.apiKey.startsWith("DAN_");
const db = cloud ? getFirestore(initializeApp(firebaseConfig)) : null;

const TYPES = {
  carrot: {e:"🥕", hp:1, sp:95, r:13, pts:10},
  chili:  {e:"🌶️", hp:2, sp:65, r:14, pts:20, dash:true},
  onion:  {e:"🧅", hp:4, sp:48, r:18, pts:40}
};
const keys = {}; let mouse = {x:W/2, y:H/2}, touchMode = false, target = null;
let P, E, FX, wave, score, combo, comboT, left, spawnT, banner, bannerT, state = "idle", last = 0;
let best = +localStorage.getItem("chefBest") || 0;

function reset() {
  P = {x:W/2, y:H/2, hp:5, inv:0, atk:0, swing:0, ang:0, dash:0, dashCd:0, dx:1, dy:0};
  E = []; FX = []; wave = 0; score = 0; combo = 0; comboT = 0; nextWave();
}
function nextWave() {
  wave++; left = 3 + wave * 2; spawnT = 0.5;
  if (wave > 1) P.hp = Math.min(5, P.hp + 1);
  banner = "Đợt " + wave; bannerT = 1.6;
}
function spawn() {
  const r = Math.random();
  const t = wave >= 3 && r < .25 ? "onion" : wave >= 2 && r < .6 ? "chili" : "carrot";
  const side = Math.floor(Math.random() * 4), a = Math.random();
  const pos = [[a*W,-20],[W+20,a*H],[a*W,H+20],[-20,a*H]][side];
  E.push({...TYPES[t], t, x:pos[0], y:pos[1], h:0, dashT:1 + Math.random() * 2, boost:0});
  left--;
}
function start() {
  reset(); state = "run"; $("overlay").hidden = true; $("saveForm").hidden = true;
}
function inputDir() {
  let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  let y = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (!x && !y && target) {
    const dx = target.x - P.x, dy = target.y - P.y, d = Math.hypot(dx, dy);
    if (d > 10) { x = dx / d; y = dy / d; }
  }
  const m = Math.hypot(x, y); return m ? {x:x/m, y:y/m} : {x:0, y:0};
}
function nearest() {
  let b = null, bd = 1e9;
  for (const e of E) { const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; b = e; } }
  return b;
}
function attack() {
  if (state !== "run" || P.atk > 0) return;
  let a;
  const n = nearest();
  if (touchMode && n) a = Math.atan2(n.y - P.y, n.x - P.x);
  else a = Math.atan2(mouse.y - P.y, mouse.x - P.x);
  P.atk = 0.32; P.swing = 0.18; P.ang = a;
  for (const e of E) {
    const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy);
    let da = Math.abs(Math.atan2(dy, dx) - a); if (da > Math.PI) da = 2 * Math.PI - da;
    if (d < 75 + e.r && da < 1.1) {
      e.hp--; e.h = 0.12; e.x += dx / d * 36; e.y += dy / d * 36;
      if (e.hp <= 0) kill(e);
    }
  }
  E = E.filter(e => e.hp > 0);
}
function kill(e) {
  combo++; comboT = 2;
  const gain = e.pts * (1 + Math.floor(combo / 3));
  score += gain; FX.push({x:e.x, y:e.y, t:0.8, txt:"+" + gain});
}
function dash() {
  if (state !== "run" || P.dashCd > 0) return;
  const d = inputDir(); if (d.x || d.y) { P.dx = d.x; P.dy = d.y; }
  P.dash = 0.16; P.dashCd = 1; P.inv = Math.max(P.inv, 0.3);
}
function update(dt) {
  const d = inputDir(); if (d.x || d.y) { P.dx = d.x; P.dy = d.y; }
  const sp = P.dash > 0 ? 520 : 175, mv = P.dash > 0 ? {x:P.dx, y:P.dy} : d;
  P.x = Math.max(16, Math.min(W - 16, P.x + mv.x * sp * dt));
  P.y = Math.max(16, Math.min(H - 16, P.y + mv.y * sp * dt));
  for (const k of ["inv", "atk", "swing", "dash", "dashCd"]) P[k] = Math.max(0, P[k] - dt);
  comboT -= dt; if (comboT <= 0) combo = 0;
  if (left > 0 && (spawnT -= dt) <= 0) { spawn(); spawnT = Math.max(0.35, 0.9 - wave * 0.05); }
  for (const e of E) {
    e.h = Math.max(0, e.h - dt);
    if (e.dash && (e.dashT -= dt) <= 0) { e.boost = 0.35; e.dashT = 2 + Math.random() * 1.5; }
    e.boost = Math.max(0, e.boost - dt);
    const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy) || 1;
    const s = e.sp * (e.boost > 0 ? 4 : 1) * (1 + wave * 0.03);
    e.x += dx / dist * s * dt; e.y += dy / dist * s * dt;
    if (dist < e.r + 14 && P.inv <= 0 && P.dash <= 0) {
      P.hp--; P.inv = 1; combo = 0;
      P.x = Math.max(16, Math.min(W - 16, P.x - dx / dist * 40));
      P.y = Math.max(16, Math.min(H - 16, P.y - dy / dist * 40));
      if (P.hp <= 0) return over();
    }
  }
  FX.forEach(f => { f.t -= dt; f.y -= 30 * dt; }); FX = FX.filter(f => f.t > 0);
  if (bannerT > 0) bannerT -= dt;
  if (left === 0 && E.length === 0) nextWave();
}
function over() {
  state = "over";
  if (score > best) { best = score; localStorage.setItem("chefBest", best); }
  $("msg").textContent = `Bếp trưởng gục ngã ở đợt ${wave} với ${score} điểm. Kỷ lục máy: ${best}.`;
  $("saveForm").hidden = score === 0; $("startBtn").textContent = "Đấu lại";
  $("overlay").hidden = false;
}
function emoji(t, x, y, size) {
  ctx.font = size + "px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, x, y);
}
function draw() {
  for (let x = 0; x < W / 40; x++) for (let y = 0; y < H / 40; y++) {
    ctx.fillStyle = (x + y) % 2 ? "#fff7e0" : "#ffe9b8"; ctx.fillRect(x * 40, y * 40, 40, 40);
  }
  if (!P) return;
  const shadow = (x, y, r) => { ctx.fillStyle = "rgba(43,27,61,.18)"; ctx.beginPath(); ctx.ellipse(x, y + r, r, r / 3, 0, 0, 7); ctx.fill(); };
  for (const e of E) {
    shadow(e.x, e.y, e.r);
    ctx.globalAlpha = e.h > 0 ? 0.45 : 1; emoji(e.e, e.x, e.y, e.r * 2.1); ctx.globalAlpha = 1;
    if (e.boost > 0) { ctx.strokeStyle = "#e8453c"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, 0, 7); ctx.stroke(); }
  }
  shadow(P.x, P.y, 14);
  if (P.swing > 0) {
    ctx.fillStyle = "rgba(232,69,60,.35)"; ctx.beginPath(); ctx.moveTo(P.x, P.y);
    ctx.arc(P.x, P.y, 80, P.ang - 1.1, P.ang + 1.1); ctx.closePath(); ctx.fill();
    emoji("🍳", P.x + Math.cos(P.ang) * 52, P.y + Math.sin(P.ang) * 52, 30);
  }
  ctx.globalAlpha = P.inv > 0 && Math.floor(P.inv * 12) % 2 ? 0.4 : (P.dash > 0 ? 0.6 : 1);
  emoji("🧑‍🍳", P.x, P.y, 32); ctx.globalAlpha = 1;
  ctx.fillStyle = "#e8453c"; ctx.font = "800 18px Nunito, sans-serif";
  FX.forEach(f => { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillText(f.txt, f.x, f.y); }); ctx.globalAlpha = 1;
  if (bannerT > 0 && state === "run") { ctx.fillStyle = "#2b1b3d"; ctx.font = "44px Bungee, Impact, sans-serif"; ctx.fillText(banner, W / 2, 70); }
  $("hp").textContent = "❤️".repeat(P.hp) || "💀"; $("wave").textContent = wave; $("score").textContent = score;
  $("combo").textContent = combo >= 2 ? `Combo x${1 + Math.floor(combo / 3)} (${combo})` : "";
}
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (state === "run") update(dt);
  draw(); requestAnimationFrame(frame);
}
addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase();
  if (k === "enter" && state !== "run") return start();
  if (state !== "run") return;
  if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
  if (k === "j" || k === " ") attack();
  else if (k === "k" || k === "shift") dash();
  else keys[k] = true;
});
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
const pt = e => { const r = cv.getBoundingClientRect(); return {x:(e.clientX - r.left) * W / r.width, y:(e.clientY - r.top) * H / r.height}; };
cv.addEventListener("mousemove", e => { touchMode = false; mouse = pt(e); });
cv.addEventListener("mousedown", e => { touchMode = false; mouse = pt(e); attack(); });
cv.addEventListener("touchstart", e => { touchMode = true; target = pt(e.touches[0]); }, {passive:true});
cv.addEventListener("touchmove", e => { target = pt(e.touches[0]); }, {passive:true});
cv.addEventListener("touchend", () => { target = null; });
$("atkBtn").addEventListener("pointerdown", e => { e.preventDefault(); attack(); });
$("dashBtn").addEventListener("pointerdown", e => { e.preventDefault(); dash(); });
$("startBtn").onclick = start;

async function loadBoard() {
  let rows = [];
  try {
    if (cloud) {
      const snap = await getDocs(query(collection(db, COL), orderBy("score", "desc"), limit(5)));
      rows = snap.docs.map(d => d.data()); $("status").textContent = "Dữ liệu từ Firebase Firestore.";
    } else {
      rows = JSON.parse(localStorage.getItem("chefRows") || "[]");
      $("status").textContent = "Chưa nối Firebase: đang lưu tạm trên máy.";
    }
  } catch (err) { $("status").textContent = "Không tải được bảng xếp hạng: " + err.code; }
  const ol = $("list"); ol.replaceChildren();
  if (!rows.length) ol.append(Object.assign(document.createElement("li"), {textContent: "Chưa có ai. Hãy là bếp trưởng đầu tiên!"}));
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
      const r = JSON.parse(localStorage.getItem("chefRows") || "[]");
      r.push({name, score}); r.sort((a, b) => b.score - a.score);
      localStorage.setItem("chefRows", JSON.stringify(r.slice(0, 5)));
    }
  } catch (err) { $("status").textContent = "Lưu thất bại: " + err.code; }
  loadBoard();
});

reset(); state = "idle"; loadBoard(); requestAnimationFrame(frame);
