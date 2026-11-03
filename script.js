import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
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
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
box.append(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xbfe3f2); scene.fog = new THREE.Fog(0xdcefe6, 45, 95);
const cam = new THREE.PerspectiveCamera(42, 1.5, .1, 100);
let composer = null, bloom = null;
function resize() { const w = box.clientWidth, h = box.clientHeight; renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); } }
new ResizeObserver(resize).observe(box); resize();
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.add(new THREE.HemisphereLight(0xffffff, 0x7a6a8a, .6));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.4); sun.position.set(8, 18, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-22, right:22, top:16, bottom:-16, near:1, far:50}); sun.shadow.bias = -.0004; scene.add(sun, sun.target); const fill = new THREE.DirectionalLight(0x9fc4ff, .7); fill.position.set(-8, 10, -6); scene.add(fill);
function noiseCanvas(size, amount, seed = 1) {
  const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d"); const d = x.createImageData(size, size);
  let r = seed; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() - .5) * amount; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const BUMP_ASPHALT = noiseCanvas(256, 90, 7), BUMP_CONCRETE = noiseCanvas(256, 60, 11), BUMP_METAL = noiseCanvas(128, 40, 3);
const M = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({color:c, roughness:r, metalness:m});
const SP = (r, w = 18, h = 12) => new THREE.SphereGeometry(r, w, h), CY = (a, b, h, s = 18) => new THREE.CylinderGeometry(a, b, h, s), BX = (a, b, c) => new THREE.BoxGeometry(a, b, c);
function mk(geo, mat, x = 0, y = 0, z = 0, p) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; if (p) p.add(m); return m; }
// ---------- Thế giới 3D (bản đồ rộng 60 x 44) ----------
const MAXX = 29, MAXZ = 21, OBS = [];
const OUT = new THREE.MeshBasicMaterial({color:0x1b1228, side:THREE.BackSide});
function outline(g, k = .055) {
  const all = []; g.traverse(m => all.push(m));
  all.forEach(m => {
    if (!m.isMesh || !m.castShadow) return; m.geometry.computeBoundingSphere(); m.geometry.computeBoundingBox();
    const sz = new THREE.Vector3(); m.geometry.boundingBox.getSize(sz); if (Math.min(sz.x, sz.y, sz.z) < .12) return;
    const o = new THREE.Mesh(m.geometry, OUT); o.scale.setScalar(1 + k / m.geometry.boundingSphere.radius); o.castShadow = false; m.add(o);
  });
}
function pushOut(o, rad) { for (const c of OBS) { const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), m = c.r + rad; if (d < m && d > 1e-4) { o.x = c.x + dx / d * m; o.z = c.z + dz / d * m; } } }
{ const c = document.createElement("canvas"); c.width = 2; c.height = 256; const x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#6fb6e8"); g.addColorStop(.6, "#bfe3f2"); g.addColorStop(1, "#f4f9e8"); x.fillStyle = g; x.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
const groundTex = (() => {
  const W = 1024, H = 768, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  const px = u => (u + 32) / 64 * W, pz = v => (v + 24) / 48 * H, rect = (a, b, c2, d, col) => { x.fillStyle = col; x.fillRect(px(a), pz(b), px(c2) - px(a), pz(d) - pz(b)); };
  rect(-32, -24, 32, 24, "#7cc576");
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${60 + Math.random() * 40 | 0},${150 + Math.random() * 50 | 0},80,.18)`; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 3 + Math.random() * 10, 0, 7); x.fill(); }
  rect(-27, -20, 27, 20, "#c9c2b4"); rect(-26, -19, 26, 19, "#4b4f5c"); rect(-20.5, -14.5, 20.5, 14.5, "#c9c2b4");
  for (let i = -20; i < 20; i++) for (let j = -14; j < 14; j++) rect(i, j, i + 1, j + 1, (i + j) & 1 ? "#fff2cf" : "#f0d595");
  x.strokeStyle = "#fff"; x.lineWidth = 3; x.setLineDash([14, 14]); x.beginPath();
  [-16.75, 16.75].forEach(z => { x.moveTo(px(-26), pz(z)); x.lineTo(px(26), pz(z)); }); [-23.25, 23.25].forEach(u => { x.moveTo(px(u), pz(-19)); x.lineTo(px(u), pz(19)); }); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
})();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(64, 48), M(0xffffff, .8)); ground.material.map = groundTex; ground.material.bumpMap = BUMP_CONCRETE; ground.material.bumpScale = .6; ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const outer = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M(0x7cc576, 1)); outer.rotation.x = -Math.PI / 2; outer.position.y = -.02; outer.receiveShadow = true; scene.add(outer);
[[0, -22, 61, .5], [0, 22, 61, .5], [-30, 0, .5, 45], [30, 0, .5, 45]].forEach(([x, z, w, d]) => { const b = mk(BX(w, .9, d), M(0xf6efe0, .7), x, .45, z, scene); b.receiveShadow = true; });
const leafM = [M(0x4caf50, .8), M(0x66bb6a, .8)], trunkM = M(0x8a5a3a, .9);
function tree(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); mk(CY(.18 * s, .26 * s, 1.5 * s, 8), trunkM, 0, .75 * s, 0, g); mk(SP(1.05 * s, 14, 10), leafM[0], 0, 2.1 * s, 0, g); mk(SP(.78 * s, 14, 10), leafM[1], .2 * s, 3 * s, .1 * s, g); scene.add(g); OBS.push({x, z, r:.6 * s}); }
for (let x = -28; x <= 28; x += 4.5) { tree(x + Math.sin(x * 7) * .6, -20.8); tree(x + Math.cos(x * 5) * .6, 20.8, .9 + Math.abs(x % 3) * .05); }
for (let z = -16; z <= 16; z += 5) { tree(-28, z + Math.sin(z) * .5); tree(28, z + Math.cos(z) * .5); }
const lampM = M(0x3a3a4a, .5, .6), bulbM = new THREE.MeshBasicMaterial({color:0xffe9a0});
[[-19.5, -13.5], [19.5, -13.5], [-19.5, 13.5], [19.5, 13.5], [0, -13.5], [0, 13.5], [-19.5, 0], [19.5, 0]].forEach(([x, z]) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); mk(CY(.1, .14, 4.4, 10), lampM, 0, 2.2, 0, g); mk(SP(.32, 12, 8), bulbM, 0, 4.5, 0, g).castShadow = false; scene.add(g); OBS.push({x, z, r:.35}); });
function car(x, z, rot, col) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; mk(BX(2.2, .75, 4.3), M(col, .35, .4), 0, .65, 0, g); mk(BX(1.85, .65, 2.3), M(0x9fd4ee, .15, .3), 0, 1.35, -.2, g);
  [[-1, -1.4], [1, -1.4], [-1, 1.4], [1, 1.4]].forEach(([sx, sz]) => { mk(CY(.45, .45, .34, 14), M(0x1b1b22, .9), sx * 1.1, .45, sz, g).rotation.z = Math.PI / 2; });
  scene.add(g); [-1.4, 0, 1.4].forEach(o => OBS.push({x:x + Math.sin(rot) * o, z:z + Math.cos(rot) * o, r:1.05 }));
}
[[24.6, -6, 0, 0xe8453c], [-24.6, 8, 0, 0x4a90d9], [24.6, 10, 0, 0xffd25e], [-24.6, -9, 0, 0x7fd6c2], [-8, 17.8, Math.PI / 2, 0xb57bd8], [10, -17.8, Math.PI / 2, 0xff8a1f], [-12, -17.8, Math.PI / 2, 0xffffff], [14, 17.8, Math.PI / 2, 0x2b1b3d]].forEach(a => car(...a));
{ const g = new THREE.Group(), st = M(0xd9d4c7, .6); g.position.set(0, 0, -2); mk(CY(2.8, 3, .7, 28), st, 0, .35, 0, g);
  mk(CY(2.45, 2.45, .1, 28), new THREE.MeshStandardMaterial({color:0x5bc0eb, roughness:.1, metalness:.2, emissive:0x2a7fb0, emissiveIntensity:.35}), 0, .72, 0, g);
  mk(CY(.35, .5, 2.3, 12), st, 0, 1.5, 0, g); mk(SP(.55, 14, 10), st, 0, 2.8, 0, g); scene.add(g); OBS.push({x:0, z:-2, r:3}); }
function winTex(bg) { const c = document.createElement("canvas"); c.width = 64; c.height = 128; const x = c.getContext("2d"); x.fillStyle = bg; x.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { x.fillStyle = Math.random() < .35 ? "#ffe08a" : "#7fb2d6"; x.fillRect(6 + i * 15, 6 + j * 15, 9, 9); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const bTex = ["#e8a29a", "#9ac7e8", "#f2d78a", "#b9a6e0", "#a6dcb8"].map(winTex);
function building(x, z, w, h, d, i) { const b = mk(BX(w, h, d), new THREE.MeshStandardMaterial({map:bTex[Math.abs(i) % 5], roughness:.8, bumpMap:BUMP_CONCRETE, bumpScale:1.2}), x, h / 2, z, scene); b.receiveShadow = true; mk(BX(w + .4, .5, d + .4), M(0x3a3a4a), x, h + .25, z, scene); }
for (let x = -40; x <= 40; x += 9) building(x, -34 - Math.abs(x) % 3, 8, 9 + Math.abs(x * 3) % 7, 7, x / 9 | 0);
for (let z = -26; z <= 26; z += 9) { building(-38, z, 7, 8 + Math.abs(z * 2) % 6, 8, (z / 9 | 0) + 7); building(38, z, 7, 8 + Math.abs(z * 5) % 6, 8, (z / 9 | 0) + 9); }
const miniC = $("mini"), mx = miniC.getContext("2d");
function drawMini() {
  const W = 120, H = 88, X = x => (x + 32) / 64 * W, Z = z => (z + 24) / 48 * H; mx.clearRect(0, 0, W, H);
  mx.fillStyle = "rgba(43,27,61,.35)"; mx.fillRect(X(-26), Z(-19), X(26) - X(-26), Z(19) - Z(-19)); mx.fillStyle = "rgba(255,242,207,.8)"; mx.fillRect(X(-20.5), Z(-14.5), X(20.5) - X(-20.5), Z(14.5) - Z(-14.5));
  mx.fillStyle = "rgba(43,27,61,.45)"; OBS.forEach(o => mx.fillRect(X(o.x) - 1, Z(o.z) - 1, 2, 2));
  if (!P) return; E.forEach(e => { mx.fillStyle = e.boss ? "#ffd25e" : "#e8453c"; mx.beginPath(); mx.arc(X(e.x), Z(e.z), e.boss ? 4 : 2.2, 0, 7); mx.fill(); });
  mx.fillStyle = "#fff"; mx.strokeStyle = "#2b1b3d"; mx.lineWidth = 1.5; mx.beginPath(); mx.arc(X(P.x), Z(P.z), 3.4, 0, 7); mx.fill(); mx.stroke();
}

// ---------- Nhân vật 3D ----------
const R = {}, PM = {shoe:M(0xffffff, .5), glove:M(0xf1c9a0, .6), pad:M(0x9aa3b5, .35, .7), band:M(0xe8453c, .6), glass:M(0x111111, .15, .5),
  jk:M(0x4a78b8, .7), sh:Object.assign(M(0xa8774a, .45, .35), {transparent:true}), rim:M(0xa3a9b5, .3, .9)};
function buildPlayer(cfg) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const skin = M(0xf1c9a0, .55), cream = M(cfg.shirt, .85), jeans = M(0x2f3b57, .8), hairM = M(cfg.hair, .35), blk = M(0x16161b, .3, .3);
  R.legs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .3, 1, 0); body.add(g); mk(CY(.26, .24, .9), jeans, 0, -.45, 0, g); mk(BX(.5, .28, .85), PM.shoe, 0, -.95, .12, g); return g; });
  R.wings = [-1, 1].map(s => { const w = mk(BX(.7, .04, .45), M(0xffffff, .5), s * .55, -.8, -.1, R.legs[s < 0 ? 0 : 1]); w.rotation.z = s * .5; return w; });
  mk(new THREE.CapsuleGeometry(.6, .7,6,14), cream, 0, 1.85, 0, body).scale.set(1, 1, .78);
  R.arms = [-1, 1].map(s => { const a = mk(new THREE.CapsuleGeometry(.14, .55, 4, 10), cream, s * .78, 1.75, 0, body); a.rotation.z = s * .12; mk(SP(.16, 12, 8), skin, s * .8, 1.15, .05, body); return a; });
  const lc = document.createElement("canvas"); lc.width = lc.height = 64; const lx = lc.getContext("2d");
  lx.fillStyle = "#2b1b3d"; lx.fillRect(0, 0, 64, 64); lx.fillStyle = "#fff"; lx.font = "800 46px sans-serif"; lx.textAlign = "center"; lx.fillText(cfg.letter, 32, 50);
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace; mk(new THREE.PlaneGeometry(.5, .5), new THREE.MeshStandardMaterial({map:lt, roughness:.8}), 0, 1.95, .49, body);
  R.jk = new THREE.Group(); body.add(R.jk); [-1, 1].forEach(s => mk(BX(.32, 1.2, 1), PM.jk, s * .5, 1.8, .03, R.jk));
  R.pads = [-1, 1].map(s => mk(SP(.32), PM.pad.clone(), s * .72, 2.45, 0, body));
  R.cape = mk(BX(1.1, 1.5, .06), M(0xe8453c, .7), 0, 1.9, -.55, body); R.badge = mk(SP(.1), M(0xe8453c), .3, 1.7, .5, body);
  mk(SP(.55, 28, 18), skin, 0, 2.95, 0, body); [-1, 1].forEach(s => { mk(SP(.07, 10, 8), blk, s * .2, 2.93, .5, body); mk(SP(.13, 10, 8), skin, s * .55, 2.93, 0, body); const b = mk(BX(.2, .04, .04), blk, s * .2, 3.1, .5, body); b.rotation.z = s * .12; });
  mk(SP(.06, 8, 8), skin, 0, 2.85, .56, body);
  mk(new THREE.SphereGeometry(.6, 24, 14, 0, Math.PI * 2, 0, Math.PI * .52), hairM, 0, 3, -.03, body); const fr = mk(BX(.95, .13, .3), hairM, 0, 3.3, .42, body); fr.rotation.x = .35; if (cfg.pony) { mk(SP(.3, 12, 10), hairM, 0, 2.75, -.68, body); mk(SP(.2, 10, 8), hairM, 0, 2.3, -.8, body); }
  mk(new THREE.TorusGeometry(.62, .09, 10, 28), blk, 0, 2.38, 0, body).rotation.x = Math.PI / 2;
  [-1, 1].forEach(s => mk(CY(.22, .22, .18), blk, s * .68, 2.38, 0, body).rotation.z = Math.PI / 2);
  R.glasses = mk(BX(.8, .2, .1), PM.glass, 0, 2.95, .53, body);
  R.band = mk(new THREE.TorusGeometry(.57, .05, 8, 24), PM.band, 0, 3.15, 0, body); R.band.rotation.x = Math.PI / 2;
  R.tails = new THREE.Group(); body.add(R.tails); [-1, 1].forEach(s => mk(BX(.12, .04, .8), PM.band, s * .12, 3.15, -.85, R.tails));
  [-1, 1].forEach(s => mk(BX(.2, .05, .05), hairM, s * .2, 2.62, .5, body).rotation.z = s * -.15);
  mk(BX(.26, .05, .05), M(0xb5584f, .5), 0, 2.66, .55, body);
  if (cfg.beard) mk(BX(.5, .26, .22), hairM, 0, 2.5, .5, body);
  if (cfg.bun) mk(SP(.26, 14, 10), hairM, 0, 3.35, -.22, body);
  if (cfg.cap) { mk(new THREE.SphereGeometry(.64, 18, 10, 0, Math.PI * 2, 0, Math.PI * .5), M(cfg.cap, .6), 0, 3.0, -.02, body); mk(BX(.72, .04, .42), M(cfg.cap, .6), 0, 3.02, .46, body); }
  R.shield = mk(CY(.7, .7, .12, 22), PM.sh, -.98, 1.7, .3, body); R.shield.rotation.z = Math.PI / 2;
  mk(CY(.15, .13, 1.1), cream, .8 * -1, 1.7, .15, body).rotation.x = .3;
  R.body = body; if (cfg.big) root.scale.setScalar(1.18);
  const w = R.weapon = new THREE.Group(); w.position.y = 2.1; root.add(w);
  R.held = null; R.hand = mk(SP(.25), PM.glove, 0, 0, 1.75, w);
  outline(root, .022); scene.add(root); return root;
}
// ---------- Dữ liệu và cấu hình (kiểu Survivor) ----------
const fmt = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
const SV0 = {coins:0, chars:["lop"], sel:"lop", up:{hp:0, dmg:0, spd:0, mag:0, xp:0, rev:0}, best:0, gift:"", mis:{day:"", k:0, t:0, b:0, c:[0, 0, 0]}};
const SV = Object.assign({}, SV0, JSON.parse(localStorage.getItem("lopSave") || "{}")); SV.up = Object.assign({}, SV0.up, SV.up); SV.mis = Object.assign({}, SV0.mis, SV.mis);
const save = () => localStorage.setItem("lopSave", JSON.stringify(SV)), today = () => new Date().toISOString().slice(0, 10);
if (SV.mis.day !== today()) SV.mis = {day:today(), k:0, t:0, b:0, c:[0, 0, 0]};
const CH = {
  lop:{n:"Lốp Trưởng", d:"Chàng trai yêu đơn phương. Khởi đầu: Lốp xoay.", w:"orbit", hair:0x1c1a1f, shirt:0xefeadf, letter:"E", cost:0},
  ban:{n:"Bạn Thân", d:"Nhanh nhẹn +12% tốc độ. Khởi đầu: Tên lửa tình yêu.", w:"heart", hair:0x6b3a1f, shirt:0xff8fa3, letter:"B", spd:1.12, pony:1, cost:300},
  hot:{n:"Hot Boy", d:"Chí mạng +15%. Khởi đầu: Sấm sét.", w:"bolt", hair:0xd9b44a, shirt:0x2b2b36, letter:"H", crit:.15, cost:800},
  gym:{n:"Gym Bro", d:"Trâu bò +40% máu. Khởi đầu: Sóng xung.", w:"wave", hair:0x2b2b2b, shirt:0xe8453c, letter:"G", hp:1.4, big:1, cost:1500},
  bo:{n:"Bố", d:"Lực lưỡng, chịu đòn tốt +30% máu. Khởi đầu: Dép.", w:"slipper", hair:0x3b2a1e, shirt:0x5a7d52, letter:"B", beard:1, big:1, hp:1.3, cost:1200},
  me:{n:"Mẹ", d:"Vung chảo rất mạnh +15% sát thương. Khởi đầu: Chảo.", w:"pan", hair:0x2a1a14, shirt:0xf2a7c0, letter:"M", bun:1, dm:1.15, cost:1000},
  anh:{n:"Anh trai", d:"Tay đua nhanh nhẹn +8% tốc độ. Khởi đầu: Ném máy tính.", w:"laptop", hair:0x1a1a1a, shirt:0x3c6fb0, letter:"A", cap:0x2e5aa8, spd:1.08, cost:900}
};
const WP = {
  orbit:{n:"Lốp xoay", ic:"💫", d:"Lốp bay quanh bạn, nghiền nát tình địch.", evo:"Vòng lốp lửa", need:"arm"},
  throw:{n:"Phi lốp", ic:"🎯", d:"Ném lốp xuyên qua hàng loạt kẻ địch.", evo:"Lốp quái vật", need:"dmg"},
  heart:{n:"Tên lửa tình yêu", ic:"💘", d:"Trái tim tự dẫn hướng, nổ lan.", evo:"Mưa tình yêu", need:"cdr"},
  bolt:{n:"Sấm sét", ic:"⚡", d:"Sét đánh ngẫu nhiên vào kẻ địch.", evo:"Thiên lôi", need:"crit"},
  wave:{n:"Sóng xung", ic:"💥", d:"Sóng nổ đẩy lùi mọi thứ quanh bạn.", evo:"Động đất", need:"hp"},
  gun:{n:"Súng", ic:"🔫", d:"Bắn liên thanh vào kẻ địch gần nhất, đạn xuyên mục tiêu.", evo:"Súng máy", need:"crit"},
  bow:{n:"Cung tên", ic:"🏹", d:"Bắn mũi tên xuyên qua nhiều kẻ địch.", evo:"Cung thần", need:"dmg"},
  laptop:{n:"Ném máy tính", ic:"💻", d:"Ném laptop, phát nổ khi chạm đất.", evo:"Siêu máy chủ", need:"cdr"},
  slipper:{n:"Dép", ic:"🩴", d:"Quật dép trước mặt, đẩy lùi kẻ địch.", evo:"Dép thần", need:"arm"},
  pan:{n:"Chảo", ic:"🍳", d:"Vung chảo quanh người, đập cực mạnh.", evo:"Chảo thần", need:"hp"}
};
const PS = {
  hp:{n:"Áo giáp", ic:"🛡️", d:"+20 máu tối đa, hồi đầy 20"}, spd:{n:"Giày chạy", ic:"👟", d:"+8% tốc độ chạy"}, mag:{n:"Nam châm", ic:"🧲", d:"+30% tầm hút kinh nghiệm"},
  dmg:{n:"Găng tay", ic:"🥊", d:"+12% sát thương"}, crit:{n:"Kính râm", ic:"🕶️", d:"+8% chí mạng"}, cdr:{n:"Băng đô", ic:"⏱️", d:"-8% hồi chiêu"}, arm:{n:"Áo khoác", ic:"🧥", d:"-7% sát thương nhận"}
};
const UPG = {hp:["Máu gốc", "+10% máu mỗi cấp", 10], dmg:["Sức mạnh", "+8% sát thương", 10], spd:["Tốc độ", "+4% tốc độ chạy", 10], mag:["Nam châm", "+15% tầm hút", 10], xp:["Học nhanh", "+8% kinh nghiệm", 10], rev:["Hồi sinh", "Thêm 1 lần hồi sinh miễn phí", 2]};
const MIS = [["Hạ 150 tình địch", () => SV.mis.k, 150, 60], ["Sống sót 4 phút trong một ván", () => Math.floor(SV.mis.t), 240, 80], ["Đánh bại 1 trùm", () => SV.mis.b, 1, 100]];
const ECFG = {
  nhan:{c:0x4a90d9, h:0x6b4a2f, s:.85, hp:3, sp:3.4, r:.55, dmg:6, xp:1}, hot:{c:0x26262b, h:0x3a2616, s:.92, hp:6, sp:4, r:.6, dmg:9, xp:3, dash:1},
  gym:{c:0xe8453c, h:0x2b2b2b, s:1.15, hp:22, sp:2.1, r:.9, dmg:14, xp:8}, boss:{c:0x1d1d28, h:0x9a9aa5, s:2.3, hp:700, sp:2.3, r:1.9, dmg:26, xp:40, dash:1, boss:1}
};
const NAMES = ["Bạn thân của crush", "Hot boy trường bên", "Hội tập gym", "Đồng nghiệp của crush"];

// ---------- Mô hình, hiệu ứng dùng chung ----------
const shadowMat = new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:.25}), shadowGeo = new THREE.CircleGeometry(.7, 16);
function ol(m) { m.geometry.computeBoundingSphere(); const o = new THREE.Mesh(m.geometry, OUT); o.scale.setScalar(1 + .055 / m.geometry.boundingSphere.radius); o.castShadow = false; m.add(o); }
function buildFoe(type, mats) {
  const c = ECFG[type], g = new THREE.Group(), M2 = (col, r = .65, m = 0) => { const x = M(col, r, m); mats.push(x); return x; };
  const skin = M2(0xf1c9a0, .55), shirt = M2(c.c, .7), pants = M2(0x33384d, .8), hair = M2(c.h, .5), dark = M(0x111118, .3), w = type === "gym" ? 1.35 : type === "boss" ? 1.2 : 1;
  g.userData.legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .25, .75, 0); g.add(l); mk(BX(.3, .8, .35), pants, 0, -.4, 0, l); return l; });
  const tor = mk(new THREE.CapsuleGeometry(.45, .5, 5, 10), shirt, 0, 1.45, 0, g); tor.scale.set(w, 1, .8); const hd = mk(SP(.45, 14, 10), skin, 0, 2.3, 0, g);
  mk(new THREE.SphereGeometry(.48, 14, 8, 0, Math.PI * 2, 0, Math.PI * .52), hair, 0, 2.36, -.02, g);
  [-1, 1].forEach(s => { mk(SP(.1, 8, 6), M(0xffffff, .3), s * .18, 2.32, .38, g); mk(SP(.05, 6, 6), dark, s * .18, 2.32, .46, g); mk(BX(.22, .05, .05), dark, s * .18, 2.5, .43, g).rotation.z = s * .45; });
  if (type === "nhan") mk(BX(.3, .5, .05), new THREE.MeshStandardMaterial({color:0x9fe3ff, emissive:0x5fb8e8, emissiveIntensity:.9}), .7, 1.5, .45, g);
  if (type === "hot") { [-.2, 0, .2].forEach(x => mk(new THREE.ConeGeometry(.12, .4, 6), hair, x, 2.85, 0, g)); mk(BX(.7, .16, .1), dark, 0, 2.33, .44, g); }
  if (type === "gym") { [-1, 1].forEach(s => mk(SP(.28, 8, 6), skin, s * .85, 1.6, 0, g)); mk(new THREE.TorusGeometry(.46, .04, 6, 14), M2(0xffffff), 0, 2.52, 0, g).rotation.x = Math.PI / 2; }
  if (type === "boss") { mk(BX(.14, .6, .05), M2(0xe8453c), 0, 1.5, .38, g); mk(new THREE.TorusGeometry(.3, .03, 6, 14), M2(0xffd25e, .3, .8), 0, 1.85, .2, g).rotation.x = Math.PI / 2; mk(SP(.2, 8, 6), M2(0xffd25e, .3, .8), -.9, 1.1, .1, g); outline(g); }
  else { ol(tor); ol(hd); g.traverse(m => { if (m.isMesh) m.castShadow = false; }); }
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = .03; g.add(sh); g.scale.setScalar(c.s); return g;
}
function tireMesh(evo, s = 1) {
  const g = new THREE.Group(), sp = new THREE.Group(); g.add(sp); mk(new THREE.TorusGeometry(.55, .26, 8, 18), M(0x1c1c22, .9), 0, 0, 0, sp).castShadow = false;
  mk(CY(.38, .38, .34, 12), M(evo ? 0xffd25e : 0xa3a9b5, .3, .9), 0, 0, 0, sp).rotation.x = Math.PI / 2;
  if (evo) sp.add(new THREE.Mesh(new THREE.TorusGeometry(.62, .36, 6, 14), new THREE.MeshBasicMaterial({color:0xff8a1f, transparent:true, opacity:.4})));
  g.userData.sp = sp; g.scale.setScalar(s); return g;
}
const heartGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, -.3); s.bezierCurveTo(-.6, .1, -.4, .6, 0, .35); s.bezierCurveTo(.4, .6, .6, .1, 0, -.3); return new THREE.ExtrudeGeometry(s, {depth:.18, bevelEnabled:true, bevelSize:.04, bevelThickness:.04, bevelSegments:2}); })();
const heartMat = new THREE.MeshStandardMaterial({color:0xff4d8d, emissive:0xaa1144, emissiveIntensity:.6, roughness:.3});
const gemGeo = new THREE.OctahedronGeometry(.24), gemMats = [0x4cc9f0, 0x55d6a1, 0xe8453c].map(c => new THREE.MeshStandardMaterial({color:c, emissive:c, emissiveIntensity:.5, roughness:.25}));
function applyGear() {
  const pl = (P && P.pl) || {}, c = k => Math.min(pl[k] || 0, 3), L = {dcd:c("spd"), cd:c("dmg"), max:c("hp"), spd:c("cdr"), crit:c("crit"), jk:c("arm")};
  PM.shoe.color.set([0xffffff, 0xe8453c, 0xffd25e, 0xffd25e][L.dcd]); R.wings.forEach(w => w.visible = L.dcd >= 2);
  PM.glove.color.set([0xf1c9a0, 0xe8453c, 0xc92b2b, 0xffd25e][L.cd]); R.hand.scale.setScalar(1 + L.cd * .2);
  R.pads.forEach(p => { p.visible = L.max >= 1; p.material.color.set(L.max >= 3 ? 0xffd25e : 0x9aa3b5); }); R.cape.visible = L.max >= 2; R.badge.visible = L.max >= 3;
  PM.band.color.set(L.spd >= 3 ? 0xffd25e : 0xe8453c); R.band.visible = L.spd >= 1; R.tails.visible = L.spd >= 2;
  R.glasses.visible = L.crit >= 1; PM.glass.color.set(L.crit >= 2 ? 0x3b2a66 : 0x111111); PM.glass.emissive.set(L.crit >= 3 ? 0x6a5010 : 0);
  R.jk.visible = L.jk >= 1; PM.jk.color.set(L.jk >= 2 ? 0x1f1f26 : 0x4a78b8); R.shield.visible = false;
}
let playerMesh = null;
function setChar(id) { if (playerMesh) scene.remove(playerMesh); playerMesh = buildPlayer(CH[id]); updateHeld(id, false); applyGear(); }
const pGeo = BX(.2, .2, .2), pMats = {};
function burst(x, z, col, n, sp = 7) {
  const m = pMats[col] = pMats[col] || new THREE.MeshBasicMaterial({color:col});
  for (let i = 0; i < n && PT.length < 160; i++) { const a = Math.random() * 6.28, v = sp * (.3 + Math.random()), mesh = new THREE.Mesh(pGeo, m); mesh.position.set(x, 1.2, z); scene.add(mesh); PT.push({mesh, vx:Math.cos(a) * v, vz:Math.sin(a) * v, vy:3 + Math.random() * 5, t:.4 + Math.random() * .3}); }
}
function floatText(x, y, z, txt, col) { if (FX.length > 16) return; const el = document.createElement("div"); el.className = "ft"; el.textContent = txt; el.style.color = col; box.parentElement.append(el); FX.push({el, p:new THREE.Vector3(x, y, z), t:.8}); }
function ring(x, z, r, col, dur = .3) { const m = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 40), new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.8, side:THREE.DoubleSide})); m.rotation.x = -Math.PI / 2; m.position.set(x, .25, z); scene.add(m); FM.push({mesh:m, t:0, dur, r1:r}); }
function beam(x, z) { const m = new THREE.Mesh(CY(.25, .25, 14, 8), new THREE.MeshBasicMaterial({color:0xfff3a0, transparent:true, opacity:.9})); m.position.set(x, 7, z); scene.add(m); FM.push({mesh:m, t:0, dur:.18, r1:0}); }
let AC;
function snd(f, d = .08, type = "square", v = .03, slide = 0) {
  try { AC = AC || new AudioContext(); const o = AC.createOscillator(), g = AC.createGain(), tt = AC.currentTime; o.type = type; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), tt + d);
    g.gain.setValueAtTime(v, tt); g.gain.exponentialRampToValueAtTime(.001, tt + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(tt + d); } catch {}
}

// ---------- Trạng thái ----------
let P = null, E = [], G = [], C = [], PJ = [], PT = [], FX = [], FM = [], state = "menu", t = 0, kills = 0, bossKills = 0, score = 0, lvq = 0, spawnT = 0, nextElite = 55, bi = 0, ri = 0, bannerT = 0, hurtT = 0, shake = 0, last = 0, tab = "char", won = false, jo = null;
const keys = {}, camT = {x:0, z:7}, BOSSAT = [170, 330], RINGAT = [60, 140, 220, 300];
const dmgM = () => (1 + SV.up.dmg * .08 + P.pl.dmg * .12) * (CH[SV.sel].dm || 1), cdM = () => Math.max(.4, 1 - P.pl.cdr * .08), critC = () => (CH[SV.sel].crit || 0) + P.pl.crit * .08;
const projCoins = () => Math.floor(kills * .4 + t / 6 + bossKills * 80 + (won ? 300 : 0));
const banner = txt => { $("banner").textContent = txt; bannerT = 2; };
function h(tag, props = {}, ...kids) { const e = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (k === "onclick") e.onclick = v; else if (k === "cls") e.className = v; else e.setAttribute(k, v); } e.append(...kids.flat()); return e; }

function startRun() {
  if (P) Object.values(P.ws).forEach(w => w.ms.forEach(m => scene.remove(m)));
  [...E, ...G, ...C, ...PJ, ...PT, ...FM].forEach(o => scene.remove(o.mesh)); FX.forEach(f => f.el.remove()); E = []; G = []; C = []; PJ = []; PT = []; FX = []; FM = [];
  const ch = CH[SV.sel], max = Math.round(100 * (ch.hp || 1) * (1 + SV.up.hp * .1)); P = null; setChar(SV.sel);
  P = {x:0, z:7, fx:1, fz:0, hp:max, max, inv:0, t:0, mv:false, xp:0, lvl:1, need:6, rev:SV.up.rev, paid:false, ws:{}, pl:{hp:0, spd:0, mag:0, dmg:0, crit:0, cdr:0, arm:0}};
  t = 0; kills = 0; bossKills = 0; lvq = 0; spawnT = .5; nextElite = 55; bi = 0; ri = 0; won = false; addWeapon(ch.w); updateHeld(SV.sel, true); applyGear(); renderSlots();
  state = "run"; ["menu", "end", "lv"].forEach(i => $(i).hidden = true); $("hud").hidden = false; banner("Chương 1: Sống sót 6 phút!"); snd(440, .15, "triangle", .05, 400);
}
function addWeapon(id) { P.ws[id] = {lv:1, evo:false, cd:.4, ang:0, ms:[], sig:""}; }
function renderSlots() {
  $("slots").replaceChildren(...Object.entries(P.ws).map(([id, w]) => h("span", {}, WP[id].ic + (w.evo ? "★" : w.lv))), ...Object.entries(P.pl).filter(([, v]) => v).map(([id, v]) => h("span", {cls:"p"}, PS[id].ic + v)));
}
function spawnE(type, o = {}) {
  const cfg = ECFG[type]; let p = [P.x + 18, P.z];
  for (let i = 0; i < 8; i++) { const an = o.an !== undefined ? o.an : Math.random() * 6.283, ds = o.ds || 17 + Math.random() * 4; p = [clamp(P.x + Math.cos(an) * ds, -MAXX - 2, MAXX + 2), clamp(P.z + Math.sin(an) * ds, -MAXZ - 2, MAXZ + 2)]; if (o.an !== undefined || Math.hypot(p[0] - P.x, p[1] - P.z) >= 13) break; }
  const mats = [], mesh = buildFoe(type, mats); if (o.elite) mesh.scale.multiplyScalar(1.35); scene.add(mesh);
  const hp = Math.round(cfg.hp * (type === "boss" ? (o.final ? 2.4 : 1) * (1 + t / 200) : 1 + t / 80) * (o.elite ? 4 : 1));
  E.push({...cfg, type, hp, mhp:hp, r:cfg.r * (o.elite ? 1.3 : 1), x:p[0], z:p[1], h:0, w:Math.random() * 6, dt2:1 + Math.random() * 2, boost:0, mesh, mats, elite:!!o.elite, final:!!o.final, dead:false, em:-1});
}
function spawnTick(dt) {
  const cap = Math.min(70, 16 + (t / 4 | 0));
  if ((spawnT -= dt) <= 0 && E.length < cap) { spawnT = 1 / (1.6 + t / 40); for (let i = 0, n = 1 + (t > 90) + (t > 200); i < n; i++) { const r = Math.random(); spawnE(t > 100 && r < .18 ? "gym" : t > 40 && r < .4 ? "hot" : "nhan"); } }
  if (t >= nextElite) { nextElite += 70; spawnE("gym", {elite:true}); banner("Tinh anh xuất hiện! Hạ nó để nhận rương"); }
  if (ri < RINGAT.length && t >= RINGAT[ri]) { ri++; for (let i = 0; i < 24; i++) spawnE("nhan", {an:i / 24 * 6.283, ds:11}); banner("Vòng vây tình địch!"); snd(150, .3, "sawtooth", .05, -60); }
  if (bi < BOSSAT.length && t >= BOSSAT[bi]) { spawnE("boss", {final:bi === 1}); banner(bi === 1 ? "TRÙM CUỐI: Đại gia siêu xe!" : "Trùm xuất hiện!"); bi++; }
}
function nearest() { let b = null, bd = 1e9; for (const e of E) { if (e.dead) continue; const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < bd) { bd = d; b = e; } } return b; }
function dmg(e, base, kb = 0, fx = 0, fz = 0) {
  if (e.dead) return; const c = Math.random() < critC(), d = Math.round(base * dmgM() * (c ? 2 : 1)); e.hp -= d; e.h = .08;
  if (kb) { const dx = e.x - fx, dz = e.z - fz, l = Math.hypot(dx, dz) || 1, k = e.boss ? kb * .12 : kb; e.x += dx / l * k; e.z += dz / l * k; }
  if (c || e.boss || Math.random() < .2) floatText(e.x, 2.8 * e.mesh.scale.x, e.z, String(d), c ? "#ffd25e" : "#fff");
  if (e.hp <= 0) die(e);
}
function die(e) {
  e.dead = true; scene.remove(e.mesh); kills++; burst(e.x, e.z, ({nhan:0x4a90d9, hot:0x555566, gym:0xe8453c, boss:0xffd25e})[e.type], e.boss ? 40 : 6, e.boss ? 12 : 6);
  const n = e.boss ? 8 : 1; for (let i = 0; i < n; i++) dropGem(e.x + (Math.random() - .5) * 2 * (n > 1), e.z + (Math.random() - .5) * 2 * (n > 1), e.xp / n * (e.elite ? 3 : 1));
  if (e.elite || e.boss) { const m = new THREE.Group(); mk(BX(1.1, .7, .8), M(0x8a5a3a, .6), 0, .35, 0, m); mk(BX(1.15, .2, .85), M(0xffd25e, .3, .8), 0, .8, 0, m); mk(BX(.2, .8, .86), M(0xffd25e, .3, .8), 0, .4, 0, m); m.position.set(e.x, 0, e.z); scene.add(m); C.push({x:e.x, z:e.z, mesh:m}); }
  if (e.boss) { bossKills++; shake = 14; snd(300, .5, "triangle", .08, 400); if (e.final) { won = true; endRun(true); } } else if (Math.random() < .3) snd(480 + Math.random() * 200, .08, "triangle", .02, 200);
}
function dropGem(x, z, v) {
  if (G.length > 150) { P.xp += v * (1 + SV.up.xp * .08); return; }
  const k = v >= 8 ? 2 : v >= 3 ? 1 : 0, m = new THREE.Mesh(gemGeo, gemMats[k]); m.scale.setScalar(1 + k * .5); m.position.set(x, .7, z); scene.add(m); G.push({x, z, v, mesh:m, mag:false});
}

// ---------- Vũ khí tự động ----------
function wOrbit(w, dt) {
  const l = w.lv, cnt = 2 + (l >> 1) + (w.evo ? 2 : 0), R0 = 3.2 + (w.evo ? .8 : 0), sig = cnt + "" + w.evo;
  if (w.sig !== sig) { w.ms.forEach(m => scene.remove(m)); w.ms = Array.from({length:cnt}, () => { const m = tireMesh(w.evo); scene.add(m); return m; }); w.sig = sig; }
  w.ang += dt * (2.6 + l * .25); const d0 = Math.round((8 + 4 * l) * (w.evo ? 2.2 : 1));
  w.ms.forEach((m, i) => { const a = w.ang + i * 6.283 / cnt, x = P.x + Math.cos(a) * R0, z = P.z + Math.sin(a) * R0; m.position.set(x, 1.3, z); m.userData.sp.rotation.z += dt * 8; m.rotation.y = -a;
    for (const e of E) if (!e.dead && t - (e["o" + i] || 0) > .4 && Math.hypot(e.x - x, e.z - z) < e.r + .9) { e["o" + i] = t; dmg(e, d0, .6, x, z); } });
}
function wThrow(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, cnt = 1 + (l >= 3) + (l >= 5) + (w.evo ? 2 : 0); w.cd = (1.5 - .12 * l) * cdM(); const a0 = Math.atan2(tg.z - P.z, tg.x - P.x);
  for (let i = 0; i < cnt; i++) { const a = a0 + (i - (cnt - 1) / 2) * .28, m = tireMesh(w.evo, w.evo ? 1.7 : 1.1); m.position.set(P.x, 1.1, P.z); scene.add(m);
    PJ.push({k:"tire", x:P.x, z:P.z, vx:Math.cos(a) * 14, vz:Math.sin(a) * 14, life:1.5, d:Math.round((14 + 5 * l) * (w.evo ? 2 : 1)), pierce:w.evo ? 99 : 3 + l, hit:new Set(), mesh:m, r:w.evo ? 1.3 : .8}); }
  snd(200, .1, "square", .03, -80);
}
function wHeart(w, dt) {
  w.cd -= dt; if (w.cd > 0 || !E.length) return; const l = w.lv, cnt = 1 + ((l + 1) >> 1) + (w.evo ? 3 : 0); w.cd = (1.7 - .1 * l) * cdM();
  for (let i = 0; i < cnt; i++) { const m = new THREE.Mesh(heartGeo, heartMat), a = Math.random() * 6.283; m.scale.setScalar(w.evo ? 1.3 : 1); m.position.set(P.x, 1.4, P.z); scene.add(m);
    PJ.push({k:"heart", x:P.x, z:P.z, vx:Math.cos(a) * 8, vz:Math.sin(a) * 8, life:3, d:Math.round((16 + 6 * l) * (w.evo ? 1.8 : 1)), rad:2 + (w.evo ? 1.5 : 0), mesh:m, tgt:null}); }
  snd(520, .1, "triangle", .03, 200);
}
function wBolt(w, dt) {
  w.cd -= dt; if (w.cd > 0 || !E.length) return; const l = w.lv, cnt = 1 + (l >> 1) + (w.evo ? 3 : 0), d0 = Math.round((22 + 8 * l) * (w.evo ? 1.8 : 1)), rr = w.evo ? 2.4 : 1.6; w.cd = (2 - .15 * l) * cdM();
  const pool = E.filter(e => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 14);
  for (let i = 0; i < cnt && pool.length; i++) { const e = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], x = e.x, z = e.z; beam(x, z); ring(x, z, rr, 0xffe14d); for (const o of E) if (!o.dead && Math.hypot(o.x - x, o.z - z) < rr + o.r) dmg(o, d0, .4, x, z); }
  snd(700, .12, "sawtooth", .04, -400);
}
function wWave(w, dt) {
  w.cd -= dt; if (w.cd > 0 || !E.length) return; const l = w.lv, Rm = (4 + .7 * l) * (w.evo ? 1.5 : 1), d0 = Math.round((18 + 7 * l) * (w.evo ? 2 : 1)); w.cd = (3 - .25 * l) * cdM();
  ring(P.x, P.z, Rm, 0xff7a3d, .35); if (w.evo) ring(P.x, P.z, Rm * .65, 0xffd25e, .5);
  for (const e of E) if (!e.dead && Math.hypot(e.x - P.x, e.z - P.z) < Rm + e.r) dmg(e, d0, 2.5, P.x, P.z); shake = Math.max(shake, 5); snd(110, .25, "sawtooth", .06, -50);
}

// ---------- Vũ khí mới: súng, cung, máy tính, dép, chảo (mô hình chi tiết hơn) ----------
const METAL = new THREE.MeshPhysicalMaterial({color:0x3a3f4a, roughness:.32, metalness:.9, bumpMap:BUMP_METAL, bumpScale:.4, clearcoat:.4, clearcoatRoughness:.2}), WOOD = new THREE.MeshPhysicalMaterial({color:0x7a4a2a, roughness:.55, bumpMap:BUMP_CONCRETE, bumpScale:.3, clearcoat:.2}), ALU = new THREE.MeshPhysicalMaterial({color:0xc9ced6, roughness:.22, metalness:.95, bumpMap:BUMP_METAL, bumpScale:.3}), CASE = new THREE.MeshPhysicalMaterial({color:0xb9c0cc, roughness:.3, metalness:.6, clearcoat:.6, clearcoatRoughness:.15}), DARK = M(0x2a2a30, .5, .2);
const RUB = M(0xe8a04d, .5), STRAP = M(0xe8453c, .5), PANM = M(0x2a2a2e, .4, .3), PANIN = M(0x6b7078, .3, .7), HANDLE = M(0x3a2a1a, .6);
function screenTex() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 160; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, "#2a7fe0"); g.addColorStop(1, "#0d2a55"); x.fillStyle = g; x.fillRect(0, 0, 256, 160);
  x.fillStyle = "#f5f7fb"; x.fillRect(0, 140, 256, 20); x.fillStyle = "#ffd25e"; x.fillRect(18, 36, 42, 42); x.fillStyle = "#7fd6c2"; x.fillRect(74, 36, 42, 42); x.fillStyle = "#e8453c"; x.fillRect(130, 36, 42, 42);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const SCREEN = new THREE.MeshStandardMaterial({map:screenTex(), roughness:.2, metalness:0, emissive:0x1a3d70, emissiveIntensity:.3});
const LAPTOP = (() => { const g = new THREE.Group(); mk(BX(.95, .05, .66), CASE, 0, 0, 0, g); mk(BX(.8, .01, .4), DARK, 0, .03, .08, g); mk(BX(.95, .6, .04), CASE, 0, .32, -.33, g); mk(new THREE.PlaneGeometry(.86, .52), SCREEN, 0, .32, -.3, g); return g; })();
const ARROW = (() => { const g = new THREE.Group(); mk(CY(.025, .025, 1.1, 8), WOOD, 0, 0, 0, g).rotation.x = Math.PI / 2; mk(new THREE.ConeGeometry(.07, .22, 8), ALU, 0, 0, .62, g).rotation.x = Math.PI / 2; return g; })();
const TRG = BX(.05, .05, 1);
function defaultHeld() { const g = new THREE.Group(); mk(CY(.17, .15, 1.6), M(0xcfd3da, .3, .8), 0, 0, .9, g).rotation.x = Math.PI / 2; return g; }
function gunHeld() {
  const g = new THREE.Group(); mk(BX(.22, .26, 1.1), METAL, 0, 0, 1.25, g); mk(BX(.16, .24, .55), WOOD, 0, -.02, .42, g); mk(BX(.05, .06, .3), METAL, 0, .17, 1.5, g);
  mk(CY(.07, .07, .85, 10), METAL, 0, .03, 2.25, g).rotation.x = Math.PI / 2; mk(BX(.18, .42, .2), WOOD, 0, -.28, 1.75, g).rotation.x = -.25; mk(BX(.12, .3, .15), METAL, 0, -.28, 1.2, g); return g;
}
function bowHeld() {
  const g = new THREE.Group(), outer = new THREE.Group(); outer.position.z = 1.4; outer.rotation.y = Math.PI / 2; g.add(outer);
  const limb = mk(new THREE.TorusGeometry(.75, .03, 8, 28, Math.PI * .9), WOOD, 0, 0, 0, outer); limb.rotation.z = Math.PI * .55;
  mk(BX(.012, 1.45, .012), ALU, -.117, 0, 0, outer); const ar = ARROW.clone(); ar.position.set(0, 0, 1.95); g.add(ar); return g;
}
function laptopHeld() { const g = new THREE.Group(), l = LAPTOP.clone(); l.position.set(0, .05, 1.85); g.add(l); return g; }
function slipperHeld() { const g = new THREE.Group(); mk(BX(.42, .1, 1.0), RUB, 0, 0, 1.9, g); mk(BX(.36, .06, .3), STRAP, 0, .08, 1.9, g); return g; }
function panHeld() { const g = new THREE.Group(); mk(CY(.55, .55, .12, 24), PANM, 0, 0, 2.5, g).rotation.x = Math.PI / 2; mk(CY(.46, .46, .13, 24), PANIN, 0, 0, 2.5, g).rotation.x = Math.PI / 2; mk(BX(.12, .12, .7), HANDLE, 0, 0, 2.1, g); return g; }
const HELD = {gun:gunHeld, bow:bowHeld, laptop:laptopHeld, slipper:slipperHeld, pan:panHeld};
function updateHeld(id, fromRun) {
  // Tay cầm vũ khí có mô hình cầm tay mới nhất trong trận; ngoài trận thì theo nhân vật
  const held = fromRun && P ? Object.keys(P.ws).filter(k => HELD[k]).pop() : null, w = held || CH[id].w;
  if (R.held) R.weapon.remove(R.held); R.held = (HELD[w] || defaultHeld)(); R.weapon.add(R.held);
}
function tracer(x1, z1, x2, z2) { const m = new THREE.Mesh(TRG, new THREE.MeshBasicMaterial({color:0xfff1a8, transparent:true, opacity:.9})); const L = Math.hypot(x2 - x1, z2 - z1); m.scale.set(1, 1, L); m.position.set((x1 + x2) / 2, 1.3, (z1 + z2) / 2); m.rotation.y = Math.atan2(x2 - x1, z2 - z1); scene.add(m); FM.push({mesh:m, t:0, dur:.12, r1:0}); }
function arcRing(x, z, R0, center, half, col) { const g = new THREE.RingGeometry(R0 * .45, R0, 28, 1, -center - half, half * 2); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.85, side:THREE.DoubleSide})); m.rotation.x = -Math.PI / 2; m.position.set(x, .6, z); scene.add(m); FM.push({mesh:m, t:0, dur:.2, r1:0}); }
function segDist(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1; const u = clamp(((px - ax) * dx + (pz - az) * dz) / L2, 0, 1); return Math.hypot(ax + dx * u - px, az + dz * u - pz); }
function wGun(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (l >> 1) + (w.evo ? 3 : 0), R0 = 13 + l * .5, base = Math.round((9 + 2 * l) * (w.evo ? 1.5 : 1)), a0 = Math.atan2(tg.z - P.z, tg.x - P.x);
  w.cd = (.42 - .025 * l) * cdM(); const spread = w.evo ? .14 : .07, pierce = w.evo ? 99 : 1 + (l >> 2);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * spread, ex = P.x + Math.cos(a) * R0, ez = P.z + Math.sin(a) * R0; tracer(P.x, P.z, ex, ez);
    const hits = E.filter(e => !e.dead && segDist(e.x, e.z, P.x, P.z, ex, ez) < e.r + .2).sort((p, q) => Math.hypot(p.x - P.x, p.z - P.z) - Math.hypot(q.x - P.x, q.z - P.z)).slice(0, pierce);
    for (const e of hits) dmg(e, base, .3, P.x, P.z);
  }
  snd(880, .05, "square", .02, -500);
}
function wBow(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (l >> 2) + (w.evo ? 2 : 0), a0 = Math.atan2(tg.z - P.z, tg.x - P.x);
  w.cd = (1.25 - .08 * l) * cdM();
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * .12, m = ARROW.clone(); m.position.set(P.x, 1.4, P.z); m.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)); scene.add(m);
    PJ.push({k:"arrow", x:P.x, z:P.z, vx:Math.cos(a) * 22, vz:Math.sin(a) * 22, life:1.1, d:Math.round((12 + 4 * l) * (w.evo ? 1.6 : 1)), pierce:w.evo ? 99 : 2 + (l >> 1), hit:new Set(), mesh:m, r:.45});
  }
  snd(1100, .04, "triangle", .02, -400);
}
function wLaptop(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (l >> 2) + (w.evo ? 1 : 0), a0 = Math.atan2(tg.z - P.z, tg.x - P.x);
  w.cd = (2.2 - .1 * l) * cdM();
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * .35, m = LAPTOP.clone(); m.position.set(P.x, 1.3, P.z); m.scale.setScalar(.9); scene.add(m);
    PJ.push({k:"laptop", x:P.x, z:P.z, vx:Math.cos(a) * 9, vz:Math.sin(a) * 9, life:1.2, d:Math.round((26 + 8 * l) * (w.evo ? 1.6 : 1)), rad:2.2 + .25 * l, exp:true, col:0x4cc9f0, mesh:m, r:.7, hit:new Set()});
  }
  snd(260, .12, "sawtooth", .03, -120);
}
function wSlipper(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const l = w.lv, R0 = (2.4 + .3 * l) * (w.evo ? 1.4 : 1), half = Math.PI / 3, fa = Math.atan2(P.fz, P.fx);
  const hit = E.filter(e => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < R0 + e.r && Math.cos(Math.atan2(e.z - P.z, e.x - P.x) - fa) > .5);
  if (!hit.length) return; w.cd = (.85 - .05 * l) * cdM(); const base = Math.round((12 + 5 * l) * (w.evo ? 1.5 : 1));
  for (const e of hit) dmg(e, base, 2.5, P.x, P.z);
  arcRing(P.x, P.z, R0, fa, half, 0xffd08a); snd(260, .08, "square", .04, -120);
}
function wPan(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const l = w.lv, R0 = (2.3 + .2 * l) * (w.evo ? 1.35 : 1);
  const hit = E.filter(e => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < R0 + e.r); if (!hit.length) return;
  w.cd = (1.15 - .06 * l) * cdM(); const base = Math.round((18 + 6 * l) * (w.evo ? 1.5 : 1));
  for (const e of hit) dmg(e, base, 4, P.x, P.z);
  arcRing(P.x, P.z, R0, 0, Math.PI, 0xffe0b0); shake = Math.max(shake, 3); snd(140, .12, "triangle", .06, -60);
}
const WF = {orbit:wOrbit, throw:wThrow, heart:wHeart, bolt:wBolt, wave:wWave, gun:wGun, bow:wBow, laptop:wLaptop, slipper:wSlipper, pan:wPan};
function explodeAt(p) { ring(p.x, p.z, p.rad, p.col || 0xff4d8d); for (const e of E) if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) < p.rad + e.r) dmg(e, p.d, 1.2, p.x, p.z); snd(160, .15, "square", .05, -70); }
function explode(p) { explodeAt(p); p.exp = false; p.life = 0; }

// ---------- Cập nhật ----------
function inputDir() {
  let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), z = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (jo) { x += jo.dx; z += jo.dz; } const m = Math.hypot(x, z); return m > 1 ? {x:x / m, z:z / m} : {x, z};
}
function update(dt) {
  t += dt; const d = inputDir(); P.mv = Math.hypot(d.x, d.z) > .05; P.t += P.mv ? dt : dt * .2; if (P.mv) { P.fx = d.x; P.fz = d.z; }
  const sp = 8.2 * (CH[SV.sel].spd || 1) * (1 + SV.up.spd * .04 + P.pl.spd * .08);
  P.x = clamp(P.x + d.x * sp * dt, -MAXX, MAXX); P.z = clamp(P.z + d.z * sp * dt, -MAXZ, MAXZ); pushOut(P, .6);
  P.inv = Math.max(0, P.inv - dt); P.hp = Math.min(P.max, P.hp + dt * .4); spawnTick(dt);
  for (const [id, w] of Object.entries(P.ws)) WF[id](w, dt);
  for (const e of E) {
    if (e.dead) continue; e.h = Math.max(0, e.h - dt); e.w += dt * 9;
    if (e.dash && (e.dt2 -= dt) <= 0) { e.boost = .4; e.dt2 = (e.boss ? 3 : 2.2) + Math.random() * 1.5; }
    e.boost = Math.max(0, e.boost - dt); const dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz) || 1, s = e.sp * (e.boost > 0 ? 3.5 : 1) * (1 + t / 400);
    e.x += dx / dist * s * dt; e.z += dz / dist * s * dt;
    for (const o of E) { if (o === e || o.dead) continue; const ax = e.x - o.x, az = e.z - o.z, ad = Math.hypot(ax, az), mn = (e.r + o.r) * .8; if (ad < mn && ad > .001) { e.x += ax / ad * (mn - ad) * .5; e.z += az / ad * (mn - ad) * .5; } }
    pushOut(e, e.r * .8);
    if (dist < e.r + .6 && P.inv <= 0) {
      const dm = Math.max(1, Math.round(e.dmg * (1 - P.pl.arm * .07))); P.hp -= dm; P.inv = .45; hurtT = .3; shake = Math.max(shake, 6); snd(90, .2, "sawtooth", .06, -40); burst(P.x, P.z, 0xe8453c, 8); floatText(P.x, 4, P.z, "-" + dm, "#ff8a8a");
      if (P.hp <= 0) return playerDown();
    }
  }
  for (const p of PJ) {
    p.life -= dt;
    if (p.k === "heart") { if (!p.tgt || p.tgt.dead) { let b = null, bd = 1e9; for (const e of E) if (!e.dead) { const dd = Math.hypot(e.x - p.x, e.z - p.z); if (dd < bd) { bd = dd; b = e; } } p.tgt = b; }
      if (p.tgt) { const a = Math.atan2(p.tgt.z - p.z, p.tgt.x - p.x); p.vx += (Math.cos(a) * 11 - p.vx) * Math.min(1, dt * 5); p.vz += (Math.sin(a) * 11 - p.vz) * Math.min(1, dt * 5); } }
    p.x += p.vx * dt; p.z += p.vz * dt; p.mesh.position.x = p.x; p.mesh.position.z = p.z;
    if (p.k === "tire" || p.k === "arrow") { if (p.k === "tire") p.mesh.userData.sp.rotation.z += dt * 14; for (const e of E) if (!e.dead && !p.hit.has(e) && Math.hypot(e.x - p.x, e.z - p.z) < e.r + p.r) { p.hit.add(e); dmg(e, p.d, 1.2, p.x, p.z); if (--p.pierce <= 0) p.life = 0; } }
    else { p.mesh.rotation.y += dt * 6; if (p.life > 0) for (const e of E) if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) < e.r + .6) { explode(p); break; } }
    if (Math.abs(p.x) > 40 || Math.abs(p.z) > 32) p.life = 0;
  }
  PJ = PJ.filter(p => { if (p.life > 0) return true; if (p.exp) explodeAt(p); scene.remove(p.mesh); return false; });
  const pr = 3.2 * (1 + SV.up.mag * .15 + P.pl.mag * .3);
  for (const g of G) { const dx = P.x - g.x, dz = P.z - g.z, dd = Math.hypot(dx, dz); if (dd < pr) g.mag = true; if (g.mag) { const s = 17 * dt; g.x += dx / (dd || 1) * s; g.z += dz / (dd || 1) * s; }
    g.mesh.position.set(g.x, .7 + Math.sin(t * 4 + g.v) * .1, g.z); g.mesh.rotation.y += dt * 2; if (dd < .7) { g.dead = true; scene.remove(g.mesh); P.xp += g.v * (1 + SV.up.xp * .08); } }
  G = G.filter(g => !g.dead);
  for (const c of C) { c.mesh.rotation.y += dt; if (Math.hypot(P.x - c.x, P.z - c.z) < 1.6) { c.dead = true; scene.remove(c.mesh); lvq++; banner("Rương kho báu!"); snd(660, .3, "triangle", .06, 500); } }
  C = C.filter(c => !c.dead);
  PT.forEach(p => { p.t -= dt; p.mesh.position.x += p.vx * dt; p.mesh.position.z += p.vz * dt; p.vy -= 18 * dt; p.mesh.position.y = Math.max(.1, p.mesh.position.y + p.vy * dt); if (p.t <= 0) scene.remove(p.mesh); }); PT = PT.filter(p => p.t > 0);
  FM.forEach(f => { f.t += dt; const k = Math.min(1, f.t / f.dur); if (f.r1) f.mesh.scale.setScalar(Math.max(.1, f.r1 * (1 - (1 - k) * (1 - k)))); f.mesh.material.opacity = (1 - k) * .85; if (k >= 1) scene.remove(f.mesh); }); FM = FM.filter(f => f.t < f.dur);
  FX.forEach(f => { f.t -= dt; f.p.y += 1.5 * dt; if (f.t <= 0) f.el.remove(); }); FX = FX.filter(f => f.t > 0);
  E = E.filter(e => !e.dead); bannerT -= dt; hurtT = Math.max(0, hurtT - dt);
  while (P.xp >= P.need) { P.xp -= P.need; P.lvl++; P.need = Math.floor(5 + P.lvl * 4.4); lvq++; }
  if (lvq > 0 && state === "run") openLevelUp(); if (t >= 360 && !won && bi >= 2 && !E.some(e => e.boss)) { won = true; endRun(true); }
}
function playerDown() {
  if (P.rev > 0) { P.rev--; revive(.6, "Hồi sinh miễn phí!"); } else endRun(false);
}
function revive(f, msg) { P.hp = Math.round(P.max * f); P.inv = 2.5; ring(P.x, P.z, 10, 0xffffff, .5); E.forEach(e => { if (!e.boss) { e.dead = true; scene.remove(e.mesh); } }); E = E.filter(e => !e.dead); banner(msg); snd(500, .4, "triangle", .07, 500); }

// ---------- Lên cấp, chọn kỹ năng ----------
function options() {
  const o = [], ev = [];
  for (const [id, w] of Object.entries(P.ws)) { if (w.lv < 5) o.push({k:"w", id, ic:WP[id].ic, t:`${WP[id].n} Lv${w.lv} → Lv${w.lv + 1}`, d:WP[id].d}); else if (!w.evo && P.pl[WP[id].need] > 0) ev.push({k:"e", id, ic:"⭐", t:`TIẾN HÓA: ${WP[id].evo}`, d:`${WP[id].n} đạt sức mạnh tối đa`}); }
  if (Object.keys(P.ws).length < 4) for (const id in WP) if (!P.ws[id]) o.push({k:"w", id, ic:WP[id].ic, t:`Mới: ${WP[id].n}`, d:WP[id].d});
  for (const id in PS) if (P.pl[id] < 5) o.push({k:"p", id, ic:PS[id].ic, t:`${PS[id].n} Lv${P.pl[id]} → Lv${P.pl[id] + 1}`, d:PS[id].d});
  return [...ev, ...o.sort(() => Math.random() - .5)].slice(0, 3);
}
function openLevelUp() {
  const op = options(); if (!op.length) { lvq = 0; P.hp = Math.min(P.max, P.hp + P.max * .3); return; }
  state = "lv"; $("lvt").textContent = `Lên cấp ${P.lvl}! Chọn 1 kỹ năng`;
  $("lvc").replaceChildren(...op.map(o => h("button", {cls:"card", onclick:() => choose(o)}, h("i", {}, o.ic), h("b", {}, o.t), h("small", {}, o.d)))); $("lv").hidden = false; snd(600, .25, "triangle", .06, 500);
}
function choose(o) {
  if (o.k === "w") { if (P.ws[o.id]) P.ws[o.id].lv++; else addWeapon(o.id); } else if (o.k === "e") { P.ws[o.id].evo = true; P.ws[o.id].lv = 5; banner("TIẾN HÓA: " + WP[o.id].evo + "!"); shake = 8; }
  else { P.pl[o.id]++; if (o.id === "hp") { P.max += 20; P.hp = Math.min(P.max, P.hp + 20); } applyGear(); }
  updateHeld(SV.sel, true); renderSlots(); lvq--; $("lv").hidden = true; state = "run"; if (lvq > 0) openLevelUp();
}

// ---------- Kết thúc ván ----------
function endRun(win) {
  state = "end"; $("hud").hidden = true; const gain = projCoins(); P.gain = gain;
  score = Math.min(99999, kills * 10 + Math.floor(t) * 5 + bossKills * 500 + (win ? 3000 : 0));
  SV.coins += gain; SV.best = Math.max(SV.best, Math.floor(t)); SV.mis.k += kills; SV.mis.t = Math.max(SV.mis.t, t); SV.mis.b += bossKills; save();
  $("msg").textContent = win ? "CHIẾN THẮNG! Bạn đã giành được danh phận!" : `Thất bại sau ${fmt(t)}`;
  $("rew").textContent = `☠ ${kills} kẻ địch   ⏱ ${fmt(t)}   Điểm ${score}   💰 +${gain} xu (tổng ${SV.coins})`; $("saveForm").hidden = score === 0;
  const b = [];
  if (!win && !P.paid && SV.coins >= 100) b.push(h("button", {onclick:() => { SV.coins -= 100; P.paid = true; save(); $("end").hidden = true; $("hud").hidden = false; state = "run"; revive(.5, "Hồi sinh!"); }}, "Hồi sinh (💰100)"));
  b.push(h("button", {cls:"play", onclick:startRun}, "Chơi lại"), h("button", {onclick:() => { renderMenu(); $("end").hidden = true; $("menu").hidden = false; state = "menu"; }}, "Trang chủ"));
  $("endBtns").replaceChildren(...b); $("end").hidden = false; loadBoard();
}

// ---------- Trang chủ ----------
function renderMenu() {
  const m = $("menu"), tabs = [["char", "Nhân vật"], ["shop", "Nâng cấp"], ["mis", "Nhiệm vụ" + (SV.gift !== today() ? " 🎁" : "")]];
  m.replaceChildren(h("div", {cls:"top"}, h("b", {}, "💰 " + SV.coins), h("span", {}, "Kỷ lục sống sót: " + fmt(SV.best))), h("h2", {}, "Lốp Trưởng Đại Chiến"), h("p", {cls:"sub"}, "Chương 1: sống sót 6 phút và hạ trùm cuối"),
    h("div", {cls:"tabs"}, ...tabs.map(([k, n]) => h("button", {cls:tab === k ? "on" : "", onclick:() => { tab = k; renderMenu(); }}, n))), h("div", {cls:"tabc"}, ...tabBody()), h("button", {cls:"play", onclick:startRun}, "▶ CHƠI"));
}
function tabBody() {
  if (tab === "char") return Object.entries(CH).map(([id, c]) => { const own = SV.chars.includes(id), sel = SV.sel === id;
    return h("div", {cls:"row" + (sel ? " sel" : "")}, h("span", {cls:"sw", style:`background:#${c.shirt.toString(16).padStart(6, "0")}`}, c.letter), h("div", {cls:"tx"}, h("b", {}, c.n), h("small", {}, c.d)),
      h("button", {onclick:() => { if (own) SV.sel = id; else if (SV.coins >= c.cost) { SV.coins -= c.cost; SV.chars.push(id); SV.sel = id; } else return; save(); setChar(SV.sel); renderMenu(); }}, sel ? "Đang chọn" : own ? "Chọn" : "💰 " + c.cost)); });
  if (tab === "shop") return Object.entries(UPG).map(([id, [n, d, mx]]) => { const lv = SV.up[id], cost = (id === "rev" ? 600 : 80) * (lv + 1);
    return h("div", {cls:"row"}, h("div", {cls:"tx"}, h("b", {}, `${n} Lv${lv}/${mx}`), h("small", {}, d)), h("button", {onclick:() => { if (lv >= mx || SV.coins < cost) return; SV.coins -= cost; SV.up[id]++; save(); renderMenu(); }}, lv >= mx ? "Tối đa" : "💰 " + cost)); });
  const gift = SV.gift !== today();
  return [h("div", {cls:"row"}, h("div", {cls:"tx"}, h("b", {}, "🎁 Quà mỗi ngày"), h("small", {}, "Quay lại mỗi ngày để nhận xu")), h("button", {onclick:() => { if (!gift) return; SV.gift = today(); SV.coins += 100; save(); renderMenu(); }}, gift ? "Nhận 100 xu" : "Đã nhận")),
    ...MIS.map(([n, f, g, r], i) => { const v = Math.min(f(), g), ok = f() >= g, got = SV.mis.c[i];
      return h("div", {cls:"row"}, h("div", {cls:"tx"}, h("b", {}, n), h("small", {}, `${v}/${g}`)), h("button", {onclick:() => { if (!ok || got) return; SV.mis.c[i] = 1; SV.coins += r; save(); renderMenu(); }}, got ? "Đã nhận" : ok ? `Nhận 💰${r}` : `💰${r}`)); })];
}

// ---------- Hình ảnh mỗi khung ----------
let faceA = 0;
function syncVisuals(dt) {
  if (!P) return; const bob = P.mv ? Math.sin(P.t * 16) * .07 : Math.sin(P.t * 3) * .03, lg = P.mv ? Math.sin(P.t * 16) * .7 : 0;
  playerMesh.position.set(P.x, 0, P.z); playerMesh.visible = !(P.inv > 0 && Math.floor(P.inv * 14) % 2);
  let dA = Math.atan2(P.fz, P.fx) - faceA; dA = Math.atan2(Math.sin(dA), Math.cos(dA)); faceA += dA * Math.min(1, dt * 12);
  R.body.rotation.y = Math.PI / 2 - faceA; R.body.position.y = bob; R.legs[0].rotation.x = lg; R.legs[1].rotation.x = -lg; R.arms.forEach((a, i) => a.rotation.x = (i ? -lg : lg) * .5); R.weapon.rotation.y = Math.PI / 2 - faceA;
  R.cape.rotation.x = .15 + Math.sin(P.t * 10) * .1; R.tails.rotation.y = Math.sin(P.t * 12) * .25;
  for (const e of E) { e.mesh.position.set(e.x, Math.abs(Math.sin(e.w)) * .14, e.z); e.mesh.rotation.y = Math.atan2(P.x - e.x, P.z - e.z); e.mesh.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(e.w * 1.2) * (i ? -.6 : .6));
    const want = e.h > 0 ? 0xffffff : e.boost > 0 ? 0xff5a00 : e.elite ? 0x661010 : 0; if (e.em !== want) { e.em = want; e.mats.forEach(m => { m.emissive.set(want); m.emissiveIntensity = .7; }); } }
  FX.forEach(f => { const v = f.p.clone().project(cam); f.el.style.left = (v.x * .5 + .5) * 100 + "%"; f.el.style.top = (-v.y * .5 + .5) * 100 + "%"; f.el.style.opacity = Math.min(1, f.t * 2); });
  const bs = E.find(e => e.boss); $("bossbar").hidden = !bs; if (bs) $("bossbar").firstElementChild.style.width = Math.max(0, bs.hp / bs.mhp * 100) + "%";
  $("banner").style.opacity = bannerT > 0 && state !== "menu" ? Math.min(1, bannerT) : 0; $("hurt").style.opacity = hurtT * 1.8;
  $("hpf").style.width = Math.max(0, P.hp / P.max * 100) + "%"; $("hpt").textContent = Math.max(0, Math.ceil(P.hp)) + "/" + P.max; $("xpf").style.width = Math.min(100, P.xp / P.need * 100) + "%";
  $("lvl").textContent = "Lv " + P.lvl; $("tm").textContent = fmt(t); $("kl").textContent = "☠ " + kills; $("cn").textContent = "💰 +" + projCoins();
}
function frame(tt) {
  const dt = Math.min(.05, (tt - last) / 1000); last = tt; if (state === "run") update(dt); if (P) syncVisuals(dt);
  shake = Math.max(0, shake - dt * 40); const px = P ? P.x : 0, pz = P ? P.z : 7, k = Math.min(1, dt * 6);
  camT.x += (clamp(px, -MAXX + 11, MAXX - 11) - camT.x) * k; camT.z += (clamp(pz, -MAXZ + 7, MAXZ - 7) - camT.z) * k;
  sun.position.set(px + 8, 18, pz + 8); sun.target.position.set(px, 0, pz); sun.target.updateMatrixWorld();
  cam.position.set(camT.x + (Math.random() - .5) * shake * .04, 19 + (Math.random() - .5) * shake * .04, camT.z + 14.5); cam.lookAt(camT.x, 0, camT.z - 1);
  composer.render(); drawMini(); requestAnimationFrame(frame);
}
addEventListener("keydown", e => { if (e.target.tagName === "INPUT") return; const k = e.key.toLowerCase(); if (k === "enter" && (state === "menu" || state === "end")) return startRun(); if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault(); keys[k] = true; });
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
box.addEventListener("touchstart", e => { const q = e.touches[0]; jo = {x:q.clientX, y:q.clientY, dx:0, dz:0}; }, {passive:true});
box.addEventListener("touchmove", e => { if (!jo) return; const q = e.touches[0], dx = q.clientX - jo.x, dy = q.clientY - jo.y, l = Math.hypot(dx, dy); jo.dx = l > 8 ? dx / Math.max(l, 50) : 0; jo.dz = l > 8 ? dy / Math.max(l, 50) : 0; }, {passive:true});
box.addEventListener("touchend", () => { jo = null; });

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

window.__d = {get P() { return P; }, get E() { return E; }, get state() { return state; }, startRun, lvUp: () => { P.xp = P.need; }};
composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam));
bloom = new UnrealBloomPass(new THREE.Vector2(box.clientWidth || 2, box.clientHeight || 2), .16, .5, .9); composer.addPass(bloom); composer.addPass(new OutputPass());
resize();
setChar(SV.sel); renderMenu(); loadBoard(); requestAnimationFrame(frame);
