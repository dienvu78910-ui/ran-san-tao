import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const COL = "bep_truong_scores", INK = "#2b1b3d";
const $ = id => document.getElementById(id);
const cv = $("cv"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
const cloud = !firebaseConfig.apiKey.startsWith("DAN_");
const db = cloud ? getFirestore(initializeApp(firebaseConfig)) : null;

const TYPES = {
  carrot:{hp:1, sp:95, r:13, pts:10}, chili:{hp:2, sp:65, r:14, pts:20, dash:1},
  onion:{hp:4, sp:48, r:18, pts:40}, boss:{hp:22, sp:40, r:34, pts:300, dash:1, boss:1}
};
const PERKS = [
  {n:"Chảo bự", d:"Tầm đánh +20%", f:()=>P.rng*=1.2},
  {n:"Tay nhanh", d:"Vung chảo nhanh hơn", f:()=>P.cd*=0.8},
  {n:"Ớt cay", d:"Sát thương +1", f:()=>P.dmg++},
  {n:"Tim khỏe", d:"+1 tim tối đa và hồi 1 tim", f:()=>{P.max++; P.hp=Math.min(P.max,P.hp+1);}},
  {n:"Giày lướt", d:"Hồi chiêu lướt -30%", f:()=>P.dcd*=0.7},
  {n:"Bước nhanh", d:"Chạy nhanh +12%", f:()=>P.spd*=1.12}
];
const keys = {}; let mouse = {x:W/2, y:H/2}, touchMode = false, target = null;
let P, E, FX, PT, wave, score, combo, comboT, left, spawnT, bossQ, banner, bannerT, state = "idle", last = 0;
let freeze = 0, shake = 0, hurtT = 0, clock = 0;
let best = +localStorage.getItem("chefBest") || 0;

// ---------- Âm thanh tổng hợp ----------
let AC;
function snd(f, d = .08, type = "square", v = .04, slide = 0) {
  try {
    AC = AC || new AudioContext(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(t + d);
  } catch {}
}
function burst(x, y, c, n, sp = 140) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = sp * (.3 + Math.random());
    PT.push({x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 30, t:.35 + Math.random() * .3, c, s:2 + Math.random() * 3}); }
}

// ---------- Logic ----------
function reset() {
  P = {x:W/2, y:H/2, hp:5, max:5, spd:175, rng:80, cd:.34, dmg:1, dcd:1, inv:0, atk:0, swing:0, sw:.2, sa:0,
       aim:0, dash:0, dashCd:0, dx:1, dy:0, t:0, mv:false, hit:true};
  E = []; FX = []; PT = []; wave = 0; score = 0; combo = 0; comboT = 0; nextWave();
}
function nextWave() {
  wave++; left = Math.min(24, 3 + wave * 2); spawnT = .6; bossQ = wave % 5 === 0;
  banner = bossQ ? "Trùm xuất hiện!" : "Đợt " + wave; bannerT = 1.8; snd(300, .25, "triangle", .06, 300);
}
function spawn() {
  let t = "carrot";
  if (bossQ) { t = "boss"; bossQ = false; }
  else { const r = Math.random(); t = wave >= 3 && r < .25 ? "onion" : wave >= 2 && r < .6 ? "chili" : "carrot"; }
  const side = Math.floor(Math.random() * 4), a = Math.random(), r0 = TYPES[t].r + 8;
  const p = [[a*W,-r0],[W+r0,a*H],[a*W,H+r0],[-r0,a*H]][side], hp = TYPES[t].hp + (t === "boss" ? wave * 2 : 0);
  E.push({...TYPES[t], t, hp, mhp:hp, x:p[0], y:p[1], h:0, w:Math.random() * 6, dashT:1 + Math.random() * 2, boost:0});
  if (t !== "boss") left--;
}
function start() { reset(); state = "run"; $("overlay").hidden = true; $("saveForm").hidden = true; $("perks").hidden = true; snd(440, .15, "triangle", .05, 400); }
function inputDir() {
  let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  let y = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (!x && !y && target) { const dx = target.x - P.x, dy = target.y - P.y, d = Math.hypot(dx, dy); if (d > 10) { x = dx / d; y = dy / d; } }
  const m = Math.hypot(x, y); return m ? {x:x/m, y:y/m} : {x:0, y:0};
}
function nearest() {
  let b = null, bd = 1e9;
  for (const e of E) { const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; b = e; } }
  return b;
}
function aimAngle() {
  const n = nearest();
  return touchMode && n ? Math.atan2(n.y - P.y, n.x - P.x) : Math.atan2(mouse.y - (P.y - 8), mouse.x - P.x);
}
function attack() {
  if (state !== "run" || P.atk > 0) return;
  P.atk = P.cd; P.sw = Math.min(.2, P.cd * .7); P.swing = P.sw; P.sa = aimAngle(); P.hit = false; snd(220, .09, "sawtooth", .03, -120);
}
function doHit() {
  for (const e of E) {
    const dx = e.x - P.x, dy = e.y - (P.y - 8), d = Math.hypot(dx, dy) || 1;
    let da = Math.abs(Math.atan2(dy, dx) - P.sa); if (da > Math.PI) da = 2 * Math.PI - da;
    if (d < P.rng + e.r && da < 1.3) {
      e.hp -= P.dmg; e.h = .12; const kb = e.boss ? 10 : 38; e.x += dx / d * kb; e.y += dy / d * kb;
      burst(e.x, e.y, ecolor(e), 7); FX.push({x:e.x, y:e.y - e.r, t:.6, txt:"-" + P.dmg, c:"#fff"});
      freeze = Math.max(freeze, .05); shake = Math.max(shake, 4); snd(140, .1, "square", .06, -60);
      if (e.hp <= 0) kill(e);
    }
  }
  E = E.filter(e => e.hp > 0);
}
function ecolor(e) { return {carrot:"#ff8a1f", chili:"#e0302b", onion:"#b57bd8", boss:"#ff7a1a"}[e.t]; }
function kill(e) {
  combo++; comboT = 2; const gain = e.pts * (1 + Math.floor(combo / 3)); score += gain;
  burst(e.x, e.y, ecolor(e), e.boss ? 50 : 18, e.boss ? 260 : 170); FX.push({x:e.x, y:e.y, t:1, txt:"+" + gain, c:"#e8453c"});
  shake = Math.max(shake, e.boss ? 14 : 6); freeze = e.boss ? .15 : .07; snd(520 + combo * 25, .14, "triangle", .06, 300);
}
function dash() {
  if (state !== "run" || P.dashCd > 0) return;
  const d = inputDir(); if (d.x || d.y) { P.dx = d.x; P.dy = d.y; }
  P.dash = .16; P.dashCd = P.dcd; P.inv = Math.max(P.inv, .3); snd(180, .15, "sine", .06, 500);
}
function update(dt) {
  clock += dt; P.aim = aimAngle();
  const d = inputDir(); if (d.x || d.y) { P.dx = d.x; P.dy = d.y; }
  P.mv = !!(d.x || d.y) || P.dash > 0; if (P.mv) P.t += dt; else P.t += dt * .2;
  const sp = P.dash > 0 ? 520 : P.spd, mv = P.dash > 0 ? {x:P.dx, y:P.dy} : d;
  P.x = Math.max(18, Math.min(W - 18, P.x + mv.x * sp * dt)); P.y = Math.max(40, Math.min(H - 16, P.y + mv.y * sp * dt));
  if (P.dash > 0) burst(P.x, P.y + 14, "#e9dcc2", 1, 40);
  for (const k of ["inv", "atk", "swing", "dash", "dashCd"]) P[k] = Math.max(0, P[k] - dt);
  if (P.swing > 0 && !P.hit && 1 - P.swing / P.sw >= .35) { P.hit = true; doHit(); }
  comboT -= dt; if (comboT <= 0) combo = 0;
  if ((left > 0 || bossQ) && (spawnT -= dt) <= 0) { spawn(); spawnT = Math.max(.35, .9 - wave * .05); }
  for (const e of E) {
    e.h = Math.max(0, e.h - dt); e.w += dt * 9;
    if (e.dash && (e.dashT -= dt) <= 0) { e.boost = .4; e.dashT = (e.boss ? 3 : 2) + Math.random() * 1.5; snd(120, .2, "sawtooth", .03, 200); }
    e.boost = Math.max(0, e.boost - dt);
    const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy) || 1, s = e.sp * (e.boost > 0 ? 4 : 1) * (1 + wave * .03);
    e.x += dx / dist * s * dt; e.y += dy / dist * s * dt;
    if (dist < e.r + 12 && P.inv <= 0 && P.dash <= 0) {
      P.hp--; P.inv = 1; combo = 0; hurtT = .4; shake = 10; freeze = .08; snd(90, .25, "sawtooth", .08, -40);
      burst(P.x, P.y, "#e8453c", 12);
      P.x = Math.max(18, Math.min(W - 18, P.x - dx / dist * 45)); P.y = Math.max(40, Math.min(H - 16, P.y - dy / dist * 45));
      if (P.hp <= 0) return over();
    }
  }
  PT.forEach(p => { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; }); PT = PT.filter(p => p.t > 0);
  FX.forEach(f => { f.t -= dt; f.y -= 34 * dt; }); FX = FX.filter(f => f.t > 0);
  bannerT -= dt; hurtT = Math.max(0, hurtT - dt);
  if (left === 0 && !bossQ && E.length === 0) { state = "perk"; showPerks(); }
}
function showPerks() {
  const box = $("perkList"); box.replaceChildren();
  [...PERKS].sort(() => Math.random() - .5).slice(0, 3).forEach(p => {
    const b = document.createElement("button"), t = document.createElement("b"), s = document.createElement("small");
    t.textContent = p.n; s.textContent = p.d; b.append(t, s);
    b.onclick = () => { p.f(); $("perks").hidden = true; state = "run"; nextWave(); snd(660, .15, "triangle", .06, 300); };
    box.append(b);
  });
  $("perks").hidden = false; snd(500, .2, "triangle", .05, 400);
}
function title(s) { return s < 200 ? "Phụ bếp tập sự" : s < 600 ? "Đầu bếp" : s < 1500 ? "Bếp phó" : s < 3000 ? "Bếp trưởng" : "Huyền thoại ẩm thực"; }
function over() {
  state = "over";
  const nb = score > best; if (nb) { best = score; localStorage.setItem("chefBest", best); }
  $("msg").textContent = `${title(score)}! Gục ở đợt ${wave} với ${score} điểm.` + (nb ? " Kỷ lục mới!" : ` Kỷ lục máy: ${best}, thử vượt nhé.`);
  $("saveForm").hidden = score === 0; $("startBtn").textContent = "Đấu lại"; $("overlay").hidden = false;
}

// ---------- Vẽ ----------
function ell(x, y, rx, ry, c, o) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill();
  if (o) { ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
}
function chef() {
  const f = Math.cos(P.aim) < 0 ? -1 : 1, bob = P.mv ? Math.sin(P.t * 16) * 1.6 : Math.sin(P.t * 3) * .8, lg = P.mv ? Math.sin(P.t * 16) * 5 : 0;
  ctx.save(); ctx.translate(P.x, P.y); ctx.globalAlpha = P.inv > 0 && Math.floor(P.inv * 14) % 2 ? .4 : (P.dash > 0 ? .65 : 1);
  ell(0, 17, 15, 5, "rgba(43,27,61,.2)");
  ctx.save(); ctx.scale(f, 1);
  ell(-5, 12 + lg * .4, 4.5, 5, "#3a3a52", 1); ell(5, 12 - lg * .4, 4.5, 5, "#3a3a52", 1);
  ell(0, -2 + bob, 12, 14, "#fff", 1); ell(0, -4 + bob, 1.6, 1.6, "#bbb"); ell(0, 3 + bob, 1.6, 1.6, "#bbb");
  ell(0, -12 + bob, 9, 4, "#e8453c", 1); ell(0, -22 + bob, 9, 9, "#f2c48b", 1);
  ell(3.5, -22 + bob, 1.7, 2.2, INK); ell(-3, -22 + bob, 1.7, 2.2, INK); ell(0, -18 + bob, 2.5, 1.2, "#c8553d");
  ell(-6, -37 + bob, 6, 6, "#fff", 1); ell(6, -37 + bob, 6, 6, "#fff", 1); ell(0, -40 + bob, 7, 6, "#fff", 1); ell(0, -31 + bob, 10, 3.5, "#fff", 1);
  ctx.restore();
  let a = P.aim; const k = .9 + (P.rng - 80) / 200;
  if (P.swing > 0) { const p = 1 - P.swing / P.sw; a = P.sa - 1.3 + 2.6 * (p * p * (3 - 2 * p));
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.moveTo(0, -8 + bob);
    ctx.arc(0, -8 + bob, P.rng * .95, P.sa - 1.3, a, false); ctx.closePath(); ctx.fill(); }
  ctx.translate(0, -8 + bob); ctx.rotate(a); ctx.scale(k, k);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, 0); ctx.stroke();
  ell(17, 0, 3.5, 3.5, "#f2c48b", 1); ctx.fillStyle = "#6b4a2f"; ctx.fillRect(16, -2.5, 16, 5);
  ell(42, 0, 14, 14, "#4a4a5e", 1); ell(42, 0, 10, 10, "#2f2f3c"); ell(38, -4, 4, 2.4, "rgba(255,255,255,.4)");
  ctx.restore();
}
function eyes(e, y, sp) {
  const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, ox = dx / d * 1.4, oy = dy / d * 1.4;
  for (const sx of [-sp, sp]) { ell(sx, y, 3.4, 3.8, "#fff", 1); ell(sx + ox, y + oy, 1.7, 1.9, INK); }
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(-sp - 4, y - 6); ctx.lineTo(-sp + 3, y - 3); ctx.moveTo(sp + 4, y - 6); ctx.lineTo(sp - 3, y - 3); ctx.stroke();
}
function foe(e) {
  const s = e.r / 14 * (1 + Math.sin(e.w) * .07), fl = e.h > 0, C = c => fl ? "#fff" : c;
  ctx.save(); ctx.translate(e.x, e.y); ell(0, e.r, e.r, e.r / 3, "rgba(43,27,61,.2)"); ctx.scale(s, s); ctx.lineWidth = 2; ctx.strokeStyle = INK;
  if (e.t === "carrot") {
    ell(-4, -14, 3, 6, C("#3ca655"), 1); ell(0, -16, 3, 7, C("#3ca655"), 1); ell(4, -14, 3, 6, C("#3ca655"), 1);
    ctx.fillStyle = C("#ff8a1f"); ctx.beginPath(); ctx.moveTo(-10, -9); ctx.quadraticCurveTo(0, -15, 10, -9); ctx.lineTo(1.5, 18); ctx.lineTo(-1.5, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(-1, 6); ctx.moveTo(2, 11); ctx.lineTo(5, 10); ctx.stroke(); eyes(e, -3, 4);
  } else if (e.t === "chili") {
    if (e.boost > 0) ell(-4, 4, 15, 15, "rgba(255,160,40,.55)");
    ctx.fillStyle = C("#e0302b"); ctx.beginPath(); ctx.moveTo(-8, -10); ctx.quadraticCurveTo(12, -14, 10, 4); ctx.quadraticCurveTo(9, 16, -6, 18); ctx.quadraticCurveTo(2, 6, -8, -10); ctx.fill(); ctx.stroke();
    ell(-8, -12, 4.5, 3, C("#3ca655"), 1); eyes(e, -2, 3.5);
  } else if (e.t === "onion") {
    ell(0, -13, 3, 6, C("#3ca655"), 1); ell(0, 2, 14, 13, C("#b57bd8"), 1);
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.ellipse(0, 2, 8, 13, 0, 0, 7); ctx.stroke();
    eyes(e, 0, 5); ell(-8, 7, 1.7, 2.6, "#6ec6ff");
  } else {
    ell(-8, 0, 9, 12, C("#e8660f"), 1); ell(8, 0, 9, 12, C("#e8660f"), 1); ell(0, 0, 9, 13, C("#ff7a1a"), 1);
    ctx.fillStyle = C("#4a7a2a"); ctx.fillRect(-2, -17, 4, 6); eyes(e, -3, 5);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-4, 10); ctx.lineTo(0, 6); ctx.lineTo(4, 10); ctx.lineTo(8, 6); ctx.lineTo(0, 13); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (e.boss) { ctx.fillStyle = INK; ctx.fillRect(e.x - 30, e.y - e.r - 14, 60, 7); ctx.fillStyle = "#e8453c"; ctx.fillRect(e.x - 29, e.y - e.r - 13, 58 * e.hp / e.mhp, 5); }
}
function draw() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  for (let x = 0; x < W / 40; x++) for (let y = 0; y < H / 40; y++) { ctx.fillStyle = (x + y) % 2 ? "#fff7e0" : "#ffe9b8"; ctx.fillRect(x * 40, y * 40, 40, 40); }
  ctx.strokeStyle = "rgba(43,27,61,.07)"; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, W - 1, H - 1);
  if (P) {
    [...E, {p:1, y:P.y}].sort((a, b) => a.y - b.y).forEach(o => o.p ? chef() : foe(o));
    PT.forEach(p => { ctx.globalAlpha = Math.min(1, p.t * 3); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); }); ctx.globalAlpha = 1;
    ctx.textAlign = "center"; ctx.font = "800 18px Nunito, sans-serif";
    FX.forEach(f => { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeText(f.txt, f.x, f.y); ctx.fillStyle = f.c; ctx.fillText(f.txt, f.x, f.y); }); ctx.globalAlpha = 1;
  }
  ctx.restore(); ctx.textAlign = "center";
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * .9); g.addColorStop(0, "rgba(43,27,61,0)"); g.addColorStop(1, "rgba(43,27,61,.28)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (hurtT > 0) { ctx.fillStyle = `rgba(232,69,60,${hurtT * .5})`; ctx.fillRect(0, 0, W, H); }
  if (!P) return;
  if (bannerT > 0 && state === "run") { ctx.globalAlpha = Math.min(1, bannerT); ctx.font = "44px Bungee, Impact, sans-serif"; ctx.lineWidth = 7; ctx.strokeStyle = "#fff"; ctx.strokeText(banner, W / 2, 80); ctx.fillStyle = INK; ctx.fillText(banner, W / 2, 80); ctx.globalAlpha = 1; }
  if (combo >= 2) { ctx.textAlign = "right"; ctx.font = "26px Bungee, Impact, sans-serif"; ctx.fillStyle = "#e8453c"; ctx.fillText("x" + (1 + Math.floor(combo / 3)) + " COMBO " + combo, W - 14, 32);
    ctx.fillStyle = INK; ctx.fillRect(W - 134, 40, 120, 6); ctx.fillStyle = "#7fd6c2"; ctx.fillRect(W - 133, 41, 118 * Math.max(0, comboT) / 2, 4); }
  $("hp").textContent = "❤️".repeat(Math.max(0, P.hp)) + "🖤".repeat(P.max - Math.max(0, P.hp)); $("wave").textContent = wave; $("score").textContent = score;
  $("combo").textContent = "";
}
function frame(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  if (state === "run") { if (freeze > 0) freeze -= dt; else update(dt); }
  shake = Math.max(0, shake - dt * 40); draw(); requestAnimationFrame(frame);
}

// ---------- Điều khiển ----------
addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase();
  if (k === "enter" && (state === "idle" || state === "over")) return start();
  if (state !== "run") return;
  if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
  if (k === "j" || k === " ") attack(); else if (k === "k" || k === "shift") dash(); else keys[k] = true;
});
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
const pt = e => { const r = cv.getBoundingClientRect(); return {x:(e.clientX - r.left) * W / r.width, y:(e.clientY - r.top) * H / r.height}; };
cv.addEventListener("mousemove", e => { touchMode = false; mouse = pt(e); });
cv.addEventListener("mousedown", e => { touchMode = false; mouse = pt(e); attack(); });
cv.addEventListener("touchstart", e => { touchMode = true; target = pt(e.touches[0]); }, {passive:true});
cv.addEventListener("touchmove", e => { target = pt(e.touches[0]); }, {passive:true});
cv.addEventListener("touchend", () => { target = null; });
$("atkBtn").addEventListener("pointerdown", e => { e.preventDefault(); touchMode = e.pointerType === "touch"; attack(); });
$("dashBtn").addEventListener("pointerdown", e => { e.preventDefault(); dash(); });
$("startBtn").onclick = start;

// ---------- Bảng xếp hạng ----------
async function loadBoard() {
  let rows = [];
  try {
    if (cloud) {
      const snap = await getDocs(query(collection(db, COL), orderBy("score", "desc"), limit(5)));
      rows = snap.docs.map(d => d.data()); $("status").textContent = "Dữ liệu từ Firebase Firestore.";
    } else { rows = JSON.parse(localStorage.getItem("chefRows") || "[]"); $("status").textContent = "Chưa nối Firebase: đang lưu tạm trên máy."; }
  } catch (err) { $("status").textContent = "Không tải được bảng xếp hạng: " + err.code; }
  const ol = $("list"); ol.replaceChildren();
  if (!rows.length) ol.append(Object.assign(document.createElement("li"), {textContent:"Chưa có ai. Hãy là bếp trưởng đầu tiên!"}));
  rows.forEach(r => { const li = document.createElement("li"), sp = document.createElement("span"); li.textContent = r.name; sp.textContent = r.score; li.append(sp); ol.append(li); });
}
$("saveForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("name").value.trim().slice(0, 12); if (!name) return;
  $("saveForm").hidden = true;
  try {
    if (cloud) await addDoc(collection(db, COL), {name, score, createdAt: serverTimestamp()});
    else { const r = JSON.parse(localStorage.getItem("chefRows") || "[]"); r.push({name, score}); r.sort((a, b) => b.score - a.score); localStorage.setItem("chefRows", JSON.stringify(r.slice(0, 5))); }
  } catch (err) { $("status").textContent = "Lưu thất bại: " + err.code; }
  loadBoard();
});

reset(); state = "idle"; bannerT = 0; loadBoard(); requestAnimationFrame(frame);
