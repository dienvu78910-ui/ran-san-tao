import * as THREE from "three";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const COL = "lop_truong_scores";
const $ = id => document.getElementById(id), box = $("cv"), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cloud = !firebaseConfig.apiKey.startsWith("DAN_");
const db = cloud ? getFirestore(initializeApp(firebaseConfig)) : null;

// ---------- Engine 3D ----------
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
box.append(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xbfe3f2); scene.fog = new THREE.Fog(0xbfe3f2, 32, 60);
const cam = new THREE.PerspectiveCamera(42, 1.5, .1, 100);
function resize() { const w = box.clientWidth, h = box.clientHeight; renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(box); resize();
scene.add(new THREE.HemisphereLight(0xffffff, 0x7a6a8a, 1.1));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.4); sun.position.set(8, 18, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-22, right:22, top:16, bottom:-16, near:1, far:50}); sun.shadow.bias = -.0004; scene.add(sun);
const M = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({color:c, roughness:r, metalness:m});
const SP = (r, w = 18, h = 12) => new THREE.SphereGeometry(r, w, h), CY = (a, b, h, s = 18) => new THREE.CylinderGeometry(a, b, h, s), BX = (a, b, c) => new THREE.BoxGeometry(a, b, c);
function mk(geo, mat, x = 0, y = 0, z = 0, p) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; if (p) p.add(m); return m; }
const floorTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? "#fff2cf" : "#f0d595"; x.fillRect(i * 64, j * 64, 64, 64); }
  x.strokeStyle = "rgba(43,27,61,.18)"; x.lineWidth = 3; x.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 5.5); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
})();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(32, 22), M(0xffffff, .75)); ground.material.map = floorTex; ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const outer = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), M(0xb9aed0, 1)); outer.rotation.x = -Math.PI / 2; outer.position.y = -.02; outer.receiveShadow = true; scene.add(outer);
const wallM = M(0x2b1b3d, .5);
[[0, -11.3, 33, .6], [0, 11.3, 33, .6], [-16.3, 0, .6, 23], [16.3, 0, .6, 23]].forEach(([x, z, w, d]) => { const b = mk(BX(w, 1, d), wallM, x, .5, z, scene); b.receiveShadow = true; });

// ---------- Nhân vật 3D ----------
const R = {}, PM = {shoe:M(0xffffff, .5), glove:M(0xf1c9a0, .6), pad:M(0x9aa3b5, .35, .7), band:M(0xe8453c, .6), glass:M(0x111111, .15, .5),
  jk:M(0x4a78b8, .7), sh:Object.assign(M(0xa8774a, .45, .35), {transparent:true}), rim:M(0xa3a9b5, .3, .9)};
function buildPlayer() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const skin = M(0xf1c9a0, .55), cream = M(0xefeadf, .85), jeans = M(0x2f3b57, .8), hairM = M(0x1c1a1f, .35), blk = M(0x16161b, .3, .3);
  R.legs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .3, 1, 0); body.add(g); mk(CY(.26, .24, .9), jeans, 0, -.45, 0, g); mk(BX(.5, .28, .85), PM.shoe, 0, -.95, .12, g); return g; });
  R.wings = [-1, 1].map(s => { const w = mk(BX(.7, .04, .45), M(0xffffff, .5), s * .55, -.8, -.1, R.legs[s < 0 ? 0 : 1]); w.rotation.z = s * .5; return w; });
  mk(new THREE.CapsuleGeometry(.6, .7,6,14), cream, 0, 1.85, 0, body).scale.set(1, 1, .78);
  const lc = document.createElement("canvas"); lc.width = lc.height = 64; const lx = lc.getContext("2d");
  lx.fillStyle = "#2b1b3d"; lx.fillRect(0, 0, 64, 64); lx.fillStyle = "#fff"; lx.font = "800 46px sans-serif"; lx.textAlign = "center"; lx.fillText("E", 32, 50);
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace; mk(new THREE.PlaneGeometry(.5, .5), new THREE.MeshStandardMaterial({map:lt, roughness:.8}), 0, 1.95, .49, body);
  R.jk = new THREE.Group(); body.add(R.jk); [-1, 1].forEach(s => mk(BX(.32, 1.2, 1), PM.jk, s * .5, 1.8, .03, R.jk));
  R.pads = [-1, 1].map(s => mk(SP(.32), PM.pad.clone(), s * .72, 2.45, 0, body));
  R.cape = mk(BX(1.1, 1.5, .06), M(0xe8453c, .7), 0, 1.9, -.55, body); R.badge = mk(SP(.1), M(0xe8453c), .3, 1.7, .5, body);
  mk(SP(.55, 28, 18), skin, 0, 2.95, 0, body); [-1, 1].forEach(s => { mk(SP(.07, 10, 8), blk, s * .2, 2.93, .5, body); mk(SP(.13, 10, 8), skin, s * .55, 2.93, 0, body); const b = mk(BX(.2, .04, .04), blk, s * .2, 3.1, .5, body); b.rotation.z = s * .12; });
  mk(SP(.06, 8, 8), skin, 0, 2.85, .56, body);
  mk(new THREE.SphereGeometry(.6, 24, 14, 0, Math.PI * 2, 0, Math.PI * .52), hairM, 0, 3, -.03, body); const fr = mk(BX(.95, .13, .3), hairM, 0, 3.3, .42, body); fr.rotation.x = .35;
  mk(new THREE.TorusGeometry(.62, .09, 10, 28), blk, 0, 2.38, 0, body).rotation.x = Math.PI / 2;
  [-1, 1].forEach(s => mk(CY(.22, .22, .18), blk, s * .68, 2.38, 0, body).rotation.z = Math.PI / 2);
  R.glasses = mk(BX(.8, .2, .1), PM.glass, 0, 2.95, .53, body);
  R.band = mk(new THREE.TorusGeometry(.57, .05, 8, 24), PM.band, 0, 3.15, 0, body); R.band.rotation.x = Math.PI / 2;
  R.tails = new THREE.Group(); body.add(R.tails); [-1, 1].forEach(s => mk(BX(.12, .04, .8), PM.band, s * .12, 3.15, -.85, R.tails));
  R.shield = mk(CY(.7, .7, .12, 22), PM.sh, -.98, 1.7, .3, body); R.shield.rotation.z = Math.PI / 2;
  mk(CY(.15, .13, 1.1), cream, .8 * -1, 1.7, .15, body).rotation.x = .3;
  R.body = body;
  const w = R.weapon = new THREE.Group(); w.position.y = 2.1; root.add(w);
  mk(CY(.17, .15, 1.6), cream, 0, 0, .9, w).rotation.x = Math.PI / 2; R.hand = mk(SP(.25), PM.glove, 0, 0, 1.75, w);
  const tg = R.tireG = new THREE.Group(); tg.position.z = 2.5; tg.rotation.y = Math.PI / 2; w.add(tg);
  const sp = R.tireSpin = new THREE.Group(); tg.add(sp);
  mk(new THREE.TorusGeometry(.85, .38, 14, 32), M(0x1c1c22, .9), 0, 0, 0, sp); R.rimM = PM.rim.clone();
  mk(CY(.62, .62, .5, 24), R.rimM, 0, 0, 0, sp).rotation.x = Math.PI / 2; mk(CY(.2, .2, .6, 12), M(0x6c717c, .3, .9), 0, 0, 0, sp).rotation.x = Math.PI / 2;
  R.studs = new THREE.Group(); sp.add(R.studs); for (let i = 0; i < 14; i++) { const t = i / 14 * 6.283; mk(SP(.1, 8, 6), M(0xd9dde6, .2, .9), Math.cos(t) * 1.25, Math.sin(t) * 1.25, 0, R.studs); }
  R.aura = mk(new THREE.TorusGeometry(.9, .52, 10, 28), new THREE.MeshBasicMaterial({color:0xff8a1f, transparent:true, opacity:.35}), 0, 0, 0, sp); R.aura.castShadow = false;
  R.tire2 = sp.clone(); R.tire2.position.z = -.85; tg.add(R.tire2); R.studs2 = R.tire2.children.find(c => c.type === "Group"); R.aura2 = R.tire2.children[R.tire2.children.length - 1];
  const tm = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.5, side:THREE.DoubleSide}); R.trail = new THREE.Mesh(new THREE.RingGeometry(1, 3, 2), tm); R.trail.rotation.x = -Math.PI / 2; R.trail.position.y = .15; R.trail.visible = false; scene.add(R.trail);
  scene.add(root); return root;
}
const ECFG = {nhan:{c:0x4a90d9, h:0x6b4a2f, s:.9}, hot:{c:0x26262b, h:0x3a2616, s:.95}, gym:{c:0xe8453c, h:0x2b2b2b, s:1.1}, boss:{c:0x1d1d28, h:0x9a9aa5, s:2.1}};
function buildFoe(t, mats) {
  const c = ECFG[t], g = new THREE.Group(), M2 = (col, r = .65, m = 0) => { const x = M(col, r, m); mats.push(x); return x; };
  const skin = M2(0xf1c9a0, .55), shirt = M2(c.c, .7), pants = M2(0x33384d, .8), hair = M2(c.h, .5), dark = M(0x111118, .3), w = t === "gym" ? 1.35 : t === "boss" ? 1.2 : 1;
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .25, .75, 0); g.add(l); mk(BX(.3, .8, .35), pants, 0, -.4, 0, l); return l; });
  mk(new THREE.CapsuleGeometry(.45, .5, 6, 12), shirt, 0, 1.45, 0, g).scale.set(w, 1, .8);
  [-1, 1].forEach(s => { const a = mk(CY(.13, .12, .9), shirt, s * .62 * w, 1.4, 0, g); a.rotation.z = s * .15; });
  mk(SP(.45, 22, 14), skin, 0, 2.3, 0, g); mk(new THREE.SphereGeometry(.48, 20, 12, 0, Math.PI * 2, 0, Math.PI * .52), hair, 0, 2.36, -.02, g);
  [-1, 1].forEach(s => { mk(SP(.1, 10, 8), M(0xffffff, .3), s * .18, 2.32, .38, g); mk(SP(.05, 8, 8), dark, s * .18, 2.32, .46, g); mk(BX(.22, .05, .05), dark, s * .18, 2.5, .43, g).rotation.z = s * .45; });
  if (t === "nhan") { mk(BX(.3, .5, .05), dark, .7, 1.5, .45, g); mk(BX(.24, .42, .02), new THREE.MeshStandardMaterial({color:0x9fe3ff, emissive:0x5fb8e8, emissiveIntensity:.9}), .7, 1.5, .48, g); }
  if (t === "hot") { [-.2, 0, .2].forEach(x => mk(new THREE.ConeGeometry(.12, .4, 8), hair, x, 2.85, 0, g)); mk(BX(.7, .16, .1), dark, 0, 2.33, .44, g); }
  if (t === "gym") { [-1, 1].forEach(s => mk(SP(.28), skin, s * .85, 1.6, 0, g)); mk(new THREE.TorusGeometry(.46, .04, 8, 20), M2(0xffffff), 0, 2.52, 0, g).rotation.x = Math.PI / 2; }
  if (t === "boss") { mk(BX(.14, .6, .05), M2(0xe8453c), 0, 1.5, .38, g); mk(new THREE.TorusGeometry(.3, .03, 8, 20), M2(0xffd25e, .3, .8), 0, 1.85, .2, g).rotation.x = Math.PI / 2; mk(SP(.2), M2(0xffd25e, .3, .8), -.9, 1.1, .1, g); }
  g.scale.setScalar(c.s); g.userData.legs = legs; return g;
}

// ---------- Trạng thái game ----------
const TYPES = {nhan:{hp:1, sp:4.7, r:.65, pts:10}, hot:{hp:2, sp:3.3, r:.7, pts:20, dash:1}, gym:{hp:4, sp:2.4, r:.9, pts:40}, boss:{hp:22, sp:2, r:1.9, pts:300, dash:1, boss:1}};
const GEAR = {rng:"Lốp to", cd:"Găng tay", dmg:"Lốp độn chì", max:"Áo giáp", dcd:"Giày lướt", spd:"Băng đô", crit:"Kính râm", jk:"Áo khoác", sh:"Khiên", form:"Lốp tiến hóa"};
const PERKS = [
  {k:"rng", d:"Tầm đánh +20%. Lốp to ra.", f:()=>P.rng*=1.2}, {k:"cd", d:"Vung nhanh hơn. Đổi găng tay.", f:()=>P.cd*=0.8},
  {k:"dmg", d:"Sát thương +1. Lốp có đinh, mâm vàng, lửa.", f:()=>P.dmg++}, {k:"max", d:"+1 tim, hồi 1 tim. Giáp vai, áo choàng.", f:()=>{P.max++; P.hp=Math.min(P.max,P.hp+1);}},
  {k:"dcd", d:"Lướt hồi nhanh hơn. Giày đổi màu, có cánh.", f:()=>P.dcd*=0.7}, {k:"spd", d:"Chạy nhanh +12%. Băng đô bay phấp phới.", f:()=>P.spd*=1.12},
  {k:"crit", d:"Chí mạng +12% (đòn x2). Đeo kính râm.", f:()=>P.crit+=.12}, {k:"jk", d:"Bất tử lâu hơn sau khi bị đánh. Khoác áo ngoài.", f:()=>P.invT+=.4},
  {k:"sh", d:"Khiên chặn 1 đòn mỗi đợt.", f:()=>{P.shMax++; P.shield=P.shMax;}}, {k:"form", d:"Quét rộng hơn, đẩy lùi mạnh. Lốp đổi hình.", f:()=>{}}
];
const NAMES = ["Bạn thân của crush", "Hot boy trường bên", "Hội tập gym", "Đồng nghiệp của crush", "Anh khóa trên", "Fan nhắn tin 24/7"];
const keys = {}, ndc = new THREE.Vector2(), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitPt = new THREE.Vector3();
let touchMode = false, target = null, P, E = [], FX = [], PT = [], wave, score, combo, comboT, left, spawnT, bossQ, bannerT = 0, state = "idle", last = 0, freeze = 0, shake = 0, hurtT = 0, clock = 0;
let best = +localStorage.getItem("chefBest") || 0;
const playerMesh = buildPlayer();

let AC;
function snd(f, d = .08, type = "square", v = .04, slide = 0) {
  try { AC = AC || new AudioContext(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(t + d); } catch {}
}
const pGeo = BX(.2, .2, .2), pMats = {};
function burst(x, z, col, n, sp = 7) {
  const m = pMats[col] = pMats[col] || new THREE.MeshBasicMaterial({color:col});
  for (let i = 0; i < n && PT.length < 220; i++) { const a = Math.random() * 6.28, v = sp * (.3 + Math.random()), mesh = new THREE.Mesh(pGeo, m); mesh.position.set(x, 1.2, z); scene.add(mesh);
    PT.push({mesh, vx:Math.cos(a) * v, vz:Math.sin(a) * v, vy:3 + Math.random() * 5, t:.4 + Math.random() * .4}); }
}
function floatText(x, y, z, txt, col) { const el = document.createElement("div"); el.className = "ft"; el.textContent = txt; el.style.color = col; box.parentElement.append(el); FX.push({el, p:new THREE.Vector3(x, y, z), t:.9}); }

function reset() {
  P = {x:0, z:0, hp:5, max:5, spd:8.75, rng:4, cd:.34, dmg:1, dcd:1, inv:0, atk:0, swing:0, sw:.2, sa:0, aim:0, face:0, dash:0, dashCd:0, dx:1, dz:0, t:0, mv:false, hit:true,
       crit:0, invT:1, shMax:0, shield:0, lv:{rng:0, cd:0, dmg:0, max:0, dcd:0, spd:0, crit:0, jk:0, sh:0, form:0}};
  E.forEach(e => scene.remove(e.mesh)); PT.forEach(p => scene.remove(p.mesh)); FX.forEach(f => f.el.remove());
  E = []; FX = []; PT = []; wave = 0; score = 0; combo = 0; comboT = 0; nextWave(); updateGear();
}
function nextWave() {
  wave++; P.shield = P.shMax; left = Math.min(24, 3 + wave * 2); spawnT = .6; bossQ = wave % 5 === 0;
  const b = $("banner"); b.textContent = bossQ ? "Đại gia siêu xe xuất hiện!" : NAMES[(wave - 1) % NAMES.length]; bannerT = 1.8; snd(300, .25, "triangle", .06, 300);
}
function spawn() {
  let t = "nhan"; if (bossQ) { t = "boss"; bossQ = false; } else { const r = Math.random(); t = wave >= 3 && r < .25 ? "gym" : wave >= 2 && r < .6 ? "hot" : "nhan"; }
  const a = Math.random(), p = [[a * 30 - 15, -12.5], [17, a * 20 - 10], [a * 30 - 15, 12.5], [-17, a * 20 - 10]][Math.floor(Math.random() * 4)];
  const hp = TYPES[t].hp + (t === "boss" ? wave * 2 : 0), mats = [], mesh = buildFoe(t, mats); scene.add(mesh);
  E.push({...TYPES[t], t, hp, mhp:hp, x:p[0], z:p[1], h:0, w:Math.random() * 6, dashT:1 + Math.random() * 2, boost:0, mesh, mats}); if (t !== "boss") left--;
}
function start() { reset(); state = "run"; $("overlay").hidden = true; $("saveForm").hidden = true; $("perks").hidden = true; snd(440, .15, "triangle", .05, 400); }
function inputDir() {
  let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), z = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (!x && !z && target) { const dx = target.x - P.x, dz = target.z - P.z, d = Math.hypot(dx, dz); if (d > .5) { x = dx / d; z = dz / d; } }
  const m = Math.hypot(x, z); return m ? {x:x / m, z:z / m} : {x:0, z:0};
}
function nearest() { let b = null, bd = 1e9; for (const e of E) { const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < bd) { bd = d; b = e; } } return b; }
function worldPt(v2) { ray.setFromCamera(v2, cam); return ray.ray.intersectPlane(plane, hitPt) ? hitPt.clone() : null; }
function aimAngle() {
  const n = nearest(); if (touchMode && n) return Math.atan2(n.z - P.z, n.x - P.x);
  const w = worldPt(ndc); return w ? Math.atan2(w.z - P.z, w.x - P.x) : P.aim;
}
function attack() {
  if (state !== "run" || P.atk > 0) return;
  P.atk = P.cd; P.sw = Math.min(.2, P.cd * .7); P.swing = P.sw; P.sa = aimAngle(); P.hit = false; snd(220, .09, "sawtooth", .03, -120);
  const W = 1.3 + .2 * P.lv.form; R.trail.geometry.dispose(); R.trail.geometry = new THREE.RingGeometry(1, P.rng * .95, 28, 1, -P.sa - W, 2 * W);
}
function doHit() {
  const W = 1.3 + .2 * P.lv.form;
  for (const e of E) {
    const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz) || 1; let da = Math.abs(Math.atan2(dz, dx) - P.sa); if (da > Math.PI) da = 6.283 - da;
    if (d < P.rng + e.r && da < W) {
      const crit = Math.random() < P.crit, dmg = P.dmg * (crit ? 2 : 1); e.hp -= dmg; e.h = .12; const kb = e.boss ? .5 : 1.9 + .5 * P.lv.form; e.x += dx / d * kb; e.z += dz / d * kb;
      burst(e.x, e.z, ecol(e), 8); floatText(e.x, 3 * e.mesh.scale.x, e.z, (crit ? "CHÍ MẠNG -" : "-") + dmg, crit ? "#ffd25e" : "#fff");
      freeze = Math.max(freeze, .05); shake = Math.max(shake, 4); snd(140, .1, "square", .06, -60); if (e.hp <= 0) kill(e);
    }
  }
  E = E.filter(e => { if (e.hp <= 0) { scene.remove(e.mesh); return false; } return true; });
}
function ecol(e) { return {nhan:0x4a90d9, hot:0x555566, gym:0xe8453c, boss:0xffd25e}[e.t]; }
function kill(e) {
  combo++; comboT = 2; const gain = e.pts * (1 + Math.floor(combo / 3)); score += gain;
  burst(e.x, e.z, ecol(e), e.boss ? 50 : 20, e.boss ? 13 : 8); floatText(e.x, 3.4 * e.mesh.scale.x, e.z, "+" + gain, "#ffb0a8");
  shake = Math.max(shake, e.boss ? 14 : 6); freeze = e.boss ? .15 : .07; snd(520 + combo * 25, .14, "triangle", .06, 300);
}
function dash() {
  if (state !== "run" || P.dashCd > 0) return; const d = inputDir(); if (d.x || d.z) { P.dx = d.x; P.dz = d.z; }
  P.dash = .16; P.dashCd = P.dcd; P.inv = Math.max(P.inv, .3); snd(180, .15, "sine", .06, 500);
}
function update(dt) {
  clock += dt; P.aim = aimAngle(); const d = inputDir(); if (d.x || d.z) { P.dx = d.x; P.dz = d.z; }
  P.mv = !!(d.x || d.z) || P.dash > 0; P.t += P.mv ? dt : dt * .2;
  const sp = P.dash > 0 ? 26 : P.spd, mv = P.dash > 0 ? {x:P.dx, z:P.dz} : d;
  P.x = clamp(P.x + mv.x * sp * dt, -15.3, 15.3); P.z = clamp(P.z + mv.z * sp * dt, -10.3, 10.3);
  if (P.dash > 0) burst(P.x, P.z, P.lv.dcd >= 3 ? 0xff9a30 : 0xe9dcc2, 2, 3);
  for (const k of ["inv", "atk", "swing", "dash", "dashCd"]) P[k] = Math.max(0, P[k] - dt);
  if (P.swing > 0 && P.lv.form >= 3) burst(P.x + Math.cos(P.sa) * 3, P.z + Math.sin(P.sa) * 3, 0xffb03a, 1, 4);
  if (P.swing > 0 && !P.hit && 1 - P.swing / P.sw >= .35) { P.hit = true; doHit(); }
  comboT -= dt; if (comboT <= 0) combo = 0;
  if ((left > 0 || bossQ) && (spawnT -= dt) <= 0) { spawn(); spawnT = Math.max(.35, .9 - wave * .05); }
  for (const e of E) {
    e.h = Math.max(0, e.h - dt); e.w += dt * 9;
    if (e.dash && (e.dashT -= dt) <= 0) { e.boost = .4; e.dashT = (e.boss ? 3 : 2) + Math.random() * 1.5; snd(120, .2, "sawtooth", .03, 200); }
    e.boost = Math.max(0, e.boost - dt);
    const dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz) || 1, s = e.sp * (e.boost > 0 ? 4 : 1) * (1 + wave * .03);
    e.x += dx / dist * s * dt; e.z += dz / dist * s * dt;
    if (dist < e.r + .65 && P.inv <= 0 && P.dash <= 0) {
      P.inv = P.invT;
      if (P.shield > 0) { P.shield--; shake = 6; snd(320, .15, "square", .06, -120); burst(P.x, P.z, 0xc7ccd6, 14); floatText(P.x, 4, P.z, "Chặn!", "#7fd6c2"); }
      else { P.hp--; combo = 0; hurtT = .4; shake = 10; freeze = .08; snd(90, .25, "sawtooth", .08, -40); burst(P.x, P.z, 0xe8453c, 14); }
      P.x = clamp(P.x - dx / dist * 2.2, -15.3, 15.3); P.z = clamp(P.z - dz / dist * 2.2, -10.3, 10.3); if (P.hp <= 0) return over();
    }
  }
  PT.forEach(p => { p.t -= dt; p.mesh.position.x += p.vx * dt; p.mesh.position.z += p.vz * dt; p.vy -= 18 * dt; p.mesh.position.y = Math.max(.1, p.mesh.position.y + p.vy * dt); if (p.t <= 0) scene.remove(p.mesh); });
  PT = PT.filter(p => p.t > 0); FX.forEach(f => { f.t -= dt; f.p.y += 1.5 * dt; if (f.t <= 0) f.el.remove(); }); FX = FX.filter(f => f.t > 0);
  bannerT -= dt; hurtT = Math.max(0, hurtT - dt);
  if (left === 0 && !bossQ && E.length === 0) { state = "perk"; showPerks(); }
}
function applyGear() {
  const L = P.lv; PM.shoe.color.set([0xffffff, 0xe8453c, 0xffd25e, 0xffd25e][L.dcd]); R.wings.forEach(w => w.visible = L.dcd >= 2);
  PM.glove.color.set([0xf1c9a0, 0xe8453c, 0xc92b2b, 0xffd25e][L.cd]); R.hand.scale.setScalar(1 + L.cd * .2);
  R.tireG.scale.setScalar((.9 + (P.rng - 4) / 10) * [1, 1.18, 1.18, 1.4][L.form]); R.tire2.visible = L.form >= 2;
  R.rimM.color.set(L.dmg >= 2 ? 0xffd25e : L.form >= 3 ? 0xe8453c : 0xa3a9b5); R.studs.visible = R.studs2.visible = L.dmg >= 1; R.aura.visible = R.aura2.visible = L.dmg >= 3;
  R.pads.forEach(p => { p.visible = L.max >= 1; p.material.color.set(L.max >= 3 ? 0xffd25e : 0x9aa3b5); }); R.cape.visible = L.max >= 2; R.badge.visible = L.max >= 3;
  PM.band.color.set(L.spd >= 3 ? 0xffd25e : 0xe8453c); R.band.visible = L.spd >= 1; R.tails.visible = L.spd >= 2;
  R.glasses.visible = L.crit >= 1; PM.glass.color.set(L.crit >= 2 ? 0x3b2a66 : 0x111111); PM.glass.emissive.set(L.crit >= 3 ? 0x6a5010 : 0);
  R.jk.visible = L.jk >= 1; PM.jk.color.set(L.jk >= 2 ? 0x1f1f26 : 0x4a78b8); R.shield.visible = L.sh >= 1; PM.sh.color.set([0xa8774a, 0xa8774a, 0xaab3c2, 0xffd25e][L.sh]);
}
function updateGear() {
  const parts = Object.keys(GEAR).filter(k => P.lv[k]).map(k => `${GEAR[k]} Lv${P.lv[k]}`);
  $("gear").textContent = parts.length ? "Trang bị: " + parts.join(" • ") : "Trang bị: chưa có. Hạ gục tình địch để nhận bí kíp."; applyGear();
}
function showPerks() {
  const bx = $("perkList"); bx.replaceChildren();
  PERKS.filter(p => P.lv[p.k] < 3).sort(() => Math.random() - .5).slice(0, 3).forEach(p => {
    const b = document.createElement("button"), t = document.createElement("b"), s = document.createElement("small");
    t.textContent = `${GEAR[p.k]} Lv${P.lv[p.k]} → Lv${P.lv[p.k] + 1}`; s.textContent = p.d; b.append(t, s);
    b.onclick = () => { p.f(); P.lv[p.k]++; updateGear(); $("perks").hidden = true; state = "run"; nextWave(); snd(660, .15, "triangle", .06, 300); }; bx.append(b);
  });
  $("perks").hidden = false; snd(500, .2, "triangle", .05, 400);
}
function title(s) { return s < 200 ? "Người dưng" : s < 600 ? "Bạn thân" : s < 1500 ? "Người đặc biệt" : s < 3000 ? "Crush đã gật đầu" : "Có danh phận chính thức"; }
function over() {
  state = "over"; const nb = score > best; if (nb) { best = score; localStorage.setItem("chefBest", best); }
  $("msg").textContent = `Danh phận: ${title(score)}. Gục ở đợt ${wave} với ${score} điểm.` + (nb ? " Kỷ lục mới!" : ` Kỷ lục máy: ${best}, thử vượt nhé.`);
  $("saveForm").hidden = score === 0; $("startBtn").textContent = "Đấu lại"; $("overlay").hidden = false;
}

// ---------- Cập nhật hình ảnh 3D ----------
let faceA = 0;
function syncVisuals(dt) {
  const L = P.lv, bob = P.mv ? Math.sin(P.t * 16) * .07 : Math.sin(P.t * 3) * .03, lg = P.mv ? Math.sin(P.t * 16) * .7 : 0;
  playerMesh.position.set(P.x, 0, P.z); playerMesh.visible = !(P.inv > 0 && Math.floor(P.inv * 14) % 2);
  let dA = P.aim - faceA; dA = Math.atan2(Math.sin(dA), Math.cos(dA)); faceA += dA * Math.min(1, dt * 14);
  R.body.rotation.y = Math.PI / 2 - faceA; R.body.position.y = bob; R.legs[0].rotation.x = lg; R.legs[1].rotation.x = -lg;
  let a = P.aim; if (P.swing > 0) { const p = 1 - P.swing / P.sw, W = 1.3 + .2 * L.form; a = P.sa - W + 2 * W * (p * p * (3 - 2 * p)); R.tireSpin.rotation.z += dt * 30; R.trail.visible = true; R.trail.position.set(P.x, .15, P.z); } else R.trail.visible = false;
  R.weapon.rotation.y = Math.PI / 2 - a; R.cape.rotation.x = .15 + Math.sin(P.t * 10) * .1; R.tails.rotation.y = Math.sin(P.t * 12) * .25;
  PM.sh.opacity = P.shield > 0 ? 1 : .3; R.trail.material.color.set(L.dmg >= 3 ? 0xffa030 : 0xffffff);
  for (const e of E) {
    const dx = P.x - e.x, dz = P.z - e.z; e.mesh.position.set(e.x, Math.abs(Math.sin(e.w)) * .14, e.z); e.mesh.rotation.y = Math.atan2(dx, dz);
    e.mesh.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(e.w * 1.2) * (i ? -.6 : .6)); const hot = e.h > 0 ? 0xffffff : e.boost > 0 ? 0xff5a00 : 0;
    e.mats.forEach(m => { m.emissive.set(hot); m.emissiveIntensity = .7; });
  }
  FX.forEach(f => { const v = f.p.clone().project(cam); f.el.style.left = (v.x * .5 + .5) * 100 + "%"; f.el.style.top = (-v.y * .5 + .5) * 100 + "%"; f.el.style.opacity = Math.min(1, f.t * 2); });
  const bs = E.find(e => e.boss); $("bossbar").hidden = !bs; if (bs) $("bossbar").firstElementChild.style.width = Math.max(0, bs.hp / bs.mhp * 100) + "%";
  $("banner").style.opacity = bannerT > 0 && state === "run" ? Math.min(1, bannerT) : 0; $("hurt").style.opacity = hurtT * 1.6;
  $("hp").textContent = "❤️".repeat(Math.max(0, P.hp)) + "🖤".repeat(P.max - Math.max(0, P.hp)) + "🛡️".repeat(P.shield); $("wave").textContent = wave; $("score").textContent = score;
  $("combo").textContent = combo >= 2 ? `Combo x${1 + Math.floor(combo / 3)} (${combo})` : "";
}
function frame(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  if (state === "run") { if (freeze > 0) freeze -= dt; else update(dt); }
  shake = Math.max(0, shake - dt * 40); syncVisuals(dt);
  const tx = P.x * .55, tz = P.z * .55; cam.position.set(tx + (Math.random() - .5) * shake * .04, 17 + (Math.random() - .5) * shake * .04, tz + 14); cam.lookAt(tx, 0, tz - 1);
  renderer.render(scene, cam); requestAnimationFrame(frame);
}

// ---------- Điều khiển ----------
addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return; const k = e.key.toLowerCase();
  if (k === "enter" && (state === "idle" || state === "over")) return start(); if (state !== "run") return;
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  if (k === "j" || k === " ") attack(); else if (k === "k" || k === "shift") dash(); else keys[k] = true;
});
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
const setNdc = e => { const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
box.addEventListener("mousemove", e => { touchMode = false; setNdc(e); });
box.addEventListener("mousedown", e => { touchMode = false; setNdc(e); attack(); });
box.addEventListener("touchstart", e => { touchMode = true; setNdc(e.touches[0]); target = worldPt(ndc); }, {passive:true});
box.addEventListener("touchmove", e => { setNdc(e.touches[0]); target = worldPt(ndc); }, {passive:true});
box.addEventListener("touchend", () => { target = null; });
$("atkBtn").addEventListener("pointerdown", e => { e.preventDefault(); touchMode = e.pointerType === "touch"; attack(); });
$("dashBtn").addEventListener("pointerdown", e => { e.preventDefault(); dash(); });
$("startBtn").onclick = start;

// ---------- Bảng xếp hạng ----------
async function loadBoard() {
  let rows = [];
  try {
    if (cloud) { const snap = await getDocs(query(collection(db, COL), orderBy("score", "desc"), limit(5))); rows = snap.docs.map(d => d.data()); $("status").textContent = "Dữ liệu từ Firebase Firestore."; }
    else { rows = JSON.parse(localStorage.getItem("chefRows") || "[]"); $("status").textContent = "Chưa nối Firebase: đang lưu tạm trên máy."; }
  } catch (err) { $("status").textContent = "Không tải được bảng xếp hạng: " + err.code; }
  const ol = $("list"); ol.replaceChildren();
  if (!rows.length) ol.append(Object.assign(document.createElement("li"), {textContent:"Chưa có ai có danh phận. Hãy là người đầu tiên!"}));
  rows.forEach(r => { const li = document.createElement("li"), sp = document.createElement("span"); li.textContent = r.name; sp.textContent = r.score; li.append(sp); ol.append(li); });
}
$("saveForm").addEventListener("submit", async e => {
  e.preventDefault(); const name = $("name").value.trim().slice(0, 12); if (!name) return; $("saveForm").hidden = true;
  try {
    if (cloud) await addDoc(collection(db, COL), {name, score, createdAt:serverTimestamp()});
    else { const r = JSON.parse(localStorage.getItem("chefRows") || "[]"); r.push({name, score}); r.sort((a, b) => b.score - a.score); localStorage.setItem("chefRows", JSON.stringify(r.slice(0, 5))); }
  } catch (err) { $("status").textContent = "Lưu thất bại: " + err.code; }
  loadBoard();
});

reset(); state = "idle"; bannerT = 0; loadBoard(); requestAnimationFrame(frame);
