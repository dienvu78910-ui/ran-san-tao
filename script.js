import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
// Ảnh của game nằm trong assets/anh*.json (tách ra để mỗi tệp nhỏ hơn 25 MB khi đẩy lên GitHub)
const IP = await (async () => { const L = ['./anh1.json','./anh2.json','./anh3.json','./anh4.json'];
  const err = msg => { const d = document.createElement("div"); d.style.cssText = "position:fixed;inset:20px;z-index:99;background:#2b1b3d;color:#fff;padding:24px;border-radius:16px;font:16px/1.5 sans-serif;overflow:auto"; d.innerHTML = msg; document.body.append(d); };
  if (location.protocol === "file:") { err("<b>Không mở trực tiếp index.html được.</b><br>Hãy mở game qua đường link GitHub Pages (Settings → Pages), hoặc dùng bản APK."); throw new Error("file://"); }
  try { return (await Promise.all(L.map(async u => { let r = await fetch(new URL(u, import.meta.url)); if (!r.ok) r = await fetch(new URL(u.replace("./assets/", "./"), import.meta.url)); if (!r.ok) throw new Error(u + " (" + r.status + ")"); return r.json(); }))).flat(); }
  catch (e) { err("<b>Không tải được ảnh của game.</b><br>Thiếu tệp: " + e.message + "<br><br>Kiểm tra trên GitHub: tệp <b>anh1.json</b> và <b>anh2.json</b> phải nằm cùng chỗ với index.html và script.js."); throw e; }
})();

// Firebase chỉ được tải khi đã có cấu hình thật -> game vẫn chạy khi offline hoặc thiếu firebase-config.js
const FB_VER = "10.12.2";
const loadFirebaseConfig = () => import("./firebase-config.js").then(m => m.firebaseConfig).catch(() => null);

const COL = "lop_truong_scores";
const SPR = {"laptop":{uri:IP[0],a:240/98,pw:240,ph:98},"tire":{uri:IP[1],a:220/167,pw:220,ph:167},"chao":{uri:IP[2],a:256/169,pw:256,ph:169},"dep":{uri:IP[3],a:256/176,pw:256,ph:176},"maytinh":{uri:IP[4],a:300/252,pw:300,ph:252},"sung":{uri:IP[5],a:380/118,pw:380,ph:118},"cung":{uri:IP[6],a:220/275,pw:220,ph:275},"bo_tor":{uri:IP[7],a:150/155,pw:150,ph:155},"bo_hd":{uri:IP[8],a:130/135,pw:130,ph:135},"bo_ua":{uri:IP[9],a:40/90,pw:40,ph:90},"bo_fa":{uri:IP[10],a:36/92,pw:36,ph:92},"bo_th":{uri:IP[11],a:52/115,pw:52,ph:115},"bo_sh":{uri:IP[12],a:46/105,pw:46,ph:105},"bo_ft":{uri:IP[13],a:66/40,pw:66,ph:40},"me_tor":{uri:IP[14],a:150/190,pw:150,ph:190},"me_hd":{uri:IP[15],a:130/135,pw:130,ph:135},"me_ua":{uri:IP[16],a:40/90,pw:40,ph:90},"me_fa":{uri:IP[17],a:36/92,pw:36,ph:92},"me_th":{uri:IP[18],a:52/115,pw:52,ph:115},"me_sh":{uri:IP[19],a:46/105,pw:46,ph:105},"me_ft":{uri:IP[20],a:66/40,pw:66,ph:40},"anh_tor":{uri:IP[21],a:150/155,pw:150,ph:155},"anh_hd":{uri:IP[22],a:130/135,pw:130,ph:135},"anh_ua":{uri:IP[23],a:40/90,pw:40,ph:90},"anh_fa":{uri:IP[24],a:36/92,pw:36,ph:92},"anh_th":{uri:IP[25],a:52/115,pw:52,ph:115},"anh_sh":{uri:IP[26],a:46/105,pw:46,ph:105},"anh_ft":{uri:IP[27],a:66/40,pw:66,ph:40}};
Object.assign(SPR, {"can":{"uri":IP[28],"a":0.559,"pw":200,"ph":358},"binh":{"uri":IP[29],"a":0.559,"pw":200,"ph":358},"but":{"uri":IP[30],"a":0.927,"pw":200,"ph":216}});
// Ảnh động từng khung (sprite sheet): hàng 0 = đi bộ, 1 = tấn công, 2 = đứng yên; cw/ch = kích thước ô, fh = chiều cao nhân vật (px)
const ANIM = {"lop":{"uri":IP[31],"cw":174,"ch":178,"cols":8,"rows":5,"n":{"walk":8,"atk":6,"idle":4,"gun":4,"bow":4},"fh":170,"face":IP[32]},"bo":{"uri":IP[33],"cw":199,"ch":178,"cols":8,"rows":5,"n":{"walk":8,"atk":6,"idle":4,"gun":4,"bow":4},"fh":170,"face":IP[34]},"me":{"uri":IP[35],"cw":177,"ch":188,"cols":8,"rows":5,"n":{"walk":8,"atk":6,"idle":4,"gun":4,"bow":4},"fh":170,"face":IP[36]},"anh":{"uri":IP[37],"cw":182,"ch":181,"cols":8,"rows":5,"n":{"walk":8,"atk":6,"idle":4,"gun":4,"bow":4},"fh":170,"face":IP[38]},"ban":{"uri":IP[39],"cw":219,"ch":179,"cols":8,"rows":5,"n":{"walk":8,"atk":6,"idle":4,"gun":4,"bow":4},"fh":170,"face":IP[40]},"hot":{"uri":IP[41],"cw":198,"ch":177,"cols":8,"rows":5,"n":{"walk":8,"atk":6,"idle":4,"gun":4,"bow":4},"fh":170,"face":IP[42]},"gym":{"uri":IP[43],"cw":202,"ch":184,"cols":8,"rows":5,"n":{"walk":8,"atk":6,"idle":4,"gun":4,"bow":4},"fh":170,"face":IP[44]}};
// Khung hình hiệu ứng: chớp nòng (4), đạn (1), tia lửa khi trúng (4), mũi tên thường/vàng (2), lông vũ khi trúng (4)
const FXI = {"muzzle":[{"uri":IP[45],"a":1.213},{"uri":IP[46],"a":1.732},{"uri":IP[47],"a":1.384},{"uri":IP[48],"a":1.467}],"bullet":[{"uri":IP[49],"a":2.75}],"hit":[{"uri":IP[50],"a":1.14},{"uri":IP[51],"a":1.618},{"uri":IP[52],"a":1.467},{"uri":IP[53],"a":1.196}],"arrow":[{"uri":IP[54],"a":3.607},{"uri":IP[55],"a":3.59}],"feather":[{"uri":IP[56],"a":1.172},{"uri":IP[57],"a":1.517},{"uri":IP[58],"a":1.457},{"uri":IP[59],"a":1.438}],"bolt":[{"uri":IP[60],"a":0.557},{"uri":IP[61],"a":0.748},{"uri":IP[62],"a":0.613},{"uri":IP[63],"a":0.496}],"zap":[{"uri":IP[64],"a":1.752},{"uri":IP[65],"a":1.611},{"uri":IP[66],"a":1.727},{"uri":IP[67],"a":1.558}],"heart":[{"uri":IP[68],"a":2.76},{"uri":IP[69],"a":2.424}],"heartboom":[{"uri":IP[70],"a":1.099},{"uri":IP[71],"a":1.36},{"uri":IP[72],"a":1.349},{"uri":IP[73],"a":1.428}],"shock":[{"uri":IP[74],"a":1.36},{"uri":IP[75],"a":1.469},{"uri":IP[76],"a":1.739},{"uri":IP[77],"a":1.667}],"ezap":[{"uri":IP[78],"a":1.318},{"uri":IP[79],"a":1.463},{"uri":IP[80],"a":1.455},{"uri":IP[81],"a":1.51}],"poof":[{"uri":IP[82],"a":1.115}],"pillar":[{"uri":IP[83],"a":1.191}],"chest":[{"uri":IP[84],"a":1.205}],"gem":[{"uri":IP[85],"a":1.159}],"elop_p":[{"uri":IP[86],"a":1.477},{"uri":IP[87],"a":1.325},{"uri":IP[88],"a":1.236},{"uri":IP[89],"a":1.264}],"elop_t":[{"uri":IP[90],"a":1.705},{"uri":IP[91],"a":1.803},{"uri":IP[92],"a":1.774},{"uri":IP[93],"a":1.93}],"elop_i":[{"uri":IP[94],"a":1.35},{"uri":IP[95],"a":1.257},{"uri":IP[96],"a":1.189},{"uri":IP[97],"a":1.202}],"elop_a":[{"uri":IP[98],"a":1.073},{"uri":IP[99],"a":1.078},{"uri":IP[100],"a":1.073},{"uri":IP[101],"a":1.053}],"edep_p":[{"uri":IP[102],"a":1.618},{"uri":IP[103],"a":1.538},{"uri":IP[104],"a":1.325},{"uri":IP[105],"a":1.507}],"edep_t":[{"uri":IP[106],"a":1.692},{"uri":IP[107],"a":2.037},{"uri":IP[108],"a":2.133},{"uri":IP[109],"a":1.486}],"edep_i":[{"uri":IP[110],"a":1.272},{"uri":IP[111],"a":1.243},{"uri":IP[112],"a":1.401},{"uri":IP[113],"a":1.571}],"edep_a":[{"uri":IP[114],"a":1.17},{"uri":IP[115],"a":1.176},{"uri":IP[116],"a":1.128},{"uri":IP[117],"a":1.14}],"echao_p":[{"uri":IP[118],"a":1.325},{"uri":IP[119],"a":1.122},{"uri":IP[120],"a":1.089},{"uri":IP[121],"a":1.128}],"echao_t":[{"uri":IP[122],"a":1.667},{"uri":IP[123],"a":1.897},{"uri":IP[124],"a":2.418},{"uri":IP[125],"a":2.388}],"echao_i":[{"uri":IP[126],"a":1.427},{"uri":IP[127],"a":1.507},{"uri":IP[128],"a":1.438},{"uri":IP[129],"a":1.528}],"echao_a":[{"uri":IP[130],"a":1.038},{"uri":IP[131],"a":1.063},{"uri":IP[132],"a":1.038},{"uri":IP[133],"a":1.063}],"esung_p":[{"uri":IP[134],"a":1.667},{"uri":IP[135],"a":1.447},{"uri":IP[136],"a":1.31},{"uri":IP[137],"a":1.366}],"esung_t":[{"uri":IP[138],"a":1.803},{"uri":IP[139],"a":1.88},{"uri":IP[140],"a":2.115},{"uri":IP[141],"a":2.476}],"esung_i":[{"uri":IP[142],"a":1.241},{"uri":IP[143],"a":1.215},{"uri":IP[144],"a":2.619},{"uri":IP[144],"a":2.619}],"esung_a":[{"uri":IP[145],"a":1.053},{"uri":IP[146],"a":1.089},{"uri":IP[147],"a":1.122},{"uri":IP[148],"a":1.048}],"ecung_p":[{"uri":IP[149],"a":1.667},{"uri":IP[150],"a":1.438},{"uri":IP[151],"a":1.341},{"uri":IP[152],"a":1.549}],"ecung_t":[{"uri":IP[153],"a":1.833},{"uri":IP[154],"a":2.0},{"uri":IP[155],"a":2.075},{"uri":IP[156],"a":2.235}],"ecung_i":[{"uri":IP[157],"a":1.268},{"uri":IP[158],"a":1.31},{"uri":IP[159],"a":1.401},{"uri":IP[160],"a":1.667}],"ecung_a":[{"uri":IP[161],"a":1.058},{"uri":IP[162],"a":1.053},{"uri":IP[163],"a":1.058},{"uri":IP[164],"a":1.058}],"etim_p":[{"uri":IP[165],"a":1.571},{"uri":IP[166],"a":1.56},{"uri":IP[167],"a":1.549},{"uri":IP[168],"a":1.618}],"etim_t":[{"uri":IP[169],"a":1.76},{"uri":IP[170],"a":2.0},{"uri":IP[171],"a":2.018},{"uri":IP[172],"a":1.99}],"etim_i":[{"uri":IP[173],"a":1.172},{"uri":IP[174],"a":1.25},{"uri":IP[175],"a":1.311},{"uri":IP[176],"a":1.237}],"etim_a":[{"uri":IP[177],"a":1.068},{"uri":IP[178],"a":1.068},{"uri":IP[179],"a":1.089},{"uri":IP[180],"a":1.084}],"eset_p":[{"uri":IP[181],"a":1.507},{"uri":IP[182],"a":1.571},{"uri":IP[183],"a":1.642},{"uri":IP[184],"a":1.594}],"eset_t":[{"uri":IP[185],"a":1.982},{"uri":IP[186],"a":2.075},{"uri":IP[187],"a":2.095},{"uri":IP[188],"a":2.124}],"eset_i":[{"uri":IP[189],"a":0.923},{"uri":IP[190],"a":1.146},{"uri":IP[191],"a":1.325},{"uri":IP[192],"a":1.384}],"eset_a":[{"uri":IP[193],"a":1.117},{"uri":IP[194],"a":1.068},{"uri":IP[195],"a":1.084},{"uri":IP[196],"a":1.128}],"esong_p":[{"uri":IP[197],"a":1.384},{"uri":IP[198],"a":1.507},{"uri":IP[199],"a":1.447},{"uri":IP[200],"a":1.447}],"esong_t":[{"uri":IP[201],"a":1.897},{"uri":IP[202],"a":2.009},{"uri":IP[203],"a":1.971},{"uri":IP[204],"a":1.839}],"esong_i":[{"uri":IP[205],"a":1.07},{"uri":IP[206],"a":1.17},{"uri":IP[207],"a":1.236},{"uri":IP[208],"a":1.294}],"esong_a":[{"uri":IP[209],"a":0.995},{"uri":IP[210],"a":1.019},{"uri":IP[211],"a":1.014},{"uri":IP[212],"a":1.033}],"ebinh_p":[{"uri":IP[213],"a":1.375},{"uri":IP[214],"a":1.31},{"uri":IP[215],"a":1.215},{"uri":IP[216],"a":1.366}],"ebinh_t":[{"uri":IP[217],"a":1.705},{"uri":IP[218],"a":1.964},{"uri":IP[219],"a":3.929},{"uri":IP[219],"a":3.929}],"ebinh_i":[{"uri":IP[220],"a":1.197},{"uri":IP[221],"a":1.215},{"uri":IP[221],"a":1.215},{"uri":IP[222],"a":2.268}],"ebinh_a":[{"uri":IP[223],"a":1.048},{"uri":IP[224],"a":1.048},{"uri":IP[225],"a":1.073},{"uri":IP[226],"a":1.084}],"ebut_p":[{"uri":IP[227],"a":1.746},{"uri":IP[228],"a":1.594},{"uri":IP[229],"a":1.477},{"uri":IP[230],"a":1.732}],"ebut_t":[{"uri":IP[231],"a":1.63},{"uri":IP[232],"a":1.719},{"uri":IP[233],"a":1.779},{"uri":IP[234],"a":1.188}],"ebut_i":[{"uri":IP[235],"a":1.048},{"uri":IP[236],"a":1.243},{"uri":IP[237],"a":1.243},{"uri":IP[238],"a":1.325}],"ebut_a":[{"uri":IP[239],"a":1.005},{"uri":IP[240],"a":1.023},{"uri":IP[241],"a":1.053},{"uri":IP[242],"a":1.028}]};
// Yêu quái dạng ảnh động: hàng 0 = 8 khung di chuyển, hàng 1 = trúng đòn, bị hạ (ảnh vẽ quay mặt sang trái)
const FOEA = {"vosi":{"uri":IP[243],"cw":110,"ch":156,"cols":8,"n":8,"fh":150},"ptv":{"uri":IP[244],"cw":121,"ch":156,"cols":8,"n":8,"fh":150}};
// Ảnh bản đồ, mặt tiền tòa nhà, cổng, nền menu, dãy núi; TREES/POOL đo từ ảnh mặt sân
const IMG = {"ground":{"uri":IP[245]},"tower":{"uri":IP[246],"a":0.5045},"wing":{"uri":IP[247],"a":3.5256},"lect":{"uri":IP[248],"a":1.9763},"gate":{"uri":IP[249],"a":2.2959},"pano":{"uri":IP[250]},"mount":{"uri":IP[251]}};
const MAPS = {"lib":{"top":IP[252],"pano":IP[253],"edge":"#41192a"},"dorm":{"top":IP[254],"pano":IP[255],"edge":"#8f6d84"},"tran":{"top":IP[256],"pano":IP[257],"edge":"#387858"}};
const MAP_TREES = [[-27.9, -16.76], [-27.9, -10.81], [-27.9, 1.37], [-27.89, -4.82], [-22.42, -16.76], [-22.42, -10.81], [-22.42, -4.81], [-22.42, 1.36], [-16.94, -16.76], [-16.94, -10.8], [-16.94, -4.82], [-16.94, 1.36], [16.91, -16.76], [16.92, -10.81], [16.92, -4.82], [16.92, 1.36], [22.4, -4.82], [22.4, 1.36], [22.41, -16.76], [22.41, -10.8], [27.89, -16.76], [27.89, -4.81], [27.9, -10.81], [27.9, 1.36]], MAP_POOL = [-13.08, 13.04, -10.74, -6.9];
// v10: ảnh vũ khí mới, 19 bộ hiệu ứng, Sếp 3 hướng, đồ vật bản đồ, chân dung Lốp Trưởng
Object.assign(SPR, {"tire":{"uri":IP[258],"a":0.902,"pw":231,"ph":256},"dep":{"uri":IP[259],"a":1.274,"pw":256,"ph":201},"chao":{"uri":IP[260],"a":1.213,"pw":256,"ph":211},"laptop":{"uri":IP[261],"a":1.954,"pw":256,"ph":131},"sung":{"uri":IP[262],"a":1.855,"pw":256,"ph":138},"cung":{"uri":IP[263],"a":0.629,"pw":161,"ph":256},"binh":{"uri":IP[264],"a":0.426,"pw":109,"ph":256},"but":{"uri":IP[265],"a":1.076,"pw":256,"ph":238},"thuoc":{"uri":IP[266],"a":1.196,"pw":256,"ph":214},"o":{"uri":IP[267],"a":0.957,"pw":245,"ph":256},"mic":{"uri":IP[268],"a":0.652,"pw":167,"ph":256},"the":{"uri":IP[269],"a":1.0,"pw":256,"ph":256},"blaster":{"uri":IP[270],"a":1.133,"pw":256,"ph":226}});
Object.assign(FXI, {"elap_p":[{"uri":IP[271],"a":1.56},{"uri":IP[272],"a":1.63},{"uri":IP[273],"a":1.56},{"uri":IP[274],"a":1.542}],"elap_t":[{"uri":IP[275],"a":1.457},{"uri":IP[276],"a":1.333},{"uri":IP[277],"a":2.095},{"uri":IP[278],"a":2.301}],"elap_i":[{"uri":IP[279],"a":1.392},{"uri":IP[280],"a":1.25},{"uri":IP[281],"a":1.317},{"uri":IP[282],"a":1.401}],"elap_a":[{"uri":IP[283],"a":1.594},{"uri":IP[284],"a":1.564},{"uri":IP[285],"a":1.594},{"uri":IP[286],"a":1.599}],"ethuoc_p":[{"uri":IP[287],"a":2.018},{"uri":IP[288],"a":1.818},{"uri":IP[289],"a":1.732},{"uri":IP[290],"a":1.93}],"ethuoc_t":[{"uri":IP[291],"a":1.719},{"uri":IP[292],"a":1.146},{"uri":IP[293],"a":1.117},{"uri":IP[294],"a":2.529}],"ethuoc_i":[{"uri":IP[295],"a":1.419},{"uri":IP[296],"a":1.507},{"uri":IP[297],"a":1.507},{"uri":IP[298],"a":1.679}],"ethuoc_a":[{"uri":IP[299],"a":1.325},{"uri":IP[300],"a":1.366},{"uri":IP[301],"a":1.358},{"uri":IP[302],"a":1.358}],"eo_p":[{"uri":IP[303],"a":1.236},{"uri":IP[304],"a":1.236},{"uri":IP[305],"a":1.272},{"uri":IP[306],"a":1.25}],"eo_t":[{"uri":IP[307],"a":1.264},{"uri":IP[308],"a":2.391},{"uri":IP[309],"a":2.651},{"uri":IP[310],"a":2.487}],"eo_i":[{"uri":IP[311],"a":1.401},{"uri":IP[312],"a":1.438},{"uri":IP[313],"a":1.447},{"uri":IP[314],"a":1.679}],"eo_a":[{"uri":IP[315],"a":1.325},{"uri":IP[316],"a":1.294},{"uri":IP[317],"a":1.325},{"uri":IP[318],"a":1.325}],"emic_p":[{"uri":IP[319],"a":1.341},{"uri":IP[320],"a":1.35},{"uri":IP[321],"a":1.31},{"uri":IP[322],"a":1.325}],"emic_t":[{"uri":IP[323],"a":1.507},{"uri":IP[324],"a":1.419},{"uri":IP[325],"a":1.411},{"uri":IP[326],"a":1.431}],"emic_i":[{"uri":IP[327],"a":1.209},{"uri":IP[328],"a":1.264},{"uri":IP[329],"a":1.317},{"uri":IP[330],"a":1.366}],"emic_a":[{"uri":IP[331],"a":1.264},{"uri":IP[332],"a":1.31},{"uri":IP[333],"a":1.375},{"uri":IP[334],"a":1.272}],"ethe_p":[{"uri":IP[335],"a":1.864},{"uri":IP[336],"a":1.818},{"uri":IP[337],"a":1.571},{"uri":IP[338],"a":1.606}],"ethe_t":[{"uri":IP[339],"a":1.302},{"uri":IP[340],"a":1.35},{"uri":IP[341],"a":1.964},{"uri":IP[342],"a":2.291}],"ethe_i":[{"uri":IP[343],"a":1.31},{"uri":IP[344],"a":1.257},{"uri":IP[345],"a":1.317},{"uri":IP[346],"a":1.571}],"ethe_a":[{"uri":IP[347],"a":1.477},{"uri":IP[348],"a":1.404},{"uri":IP[349],"a":1.46},{"uri":IP[350],"a":1.447}],"enonla_p":[{"uri":IP[351],"a":1.517},{"uri":IP[352],"a":1.401},{"uri":IP[353],"a":1.467},{"uri":IP[354],"a":1.486}],"enonla_t":[{"uri":IP[355],"a":2.075},{"uri":IP[356],"a":2.366},{"uri":IP[357],"a":2.418},{"uri":IP[358],"a":2.817}],"enonla_i":[{"uri":IP[359],"a":1.366},{"uri":IP[360],"a":1.429},{"uri":IP[361],"a":1.486},{"uri":IP[362],"a":1.667}],"enonla_a":[{"uri":IP[363],"a":1.375},{"uri":IP[364],"a":1.375},{"uri":IP[365],"a":1.375},{"uri":IP[366],"a":1.41}],"equat_p":[{"uri":IP[367],"a":1.327},{"uri":IP[368],"a":1.111},{"uri":IP[369],"a":1.146},{"uri":IP[370],"a":1.189}],"equat_t":[{"uri":IP[371],"a":1.229},{"uri":IP[372],"a":1.068},{"uri":IP[373],"a":0.927},{"uri":IP[374],"a":1.894}],"equat_i":[{"uri":IP[375],"a":1.31},{"uri":IP[376],"a":1.302},{"uri":IP[377],"a":1.294},{"uri":IP[378],"a":1.31}],"equat_a":[{"uri":IP[379],"a":1.196},{"uri":IP[380],"a":1.158},{"uri":IP[381],"a":1.146},{"uri":IP[382],"a":1.152}],"eam_p":[{"uri":IP[383],"a":1.279},{"uri":IP[384],"a":1.158},{"uri":IP[385],"a":1.158},{"uri":IP[386],"a":1.279}],"eam_t":[{"uri":IP[387],"a":1.089},{"uri":IP[388],"a":1.202},{"uri":IP[389],"a":1.164},{"uri":IP[390],"a":2.83}],"eam_i":[{"uri":IP[391],"a":1.279},{"uri":IP[392],"a":1.294},{"uri":IP[393],"a":1.76},{"uri":IP[394],"a":2.2}],"eam_a":[{"uri":IP[395],"a":1.222},{"uri":IP[396],"a":1.236},{"uri":IP[397],"a":1.279},{"uri":IP[398],"a":1.317}],"elau_p":[{"uri":IP[399],"a":1.507},{"uri":IP[400],"a":1.35},{"uri":IP[401],"a":1.341},{"uri":IP[402],"a":1.392}],"elau_t":[{"uri":IP[403],"a":1.63},{"uri":IP[404],"a":2.0},{"uri":IP[405],"a":2.292},{"uri":IP[406],"a":2.256}],"elau_i":[{"uri":IP[407],"a":1.333},{"uri":IP[408],"a":1.517},{"uri":IP[409],"a":1.667},{"uri":IP[410],"a":1.789}],"elau_a":[{"uri":IP[411],"a":1.366},{"uri":IP[412],"a":1.264},{"uri":IP[413],"a":1.294},{"uri":IP[414],"a":1.25}],"ecaplong_p":[{"uri":IP[415],"a":1.486},{"uri":IP[416],"a":1.477},{"uri":IP[417],"a":1.477},{"uri":IP[418],"a":1.358}],"ecaplong_t":[{"uri":IP[419],"a":1.507},{"uri":IP[420],"a":2.558},{"uri":IP[421],"a":3.099},{"uri":IP[422],"a":3.86}],"ecaplong_i":[{"uri":IP[423],"a":1.279},{"uri":IP[424],"a":1.287},{"uri":IP[425],"a":1.429},{"uri":IP[426],"a":1.467}],"ecaplong_a":[{"uri":IP[427],"a":1.089},{"uri":IP[428],"a":1.128},{"uri":IP[429],"a":1.158},{"uri":IP[430],"a":1.14}],"esach_p":[{"uri":IP[431],"a":1.457},{"uri":IP[432],"a":1.358},{"uri":IP[433],"a":1.325},{"uri":IP[434],"a":1.25}],"esach_t":[{"uri":IP[435],"a":2.056},{"uri":IP[436],"a":2.472},{"uri":IP[437],"a":1.243},{"uri":IP[438],"a":3.929}],"esach_i":[{"uri":IP[439],"a":1.375},{"uri":IP[440],"a":1.517},{"uri":IP[441],"a":1.685},{"uri":IP[442],"a":1.982}],"esach_a":[{"uri":IP[443],"a":1.419},{"uri":IP[444],"a":1.429},{"uri":IP[445],"a":1.384},{"uri":IP[446],"a":1.429}],"eden_p":[{"uri":IP[447],"a":1.654},{"uri":IP[448],"a":1.618},{"uri":IP[449],"a":1.549},{"uri":IP[450],"a":1.447}],"eden_t":[{"uri":IP[451],"a":1.467},{"uri":IP[452],"a":2.2},{"uri":IP[453],"a":2.268},{"uri":IP[454],"a":2.296}],"eden_i":[{"uri":IP[455],"a":1.457},{"uri":IP[456],"a":1.35},{"uri":IP[457],"a":1.467},{"uri":IP[458],"a":1.719}],"eden_a":[{"uri":IP[459],"a":1.375},{"uri":IP[460],"a":1.272},{"uri":IP[461],"a":1.317},{"uri":IP[462],"a":1.294}],"emu_p":[{"uri":IP[463],"a":1.294},{"uri":IP[464],"a":1.571},{"uri":IP[465],"a":1.76},{"uri":IP[466],"a":1.921}],"emu_t":[{"uri":IP[467],"a":1.538},{"uri":IP[468],"a":2.245},{"uri":IP[469],"a":2.268},{"uri":IP[470],"a":2.829}],"emu_i":[{"uri":IP[471],"a":1.325},{"uri":IP[472],"a":1.272},{"uri":IP[473],"a":1.447},{"uri":IP[474],"a":1.606}],"emu_a":[{"uri":IP[475],"a":1.447},{"uri":IP[476],"a":1.429},{"uri":IP[477],"a":1.447},{"uri":IP[478],"a":1.401}],"eao_p":[{"uri":IP[479],"a":1.594},{"uri":IP[480],"a":1.467},{"uri":IP[481],"a":1.419},{"uri":IP[482],"a":1.48}],"eao_t":[{"uri":IP[483],"a":2.157},{"uri":IP[484],"a":2.292},{"uri":IP[485],"a":2.5},{"uri":IP[486],"a":1.989}],"eao_i":[{"uri":IP[487],"a":1.294},{"uri":IP[488],"a":1.401},{"uri":IP[489],"a":1.528},{"uri":IP[490],"a":1.654}],"eao_a":[{"uri":IP[491],"a":1.222},{"uri":IP[492],"a":1.302},{"uri":IP[493],"a":1.294},{"uri":IP[494],"a":1.287}],"eloa_p":[{"uri":IP[495],"a":1.517},{"uri":IP[496],"a":1.429},{"uri":IP[497],"a":1.384},{"uri":IP[498],"a":1.447}],"eloa_t":[{"uri":IP[499],"a":1.333},{"uri":IP[500],"a":1.287},{"uri":IP[501],"a":1.302},{"uri":IP[502],"a":0.941}],"eloa_i":[{"uri":IP[503],"a":1.341},{"uri":IP[504],"a":1.341},{"uri":IP[505],"a":1.341},{"uri":IP[506],"a":1.341}],"eloa_a":[{"uri":IP[507],"a":1.325},{"uri":IP[508],"a":1.457},{"uri":IP[509],"a":1.333},{"uri":IP[510],"a":1.333}],"eguitar_p":[{"uri":IP[511],"a":1.571},{"uri":IP[512],"a":1.441},{"uri":IP[513],"a":1.41},{"uri":IP[514],"a":1.45}],"eguitar_t":[{"uri":IP[515],"a":1.538},{"uri":IP[516],"a":1.0},{"uri":IP[517],"a":0.886},{"uri":IP[518],"a":0.714}],"eguitar_i":[{"uri":IP[519],"a":1.654},{"uri":IP[520],"a":1.789},{"uri":IP[521],"a":1.864},{"uri":IP[522],"a":1.964}],"eguitar_a":[{"uri":IP[523],"a":1.31},{"uri":IP[524],"a":1.325},{"uri":IP[525],"a":1.41},{"uri":IP[526],"a":1.317}],"ebutmuc_p":[{"uri":IP[527],"a":1.25},{"uri":IP[528],"a":1.243},{"uri":IP[529],"a":1.229},{"uri":IP[530],"a":1.244}],"ebutmuc_t":[{"uri":IP[531],"a":1.594},{"uri":IP[532],"a":1.134},{"uri":IP[533],"a":1.068},{"uri":IP[534],"a":1.548}],"ebutmuc_i":[{"uri":IP[535],"a":1.106},{"uri":IP[536],"a":1.375},{"uri":IP[537],"a":1.642},{"uri":IP[538],"a":2.018}],"ebutmuc_a":[{"uri":IP[539],"a":1.21},{"uri":IP[540],"a":1.134},{"uri":IP[541],"a":1.164},{"uri":IP[542],"a":1.209}],"esen_p":[{"uri":IP[543],"a":1.41},{"uri":IP[544],"a":1.507},{"uri":IP[545],"a":1.507},{"uri":IP[546],"a":1.341}],"esen_t":[{"uri":IP[547],"a":1.447},{"uri":IP[548],"a":1.507},{"uri":IP[549],"a":1.507},{"uri":IP[550],"a":1.25}],"esen_i":[{"uri":IP[551],"a":1.507},{"uri":IP[552],"a":1.507},{"uri":IP[553],"a":1.507},{"uri":IP[554],"a":1.384}],"esen_a":[{"uri":IP[555],"a":1.196},{"uri":IP[556],"a":1.401},{"uri":IP[557],"a":1.507},{"uri":IP[558],"a":1.287}],"edrone_p":[{"uri":IP[559],"a":1.384},{"uri":IP[560],"a":1.257},{"uri":IP[561],"a":1.375},{"uri":IP[562],"a":1.366}],"edrone_t":[{"uri":IP[563],"a":1.477},{"uri":IP[564],"a":1.864},{"uri":IP[565],"a":1.833},{"uri":IP[566],"a":2.0}],"edrone_i":[{"uri":IP[567],"a":1.333},{"uri":IP[568],"a":1.341},{"uri":IP[569],"a":1.457},{"uri":IP[570],"a":1.571}],"edrone_a":[{"uri":IP[571],"a":1.279},{"uri":IP[572],"a":1.146},{"uri":IP[573],"a":1.264},{"uri":IP[574],"a":1.264}]});
const DIR3 = Object.assign({"p_lop":[{"uri":IP[575],"a":0.526},{"uri":IP[576],"a":0.193},{"uri":IP[577],"a":0.521}],"p_bo":[{"uri":IP[578],"a":0.698},{"uri":IP[579],"a":0.283},{"uri":IP[580],"a":0.7}],"p_me":[{"uri":IP[581],"a":0.583},{"uri":IP[582],"a":0.233},{"uri":IP[583],"a":0.581}],"p_anh":[{"uri":IP[584],"a":0.569},{"uri":IP[585],"a":0.181},{"uri":IP[586],"a":0.567}],"p_ban":[{"uri":IP[587],"a":0.564},{"uri":IP[588],"a":0.212},{"uri":IP[589],"a":0.564}],"p_hot":[{"uri":IP[590],"a":0.569},{"uri":IP[591],"a":0.167},{"uri":IP[592],"a":0.564}],"p_gym":[{"uri":IP[593],"a":0.664},{"uri":IP[594],"a":0.217},{"uri":IP[595],"a":0.667}],"nhan":[{"uri":IP[596],"a":0.621},{"uri":IP[597],"a":0.576},{"uri":IP[598],"a":0.597}],"hot":[{"uri":IP[599],"a":0.685},{"uri":IP[600],"a":0.521},{"uri":IP[601],"a":0.679}],"gym":[{"uri":IP[602],"a":0.718},{"uri":IP[603],"a":0.418},{"uri":IP[604],"a":0.712}],"phuthuy":[{"uri":IP[605],"a":0.6},{"uri":IP[606],"a":0.526},{"uri":IP[607],"a":0.597}],"qua":[{"uri":IP[608],"a":1.288},{"uri":IP[609],"a":0.868},{"uri":IP[610],"a":1.279}],"batuoc":[{"uri":IP[611],"a":0.544},{"uri":IP[612],"a":0.4},{"uri":IP[613],"a":0.562}],"lon":[{"uri":IP[614],"a":0.579},{"uri":IP[615],"a":0.547},{"uri":IP[616],"a":0.574}],"boss":[{"uri":IP[617],"a":0.785},{"uri":IP[618],"a":0.479},{"uri":IP[619],"a":0.809}],"nuhoang":[{"uri":IP[620],"a":0.759},{"uri":IP[621],"a":0.388},{"uri":IP[622],"a":0.759}],"final":[{"uri":IP[623],"a":0.774},{"uri":IP[624],"a":0.518},{"uri":IP[625],"a":0.753}],"mi":[{"uri":IP[626],"a":0.768},{"uri":IP[627],"a":0.621},{"uri":IP[628],"a":0.771}],"robot":[{"uri":IP[629],"a":0.753},{"uri":IP[630],"a":0.406},{"uri":IP[631],"a":0.744}],"wifi":[{"uri":IP[632],"a":0.835},{"uri":IP[633],"a":0.4},{"uri":IP[634],"a":0.835}],"rua":[{"uri":IP[635],"a":0.882},{"uri":IP[636],"a":1.553},{"uri":IP[637],"a":0.676}]}, {sep:[{"uri":IP[638],"a":0.545},{"uri":IP[639],"a":0.53},{"uri":IP[640],"a":0.56}]});
Object.assign(SPR, {"w_nonla":{"uri":IP[641],"a":1.062,"pw":256,"ph":241},"w_quat":{"uri":IP[642],"a":0.703,"pw":180,"ph":256},"w_am":{"uri":IP[643],"a":0.875,"pw":224,"ph":256},"w_lau":{"uri":IP[644],"a":0.906,"pw":232,"ph":256},"w_caplong":{"uri":IP[645],"a":0.695,"pw":178,"ph":256},"w_sach":{"uri":IP[646],"a":0.988,"pw":253,"ph":256},"w_den":{"uri":IP[647],"a":0.695,"pw":178,"ph":256},"w_mu":{"uri":IP[648],"a":1.08,"pw":256,"ph":237},"w_ao":{"uri":IP[649],"a":0.734,"pw":188,"ph":256},"w_loa":{"uri":IP[650],"a":0.562,"pw":144,"ph":256},"w_guitar":{"uri":IP[651],"a":0.875,"pw":224,"ph":256},"w_butmuc":{"uri":IP[652],"a":1.18,"pw":256,"ph":217},"w_sen":{"uri":IP[653],"a":0.891,"pw":228,"ph":256},"w_drone":{"uri":IP[654],"a":1.407,"pw":256,"ph":182}});
Object.assign(FXI, {"r_dien":[{"uri":IP[655],"a":1.446},{"uri":IP[656],"a":1.951},{"uri":IP[657],"a":1.304},{"uri":IP[658],"a":0.946},{"uri":IP[659],"a":1.154},{"uri":IP[660],"a":1.094}],"r_bang":[{"uri":IP[661],"a":1.311},{"uri":IP[662],"a":2.087},{"uri":IP[663],"a":1.579},{"uri":IP[664],"a":1.137},{"uri":IP[665],"a":1.116},{"uri":IP[666],"a":1.269}],"r_vobang":[{"uri":IP[667],"a":1.324},{"uri":IP[668],"a":2.034},{"uri":IP[669],"a":1.633},{"uri":IP[670],"a":1.0},{"uri":IP[671],"a":1.404},{"uri":IP[672],"a":1.237}],"r_loclua":[{"uri":IP[673],"a":1.372},{"uri":IP[674],"a":1.983},{"uri":IP[675],"a":1.379},{"uri":IP[676],"a":1.004},{"uri":IP[677],"a":1.257},{"uri":IP[678],"a":0.963}],"r_noc":[{"uri":IP[679],"a":4.0},{"uri":IP[680],"a":1.86},{"uri":IP[681],"a":1.311},{"uri":IP[682],"a":0.917},{"uri":IP[683],"a":1.218},{"uri":IP[684],"a":1.382}],"r_nhat":[{"uri":IP[685],"a":1.522},{"uri":IP[686],"a":2.034},{"uri":IP[687],"a":1.611},{"uri":IP[688],"a":1.067},{"uri":IP[689],"a":1.548},{"uri":IP[690],"a":2.069}],"r_sen":[{"uri":IP[691],"a":1.167},{"uri":IP[692],"a":1.752},{"uri":IP[693],"a":1.348},{"uri":IP[694],"a":1.086},{"uri":IP[695],"a":1.106},{"uri":IP[696],"a":1.257}],"r_diachan":[{"uri":IP[697],"a":1.618},{"uri":IP[698],"a":2.143},{"uri":IP[699],"a":1.491},{"uri":IP[700],"a":0.925},{"uri":IP[701],"a":1.404},{"uri":IP[702],"a":1.392}]});
Object.assign(MAPS, {"lib":{"top":IP[703],"pano":IP[704],"edge":"#622b18"},"dorm":{"top":IP[705],"pano":IP[706],"edge":"#534f5e"},"quang":{"top":IP[707],"pano":IP[708],"edge":"#7d787a"},"san":{"top":IP[709],"pano":IP[708],"edge":"#77372b"},"lab":{"top":IP[710],"pano":IP[711],"edge":"#547d7d"}});
ANIM.bo.face = IP[712];
ANIM.me.face = IP[713];
ANIM.anh.face = IP[714];
ANIM.ban.face = IP[715];
ANIM.hot.face = IP[716];
ANIM.gym.face = IP[717];
{ const f = ANIM.lop.face; ANIM.lop = {"uri":IP[718],"cw":257,"ch":184,"cols":6,"rows":7,"n":{"walk":6,"atk":6,"idle":4,"gun":4,"bow":4,"hurt":6,"dead":6},"fh":170,"v2":1}; ANIM.lop.face = f; }
Object.assign(FOEA, {"vosi":{"uri":IP[719],"cw":232,"ch":164,"cols":6,"n":6,"fh":150,"v2":1},"ptv":{"uri":IP[720],"cw":222,"ch":159,"cols":6,"n":6,"fh":150,"v2":1},"sep":{"uri":IP[721],"cw":223,"ch":161,"cols":6,"n":6,"fh":150,"v2":1}});
delete DIR3.sep; // Sếp dùng sheet động tác đầy đủ
{ const f = ANIM.lop.face; ANIM.lop = {"uri":IP[722],"cw":332,"ch":235,"cols":6,"rows":12,"n":{"walk":6,"atk":6,"idle":6,"gun":6,"bow":6,"hurt":6,"dead":6,"front":6,"back":6,"throw2":6,"roll":6,"win":6},"fh":170,"v2":1,"rel":0.3,"noB":0}; ANIM.lop.face = f; }
{ const f = ANIM.ban.face; ANIM.ban = {"uri":IP[723],"cw":264,"ch":185,"cols":6,"rows":12,"n":{"walk":6,"atk":6,"idle":6,"gun":6,"bow":6,"hurt":6,"dead":6,"front":6,"back":6,"throw2":6,"roll":6,"win":6},"fh":170,"v2":1,"rel":0.23,"noB":0}; ANIM.ban.face = f; }
{ const f = ANIM.hot.face; ANIM.hot = {"uri":IP[724],"cw":285,"ch":196,"cols":6,"rows":12,"n":{"walk":6,"atk":6,"idle":6,"gun":6,"bow":6,"hurt":6,"dead":6,"front":6,"back":6,"throw2":6,"roll":6,"win":6},"fh":170,"v2":1,"rel":0.23,"noB":0}; ANIM.hot.face = f; }
{ const f = ANIM.gym.face; ANIM.gym = {"uri":IP[725],"cw":228,"ch":186,"cols":6,"rows":12,"n":{"walk":6,"atk":6,"idle":6,"gun":6,"bow":6,"hurt":6,"dead":6,"front":6,"back":6,"throw2":6,"roll":6,"win":6},"fh":170,"v2":1,"rel":0.23,"noB":0}; ANIM.gym.face = f; }
{ const f = ANIM.bo.face; ANIM.bo = {"uri":IP[726],"cw":298,"ch":197,"cols":6,"rows":12,"n":{"walk":6,"atk":6,"idle":6,"gun":6,"bow":6,"hurt":6,"dead":6,"front":6,"back":6,"throw2":6,"roll":6,"win":6},"fh":170,"v2":1,"rel":0.23,"noB":0}; ANIM.bo.face = f; }
{ const f = ANIM.me.face; ANIM.me = {"uri":IP[727],"cw":214,"ch":181,"cols":6,"rows":12,"n":{"walk":6,"atk":6,"idle":6,"gun":6,"bow":6,"hurt":6,"dead":6,"front":6,"back":6,"throw2":6,"roll":6,"win":6},"fh":170,"v2":1,"rel":0.23,"noB":0}; ANIM.me.face = f; }
{ const f = ANIM.anh.face; ANIM.anh = {"uri":IP[728],"cw":358,"ch":196,"cols":6,"rows":12,"n":{"walk":6,"atk":6,"idle":6,"gun":6,"bow":6,"hurt":6,"dead":6,"front":6,"back":6,"throw2":6,"roll":6,"win":6},"fh":170,"v2":1,"rel":0.23,"noB":0}; ANIM.anh.face = f; }
Object.assign(FOEA, {"nhan":{"uri":IP[729],"cw":248,"ch":178,"cols":6,"n":6,"fh":150,"v2":1},"hot":{"uri":IP[730],"cw":251,"ch":186,"cols":6,"n":6,"fh":150,"v2":1},"gym":{"uri":IP[731],"cw":172,"ch":160,"cols":6,"n":6,"fh":150,"v2":1},"phuthuy":{"uri":IP[732],"cw":258,"ch":161,"cols":6,"n":6,"fh":150,"v2":1},"qua":{"uri":IP[733],"cw":396,"ch":203,"cols":6,"n":6,"fh":150,"v2":1},"batuoc":{"uri":IP[734],"cw":217,"ch":159,"cols":6,"n":6,"fh":150,"v2":1},"lon":{"uri":IP[735],"cw":251,"ch":181,"cols":6,"n":6,"fh":150,"v2":1},"boss":{"uri":IP[736],"cw":253,"ch":160,"cols":6,"n":6,"fh":150,"v2":1},"final":{"uri":IP[737],"cw":286,"ch":171,"cols":6,"n":6,"fh":150,"v2":1},"nuhoang":{"uri":IP[738],"cw":223,"ch":162,"cols":6,"n":6,"fh":150,"v2":1},"mi":{"uri":IP[739],"cw":241,"ch":164,"cols":6,"n":6,"fh":150,"v2":1},"robot":{"uri":IP[740],"cw":257,"ch":166,"cols":6,"n":6,"fh":150,"v2":1},"wifi":{"uri":IP[741],"cw":302,"ch":162,"cols":6,"n":6,"fh":150,"v2":1},"rua":{"uri":IP[742],"cw":229,"ch":176,"cols":6,"n":6,"fh":150,"v2":1}});
["nhan","hot","gym","phuthuy","qua","batuoc","lon","boss","final","nuhoang","mi","robot","wifi","rua"].forEach(k => delete DIR3[k]); // yêu quái đã có sheet động tác đầy đủ
MAPS.cong = {"top":IP[743],"pano":IP[744],"edge":"#8f8f96"};
const PROP = {"sac":{"uri":IP[745],"a":0.998},"khung":{"uri":IP[746],"a":1.495},"cayn":{"uri":IP[747],"a":0.352},"coc":{"uri":IP[748],"a":0.762},"ghe":{"uri":IP[749],"a":1.232},"bang":{"uri":IP[750],"a":1.053},"xe":{"uri":IP[751],"a":0.995},"cot":{"uri":IP[752],"a":0.505},"quang":{"uri":IP[753],"a":1.21},"ghenhua":{"uri":IP[754],"a":0.9},"sapo":{"uri":IP[755],"a":0.988},"thuyen":{"uri":IP[756],"a":1.538},"bonsen":{"uri":IP[757],"a":1.329},"dahoc":{"uri":IP[758],"a":0.845},"liu":{"uri":IP[759],"a":0.988},"nhu":{"uri":IP[760],"a":0.607},"lua":{"uri":IP[761],"a":0.376},"da":{"uri":IP[762],"a":1.243},"be":{"uri":IP[763],"a":0.998},"nam":{"uri":IP[764],"a":0.79}};
ANIM.lop.face = IP[765];


// ===================== v15: QUÁI PIXEL TOÀN BỘ, SÀN + CẢNH NỀN + ĐỒ VẬT PIXEL 5 CHƯƠNG =====================
Object.assign(FOEA, {"phuthuy":{"uri":IP[766],"cw":64,"ch":64,"fh":46,"cols":6,"n":6,"v2":1,"px":1},"qua":{"uri":IP[767],"cw":64,"ch":64,"fh":40,"cols":6,"n":6,"v2":1,"px":1},"batuoc":{"uri":IP[768],"cw":64,"ch":64,"fh":53,"cols":6,"n":6,"v2":1,"px":1},"lon":{"uri":IP[769],"cw":64,"ch":64,"fh":48,"cols":6,"n":6,"v2":1,"px":1},"boss":{"uri":IP[770],"cw":64,"ch":64,"fh":51,"cols":6,"n":6,"v2":1,"px":1},"final":{"uri":IP[771],"cw":64,"ch":64,"fh":50,"cols":6,"n":6,"v2":1,"px":1},"nuhoang":{"uri":IP[772],"cw":64,"ch":64,"fh":48,"cols":6,"n":6,"v2":1,"px":1},"mi":{"uri":IP[773],"cw":64,"ch":64,"fh":40,"cols":6,"n":6,"v2":1,"px":1},"robot":{"uri":IP[774],"cw":64,"ch":64,"fh":49,"cols":6,"n":6,"v2":1,"px":1},"wifi":{"uri":IP[775],"cw":64,"ch":64,"fh":42,"cols":6,"n":6,"v2":1,"px":1},"rua":{"uri":IP[776],"cw":64,"ch":64,"fh":48,"cols":6,"n":6,"v2":1,"px":1},"vosi":{"uri":IP[777],"cw":64,"ch":64,"fh":53,"cols":6,"n":6,"v2":1,"px":1},"ptv":{"uri":IP[778],"cw":64,"ch":64,"fh":56,"cols":6,"n":6,"v2":1,"px":1},"sep":{"uri":IP[779],"cw":64,"ch":64,"fh":53,"cols":6,"n":6,"v2":1,"px":1}});
Object.assign(PROP, {"q_cong_cong":{"uri":IP[780],"a":1.771,"px":1},"q_cong_caylon":{"uri":IP[781],"a":1.291,"px":1},"q_cong_caynho":{"uri":IP[782],"a":1.152,"px":1},"q_cong_den":{"uri":IP[783],"a":0.32,"px":1},"q_cong_ghe":{"uri":IP[784],"a":1.667,"px":1},"q_cong_chau":{"uri":IP[785],"a":1.064,"px":1},"q_cong_xemay":{"uri":IP[786],"a":2.196,"px":1},"q_lib_ke":{"uri":IP[787],"a":0.767,"px":1},"q_lib_ban":{"uri":IP[788],"a":1.361,"px":1},"q_lib_thienc":{"uri":IP[789],"a":0.648,"px":1},"q_lib_xesach":{"uri":IP[790],"a":1.038,"px":1},"q_lib_cayla":{"uri":IP[791],"a":0.8,"px":1},"q_lib_binhsen":{"uri":IP[792],"a":0.833,"px":1},"q_dorm_ro":{"uri":IP[793],"a":0.58,"px":1},"q_dorm_banghe":{"uri":IP[794],"a":1.494,"px":1},"q_dorm_giaphoi":{"uri":IP[795],"a":1.045,"px":1},"q_dorm_thungrac":{"uri":IP[796],"a":0.733,"px":1},"q_dorm_xe":{"uri":IP[797],"a":1.009,"px":1},"q_dorm_hoagiay":{"uri":IP[798],"a":1.204,"px":1},"q_tran_do":{"uri":IP[799],"a":1.587,"px":1},"q_tran_congda":{"uri":IP[800],"a":1.027,"px":1},"q_tran_liu":{"uri":IP[801],"a":0.983,"px":1},"q_tran_nonbo":{"uri":IP[802],"a":0.796,"px":1},"q_tran_chausen":{"uri":IP[803],"a":0.848,"px":1},"q_tran_den":{"uri":IP[804],"a":0.849,"px":1}});
{ const F = {"cong":IP[805],"lib":IP[806],"dorm":IP[807],"quang":IP[808],"tranwall":IP[809]}, N = {"cong":IP[810],"lib":IP[811],"dorm":IP[812],"tran":IP[813],"quang":IP[814]};
  for (const k of ["cong", "lib", "dorm", "quang"]) { MAPS[k].top = F[k]; MAPS[k].px = 1; } for (const k in N) MAPS[k].pano = N[k]; IMG.pano.uri = MAPS.cong.pano; }
const DG_WALLTEX_OLD = {tran:IP[815]};
const DG_WALLTEX = {"cong":IP[816],"quang":IP[816],"lib":IP[817],"tran":IP[818],"lab":IP[819]};
function dgWallM(ci, wc) { const k = CHAP[ci] && CHAP[ci].map, u = DG_WALLTEX[k]; if (!u) return MK(wc, .85);
  const t = new THREE.TextureLoader().load(u); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(4, 1); t.magFilter = THREE.NearestFilter;
  const m = new THREE.MeshStandardMaterial({map:t, roughness:.9}); m.userData.dg = true; return m; }

// ===================== v16: ĐỒ VẬT 3 CHƯƠNG CUỐI, TƯỜNG/CỬA/RƯƠNG/VẬT PHẨM PIXEL =====================
Object.assign(PROP, {"q_quang_co":{"uri":IP[820],"a":0.68,"px":1},"q_quang_ghe":{"uri":IP[821],"a":1.444,"px":1},"q_quang_den":{"uri":IP[822],"a":0.408,"px":1},"q_quang_bui":{"uri":IP[823],"a":0.802,"px":1},"q_quang_bien":{"uri":IP[824],"a":0.768,"px":1},"q_quang_thung":{"uri":IP[825],"a":1.295,"px":1},"q_san_khung":{"uri":IP[826],"a":1.341,"px":1},"q_san_cabin":{"uri":IP[827],"a":1.489,"px":1},"q_san_dendai":{"uri":IP[828],"a":0.508,"px":1},"q_san_coc":{"uri":IP[829],"a":1.241,"px":1},"q_san_xebong":{"uri":IP[830],"a":1.06,"px":1},"q_san_thung":{"uri":IP[831],"a":0.938,"px":1},"q_lab_tesla":{"uri":IP[832],"a":0.786,"px":1},"q_lab_tu":{"uri":IP[833],"a":0.758,"px":1},"q_lab_server":{"uri":IP[834],"a":0.748,"px":1},"q_lab_ban":{"uri":IP[835],"a":1.347,"px":1},"q_lab_plasma":{"uri":IP[836],"a":0.705,"px":1},"q_lab_xeday":{"uri":IP[837],"a":1.156,"px":1}});
{ const F = {"san":IP[838],"lab":IP[839]}, N = {"san":IP[840],"lab":IP[841]};
  for (const k in F) { MAPS[k].top = F[k]; MAPS[k].px = 1; } for (const k in N) MAPS[k].pano = N[k]; }
const PXI = {"coin":{"uri":IP[842],"a":1.022,"px":1},"gem":{"uri":IP[843],"a":0.659,"px":1},"heart":{"uri":IP[844],"a":1.171,"px":1},"potion":{"uri":IP[845],"a":0.796,"px":1},"key":{"uri":IP[846],"a":0.978,"px":1},"keyg":{"uri":IP[847],"a":0.978,"px":1},"lixi":{"uri":IP[848],"a":1.093,"px":1},"scroll":{"uri":IP[849],"a":1.154,"px":1},"book":{"uri":IP[850],"a":1.047,"px":1},"shield":{"uri":IP[851],"a":0.909,"px":1},"battery":{"uri":IP[852],"a":0.688,"px":1},"ramen":{"uri":IP[853],"a":1.071,"px":1}}, PXD2 = {"wall_cong":{"uri":IP[854],"a":1.038,"px":1},"wall_lib":{"uri":IP[855],"a":1.038,"px":1},"wall_moss":{"uri":IP[856],"a":1.026,"px":1},"wall_lab":{"uri":IP[857],"a":1.026,"px":1},"door_lib":{"uri":IP[858],"a":1.051,"px":1},"door_libo":{"uri":IP[859],"a":1.03,"px":1},"door_lab":{"uri":IP[860],"a":1.129,"px":1},"door_labo":{"uri":IP[861],"a":1.128,"px":1},"chest":{"uri":IP[862],"a":1.2,"px":1},"chesto":{"uri":IP[863],"a":1.0,"px":1},"chestp":{"uri":IP[864],"a":1.212,"px":1},"chestpo":{"uri":IP[865],"a":0.99,"px":1}};
const pxIc = k => h("img", {src:PXI[k].uri, cls:"wic", alt:""});
const PXT = {}; function pxTex(k, src) { if (!PXT[k]) { const t = PXT[k] = new THREE.TextureLoader().load(src || PXD2[k].uri); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; } return PXT[k]; }
function pxSpr(k, hh, x, z, y = 0) { const m = new THREE.Sprite(new THREE.SpriteMaterial({map:pxTex(k), transparent:true, alphaTest:.08})); m.material.userData.dg = true; m.center.set(.5, .02); m.scale.set(hh * PXD2[k].a, hh, 1); m.position.set(x, y, z); return m; }
function pxDoor(hor, px, pz, g, dm) { if (hor) { dm.color.setHex(0xff7a3a); return new THREE.Mesh(g, dm); }
  const lab = ["lab", "quang", "san"].includes(CUR.map); const m = pxSpr(lab ? "door_lab" : "door_lib", 3.4, px, pz); m.scale.x = DG_COR + .6; return m; }
function pxChestOpen(c) { const m = pxSpr(c.purple ? "chestpo" : "chesto", 1.7, c.x, c.z); scene.add(m); FM.push({mesh:m, t:0, dur:1.4, op:1}); }
// ===================== v14: BỘ PIXEL (nhân vật + skin + chân dung, vũ khí, hiệu ứng, quái) =====================
const PXD = {"ch":{"lop":{"uri":IP[866],"cw":64,"ch":64,"fh":58},"ban":{"uri":IP[867],"cw":64,"ch":64,"fh":59},"hot":{"uri":IP[868],"cw":64,"ch":64,"fh":57},"gym":{"uri":IP[869],"cw":64,"ch":64,"fh":57},"bo":{"uri":IP[870],"cw":64,"ch":64,"fh":56},"me":{"uri":IP[871],"cw":64,"ch":64,"fh":55},"anh":{"uri":IP[872],"cw":64,"ch":64,"fh":55},"lop_s1":{"uri":IP[873],"cw":64,"ch":64,"fh":56},"lop_s2":{"uri":IP[874],"cw":64,"ch":64,"fh":58},"lop_s3":{"uri":IP[875],"cw":64,"ch":64,"fh":54},"ban_s1":{"uri":IP[876],"cw":64,"ch":64,"fh":59},"ban_s2":{"uri":IP[877],"cw":64,"ch":64,"fh":60},"ban_s3":{"uri":IP[878],"cw":64,"ch":64,"fh":58},"hot_s1":{"uri":IP[879],"cw":64,"ch":64,"fh":59},"hot_s2":{"uri":IP[880],"cw":64,"ch":64,"fh":57},"hot_s3":{"uri":IP[881],"cw":64,"ch":64,"fh":57},"gym_s1":{"uri":IP[882],"cw":64,"ch":64,"fh":58},"gym_s2":{"uri":IP[883],"cw":64,"ch":64,"fh":59},"gym_s3":{"uri":IP[884],"cw":64,"ch":64,"fh":51},"bo_s1":{"uri":IP[885],"cw":64,"ch":64,"fh":59},"bo_s2":{"uri":IP[886],"cw":64,"ch":64,"fh":60},"bo_s3":{"uri":IP[887],"cw":64,"ch":64,"fh":54},"me_s1":{"uri":IP[888],"cw":64,"ch":64,"fh":58},"me_s2":{"uri":IP[889],"cw":64,"ch":64,"fh":59},"me_s3":{"uri":IP[890],"cw":64,"ch":64,"fh":58},"anh_s1":{"uri":IP[891],"cw":64,"ch":64,"fh":56},"anh_s2":{"uri":IP[892],"cw":64,"ch":64,"fh":55},"anh_s3":{"uri":IP[893],"cw":64,"ch":64,"fh":53}},"foe":{"ghost":{"uri":IP[894],"cw":64,"ch":64,"fh":50},"devil":{"uri":IP[895],"cw":64,"ch":64,"fh":46},"orc":{"uri":IP[896],"cw":64,"ch":64,"fh":48}},"face":{"lop":IP[897],"ban":IP[898],"hot":IP[899],"gym":IP[900],"bo":IP[901],"me":IP[902],"anh":IP[903]}};
const PX_SKIN = {"lop": ["Gốc", "Áo dài Tết", "Hiệp sĩ Lốp Thép", "Thánh Gióng"], "ban": ["Gốc", "Áo dài Trắng", "Thần Tình Yêu", "Tiên Nữ Hoa Sen"], "hot": ["Gốc", "Ngôi Sao Ca Nhạc", "Ninja Đêm", "Lôi Thần"], "gym": ["Gốc", "Võ Sĩ Vovinam", "Đô Vật Làng", "Sơn Tinh"], "bo": ["Gốc", "Bố Đi Câu", "Bác Bảo Vệ", "Thổ Địa"], "me": ["Gốc", "Áo Bà Ba", "Đầu Bếp Trưởng", "Bà Chúa Bếp Lửa"], "anh": ["Gốc", "Tay Đua", "Lập Trình Viên", "Rồng Công Nghệ"]}, PX_TIER = ["Gốc", "Thường", "Sự kiện", "Huyền thoại"];
// sheet pixel 4 hàng x 6 khung: đứng, chạy, tung chiêu, trúng đòn + gục. Mỗi động tác của game lấy khung từ đây.
const PX_FM = (() => { const r = (row, cs) => cs.map(c => [row, c]), s = [0, 1, 2, 3, 4, 5];
  return {walk:r(1, s), idle:r(0, s), atk:r(2, s), gun:r(2, [4, 4, 5, 5, 4, 5]), bow:r(2, [4, 4, 5, 5, 4, 5]), throw2:r(0, [1, 2, 3, 3, 4, 5]), hurt:r(3, [0, 1, 1, 2, 2, 2]),
    dead:r(3, [2, 3, 4, 4, 5, 5]), front:r(1, s), back:r(1, s), roll:r(1, [0, 2, 4, 0, 2, 4]), win:r(2, [2, 3, 3, 2, 4, 5])}; })();
const PXC = {};
for (const k of Object.keys(PX_SKIN)) { PXC[k] = [k, k + "_s1", k + "_s2", k + "_s3"].map((n, i) => { const d = PXD.ch[n];
  return {uri:d.uri, cw:d.cw, ch:d.ch, cols:6, rows:4, fh:d.fh, n:{walk:6, atk:6, idle:6, gun:6, bow:6, hurt:6, dead:6, front:0, back:0, throw2:6, roll:6, win:6}, v2:1, px:1, fm:PX_FM, rel:.23, noB:0, face:PXD.face[k], sk:i}; });
  ANIM[k] = PXC[k][0]; }
function pxApply(id) { const k = CH[id] && CH[id].anim; if (k && PXC[k]) ANIM[k] = PXC[k][(SV.skin && SV.skin[k]) || 0]; }
// quái chương 1 vẽ lại kiểu pixel
[["nhan", "ghost"], ["hot", "devil"], ["gym", "orc"]].forEach(([k, n]) => { const d = PXD.foe[n]; FOEA[k] = {uri:d.uri, cw:d.cw, ch:d.ch, cols:6, n:6, fh:d.fh, v2:1, px:1}; });
// vũ khí pixel (icon + cầm tay) và hiệu ứng pixel
Object.assign(SPR, {"px_kiem_thuoc":{"uri":IP[904],"a":3.5185,"px":1,"pw":100,"ph":28.4},"px_ma_tau":{"uri":IP[905],"a":3.7308,"px":1,"pw":100,"ph":26.8},"px_bua_dinh":{"uri":IP[906],"a":1.7069,"px":1,"pw":100,"ph":58.6},"px_kiem_tre":{"uri":IP[907],"a":3.6296,"px":1,"pw":100,"ph":27.6},"px_song_dao":{"uri":IP[908],"a":1.2436,"px":1,"pw":100,"ph":80.4},"px_yen_nguyet":{"uri":IP[909],"a":2.4474,"px":1,"pw":100,"ph":40.9},"px_thuong_tre":{"uri":IP[910],"a":3.8333,"px":1,"pw":100,"ph":26.1},"px_bua_ta":{"uri":IP[911],"a":1.7963,"px":1,"pw":100,"ph":55.7},"px_bua_sam":{"uri":IP[912],"a":1.7273,"px":1,"pw":100,"ph":57.9},"px_gay":{"uri":IP[913],"a":5.1053,"px":1,"pw":100,"ph":19.6},"px_con":{"uri":IP[914],"a":9.8,"px":1,"pw":100,"ph":10.2},"px_quat":{"uri":IP[915],"a":0.9072,"px":1,"pw":100,"ph":110.2},"px_choi":{"uri":IP[916],"a":2.6286,"px":1,"pw":100,"ph":38.0},"px_thuan_thien":{"uri":IP[917],"a":2.5676,"px":1,"pw":100,"ph":38.9},"px_lop":{"uri":IP[918],"a":0.9901,"px":1,"pw":100,"ph":101.0},"px_dep":{"uri":IP[919],"a":2.1395,"px":1,"pw":100,"ph":46.7},"px_chao":{"uri":IP[920],"a":2.0204,"px":1,"pw":100,"ph":49.5},"px_laptop":{"uri":IP[921],"a":1.8654,"px":1,"pw":100,"ph":53.6},"px_sung_lua":{"uri":IP[922],"a":2.0217,"px":1,"pw":100,"ph":49.5},"px_cung":{"uri":IP[923],"a":0.8602,"px":1,"pw":100,"ph":116.3},"px_binh_bang":{"uri":IP[924],"a":2.4103,"px":1,"pw":100,"ph":41.5},"px_but_laser":{"uri":IP[925],"a":5.75,"px":1,"pw":100,"ph":17.4},"px_sung_nuoc":{"uri":IP[926],"a":1.4328,"px":1,"pw":100,"ph":69.8},"px_phao_hoa":{"uri":IP[927],"a":2.8182,"px":1,"pw":100,"ph":35.5}});
["tire:lop", "dep:dep", "chao:chao", "laptop:laptop", "sung:sung_lua", "cung:cung", "binh:binh_bang", "but:but_laser"].forEach(p => { const [a, b] = p.split(":"); SPR[a] = SPR["px_" + b]; });
const PXHELD = {throw:"px_lop", slipper:"px_dep", pan:"px_chao", laptop:"px_laptop", gun:"px_sung_lua", bow:"px_cung", thermos:"px_binh_bang", pen:"px_but_laser", phaohoa:"px_phao_hoa"};
SPR.px_phao_hoa = {"px":1,"uri": IP[928], "a": 2.2683};
Object.assign(FXI, {"px_lop_kn1":[{"uri":IP[929],"a":1.0248},{"uri":IP[930],"a":1.0248},{"uri":IP[931],"a":1.0248},{"uri":IP[932],"a":1.0248},{"uri":IP[933],"a":1.0248},{"uri":IP[934],"a":1.0248}],"px_lop_kn2":[{"uri":IP[935],"a":0.9785},{"uri":IP[936],"a":0.9785},{"uri":IP[937],"a":0.9785},{"uri":IP[938],"a":0.9785},{"uri":IP[939],"a":0.9785},{"uri":IP[940],"a":0.9785}],"px_ban_kn1":[{"uri":IP[941],"a":0.8586},{"uri":IP[942],"a":0.8586},{"uri":IP[943],"a":0.8586},{"uri":IP[944],"a":0.8586},{"uri":IP[945],"a":0.8586},{"uri":IP[946],"a":0.8586}],"px_ban_kn2":[{"uri":IP[947],"a":0.8797},{"uri":IP[948],"a":0.8797},{"uri":IP[949],"a":0.8797},{"uri":IP[950],"a":0.8797},{"uri":IP[951],"a":0.8797},{"uri":IP[952],"a":0.8797}],"px_hot_kn1":[{"uri":IP[953],"a":0.7845},{"uri":IP[954],"a":0.7845},{"uri":IP[955],"a":0.7845},{"uri":IP[956],"a":0.7845},{"uri":IP[957],"a":0.7845},{"uri":IP[958],"a":0.7845}],"px_hot_kn2":[{"uri":IP[959],"a":1.3196},{"uri":IP[960],"a":1.3196},{"uri":IP[961],"a":1.3196},{"uri":IP[962],"a":1.3196},{"uri":IP[963],"a":1.3196},{"uri":IP[964],"a":1.3196}],"px_gym_kn1":[{"uri":IP[965],"a":1.1562},{"uri":IP[966],"a":1.1562},{"uri":IP[967],"a":1.1562},{"uri":IP[968],"a":1.1562},{"uri":IP[969],"a":1.1562},{"uri":IP[970],"a":1.1562}],"px_gym_kn2":[{"uri":IP[971],"a":0.7752},{"uri":IP[972],"a":0.7752},{"uri":IP[973],"a":0.7752},{"uri":IP[974],"a":0.7752},{"uri":IP[975],"a":0.7752},{"uri":IP[976],"a":0.7752}],"px_bo_kn1":[{"uri":IP[977],"a":1.2645},{"uri":IP[978],"a":1.2645},{"uri":IP[979],"a":1.2645},{"uri":IP[980],"a":1.2645},{"uri":IP[981],"a":1.2645},{"uri":IP[982],"a":1.2645}],"px_bo_kn2":[{"uri":IP[983],"a":0.7008},{"uri":IP[984],"a":0.7008},{"uri":IP[985],"a":0.7008},{"uri":IP[986],"a":0.7008},{"uri":IP[987],"a":0.7008},{"uri":IP[988],"a":0.7008}],"px_me_kn1":[{"uri":IP[989],"a":1.0901},{"uri":IP[990],"a":1.0901},{"uri":IP[991],"a":1.0901},{"uri":IP[992],"a":1.0901},{"uri":IP[993],"a":1.0901},{"uri":IP[994],"a":1.0901}],"px_me_kn2":[{"uri":IP[995],"a":1.2241},{"uri":IP[996],"a":1.2241},{"uri":IP[997],"a":1.2241},{"uri":IP[998],"a":1.2241},{"uri":IP[999],"a":1.2241},{"uri":IP[1000],"a":1.2241}],"px_anh_kn1":[{"uri":IP[1001],"a":0.9881},{"uri":IP[1002],"a":0.9881},{"uri":IP[1003],"a":0.9881},{"uri":IP[1004],"a":0.9881},{"uri":IP[1005],"a":0.9881},{"uri":IP[1006],"a":0.9881}],"px_anh_kn2":[{"uri":IP[1007],"a":0.5541},{"uri":IP[1008],"a":0.5541},{"uri":IP[1009],"a":0.5541},{"uri":IP[1010],"a":0.5541},{"uri":IP[1011],"a":0.5541},{"uri":IP[1012],"a":0.5541}],"px_chem_kiem":[{"uri":IP[1013],"a":1.3023},{"uri":IP[1014],"a":1.3023},{"uri":IP[1015],"a":1.3023},{"uri":IP[1016],"a":1.3023},{"uri":IP[1017],"a":1.3023},{"uri":IP[1018],"a":1.3023}],"px_dap_bua":[{"uri":IP[1019],"a":1.2358},{"uri":IP[1020],"a":1.2358},{"uri":IP[1021],"a":1.2358},{"uri":IP[1022],"a":1.2358},{"uri":IP[1023],"a":1.2358},{"uri":IP[1024],"a":1.2358}],"px_quet_dao":[{"uri":IP[1025],"a":1.2597},{"uri":IP[1026],"a":1.2597},{"uri":IP[1027],"a":1.2597},{"uri":IP[1028],"a":1.2597},{"uri":IP[1029],"a":1.2597},{"uri":IP[1030],"a":1.2597}],"px_dam_thuong":[{"uri":IP[1031],"a":1.3537},{"uri":IP[1032],"a":1.3537},{"uri":IP[1033],"a":1.3537},{"uri":IP[1034],"a":1.3537},{"uri":IP[1035],"a":1.3537},{"uri":IP[1036],"a":1.3537}],"px_song_dao":[{"uri":IP[1037],"a":1.2222},{"uri":IP[1038],"a":1.2222},{"uri":IP[1039],"a":1.2222},{"uri":IP[1040],"a":1.2222},{"uri":IP[1041],"a":1.2222},{"uri":IP[1042],"a":1.2222}],"px_xoay_con":[{"uri":IP[1043],"a":1.011},{"uri":IP[1044],"a":1.011},{"uri":IP[1045],"a":1.011},{"uri":IP[1046],"a":1.011},{"uri":IP[1047],"a":1.011},{"uri":IP[1048],"a":1.011}],"px_set_bua":[{"uri":IP[1049],"a":1.2542},{"uri":IP[1050],"a":1.2542},{"uri":IP[1051],"a":1.2542},{"uri":IP[1052],"a":1.2542},{"uri":IP[1053],"a":1.2542},{"uri":IP[1054],"a":1.2542}],"px_thuan_thien":[{"uri":IP[1055],"a":1.0444},{"uri":IP[1056],"a":1.0444},{"uri":IP[1057],"a":1.0444},{"uri":IP[1058],"a":1.0444},{"uri":IP[1059],"a":1.0444},{"uri":IP[1060],"a":1.0444}],"px_trung_don":[{"uri":IP[1061],"a":1.21},{"uri":IP[1062],"a":1.21},{"uri":IP[1063],"a":1.21},{"uri":IP[1064],"a":1.21},{"uri":IP[1065],"a":1.21},{"uri":IP[1066],"a":1.21}],"px_dan_lua":[{"uri":IP[1067],"a":1.5238},{"uri":IP[1068],"a":1.5238},{"uri":IP[1069],"a":1.5238},{"uri":IP[1070],"a":1.5238},{"uri":IP[1071],"a":1.5238},{"uri":IP[1072],"a":1.5238}],"px_phao_hoa":[{"uri":IP[1073],"a":1.1963},{"uri":IP[1074],"a":1.1963},{"uri":IP[1075],"a":1.1963},{"uri":IP[1076],"a":1.1963},{"uri":IP[1077],"a":1.1963},{"uri":IP[1078],"a":1.1963}],"px_nhat_vat":[{"uri":IP[1079],"a":0.5986},{"uri":IP[1080],"a":0.5986},{"uri":IP[1081],"a":0.5986},{"uri":IP[1082],"a":0.5986},{"uri":IP[1083],"a":0.5986},{"uri":IP[1084],"a":0.5986}]});
FXI.muzzle = [{"uri":IP[1085],"a":1.5909},{"uri":IP[1086],"a":0.9815}]; FXI.bullet = [{"uri":IP[1087],"a":2.2432}];
FXI.ephao_i = FXI.px_phao_hoa; FXI.ephao_p = [{"uri":IP[1088],"a":1.1744}]; FXI.ephao_t = [{"uri":IP[1089],"a":1.5273}];
for (const k of Object.keys(FXI)) if (k.startsWith("px_") || k === "muzzle" || k === "bullet" || k.startsWith("ephao")) FXI[k].px = 1;
const $ = id => document.getElementById(id), box = $("cv"), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FB = (async () => {
  try {
    const cfg = await loadFirebaseConfig();
    if (!cfg || !cfg.apiKey || cfg.apiKey.startsWith("DAN_")) return null;
    const [app, fs] = await Promise.all([import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`), import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore.js`)]);
    return {...fs, db: fs.getFirestore(app.initializeApp(cfg))};
  } catch (err) { console.warn("Không khởi tạo được Firebase:", err); return null; }
})();
const errText = err => (err && (err.code || err.message)) || "lỗi không rõ";

// ---------- Engine 3D ----------
const APP = !!window.__APP || /[?&]app\b/.test(location.search) || (matchMedia("(pointer: coarse)").matches && Math.min(innerWidth, innerHeight) < 600); if (APP) document.body.classList.add("appmode");
const TOUCH = APP || matchMedia("(pointer: coarse)").matches;
const LOW = matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency || 8) <= 4; // máy yếu / điện thoại
const renderer = new THREE.WebGLRenderer({antialias:!LOW, powerPreference:"high-performance"});
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .86;
box.append(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xbfe3f2); scene.fog = new THREE.Fog(0xdcefe6, 45, 95);
const cam = new THREE.PerspectiveCamera(42, 1.5, .5, 120);
let composer = null, bloom = null;
function resize() { const w = box.clientWidth, h = box.clientHeight; renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 2)); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); } }
new ResizeObserver(resize).observe(box); resize();
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
const hemi = new THREE.HemisphereLight(0xffffff, 0x7a6a8a, .6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.4); sun.position.set(8, 18, 8); sun.castShadow = true; sun.shadow.mapSize.setScalar(LOW ? 1024 : 2048);
Object.assign(sun.shadow.camera, {left:-22, right:22, top:16, bottom:-16, near:1, far:50}); sun.shadow.bias = -.0004; scene.add(sun, sun.target); const fill = new THREE.DirectionalLight(0x9fc4ff, .7); fill.position.set(-8, 10, -6); scene.add(fill);
const SPR_TEX = {};
function sprMap(key, flip) {
  const k = key + (flip ? "_f" : "");
  if (!SPR_TEX[k]) { const t = new THREE.TextureLoader().load(SPR[key].uri); t.colorSpace = THREE.SRGBColorSpace; if (SPR[key].px) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; } if (flip) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; } SPR_TEX[k] = t; }
  return SPR_TEX[k];
}
// Billboard: ảnh luôn quay về camera; đổi bên trái/phải theo hướng nhìn (face(true) = nhìn trái)
function facingSprite(key, w, cy = 0, tmp = false) {
  const g = new THREE.Group();
  const mk2 = flip => { const mt = new THREE.SpriteMaterial({map: sprMap(key, flip), transparent: true, alphaTest: .05, depthWrite: false}); if (tmp) tmpMat(mt); const sp = new THREE.Sprite(mt); sp.center.set(.5, cy); sp.scale.set(w, w / SPR[key].a, 1); return sp; };
  const r = mk2(false), l = mk2(true); l.visible = false; g.add(r, l);
  g.userData.face = left => { r.visible = !left; l.visible = left; }; return g;
}
function noiseCanvas(size, amount, seed = 1) {
  const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d"); const d = x.createImageData(size, size);
  let r = seed; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (rnd() - .5) * amount; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const BUMP_ASPHALT = noiseCanvas(256, 90, 7), BUMP_CONCRETE = noiseCanvas(256, 60, 11), BUMP_METAL = noiseCanvas(128, 40, 3);
const M = (c, r = .6, m = 0) => new THREE.MeshStandardMaterial({color:c, roughness:r, metalness:m});
// Bộ nhớ đệm hình khối: các lời gọi giống tham số dùng chung 1 geometry (tránh rò rỉ bộ nhớ GPU khi sinh hàng nghìn kẻ địch)
const GEO = new Map(), geo = (key, make) => { let g = GEO.get(key); if (!g) { g = make(); GEO.set(key, g); } return g; };
const SP = (r, w = 18, h = 12) => geo(`sp${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h)), CY = (a, b, h, s = 18) => geo(`cy${a},${b},${h},${s}`, () => new THREE.CylinderGeometry(a, b, h, s)), BX = (a, b, c) => geo(`bx${a},${b},${c}`, () => new THREE.BoxGeometry(a, b, c));
// Giải phóng vật liệu riêng của một đối tượng tạm (hiệu ứng, đạn); geometry trong bộ đệm được giữ lại
const tmpMat = m => (m.userData.tmp = true, m);
function dropFx(o) { scene.remove(o); o.traverse(m => { if (m.material && m.material.userData.tmp) m.material.dispose(); if (m.geometry && m.geometry.userData.own) m.geometry.dispose(); }); }
function dropFoe(e) { scene.remove(e.mesh); e.mats.forEach(m => m.dispose()); }
const MC = new Map(), MK = (c, r = .6, m = 0) => { const k = c + "," + r + "," + m; let x = MC.get(k); if (!x) { x = new THREE.MeshStandardMaterial({color:c, roughness:r, metalness:m}); x.userData.keep = true; MC.set(k, x); } return x; };
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
// ---------- Bản đồ: Trường Đại học Hoa Lư (dựng theo ảnh cơ sở mới, đường Xuân Thành, Ninh Bình) ----------
// Phía bắc: nhà hiệu bộ 9 tầng màu trắng, đế 2 tầng sơn đỏ; hai dãy nhà 2 tầng hai bên, tầng trệt vòm đỏ, mái ngói xanh ngọc.
// Giữa: quảng trường lát đá với các ô cỏ trồng cây thẳng hàng, bể nước dài ở trung tâm. Phía nam: đường lớn, cổng trắng - đỏ, hàng rào đỏ trắng.
let FLAG = null;
function textTex(lines, w, h, bg, fg, font = "800 64px Nunito, sans-serif") {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle"; x.font = font;
  lines.forEach((l, i) => x.fillText(l, w / 2, h * (i + 1) / (lines.length + 1)));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const TREE_GRID = MAP_TREES; // vị trí cây đo từ ảnh mặt sân
const POOL = {x:(MAP_POOL[0] + MAP_POOL[1]) / 2, z:(MAP_POOL[2] + MAP_POOL[3]) / 2, w:MAP_POOL[1] - MAP_POOL[0] + 1.3, d:MAP_POOL[3] - MAP_POOL[2] + 1.3};
const imgTex = (k, srgb = true) => { const t = new THREE.TextureLoader().load(IMG[k].uri); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const groundTex = imgTex("ground"); // ảnh phác họa mặt sân nhìn từ trên xuống
const ground = new THREE.Mesh(new THREE.PlaneGeometry(64, 48), M(0xffffff, .85)); ground.material.map = groundTex; ground.material.bumpMap = BUMP_CONCRETE; ground.material.bumpScale = .25; ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const outer = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M(0x8fb877, 1)); outer.rotation.x = -Math.PI / 2; outer.position.y = -.4; outer.receiveShadow = true; scene.add(outer);
const CAMPUS_N0 = scene.children.length; // từ đây trở xuống là vật thể riêng của khuôn viên chương 1
// hàng rào đỏ - trắng (cột trắng, tấm đỏ) như ảnh thật
const fenceTex = (() => { const c = document.createElement("canvas"); c.width = 128; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#c8102e"; x.fillRect(0, 0, 128, 64); x.fillStyle = "#f7f4ee"; x.fillRect(0, 0, 18, 64); x.fillRect(0, 54, 128, 10); x.fillStyle = "rgba(255,255,255,.18)"; for (let i = 26; i < 128; i += 14) x.fillRect(i, 6, 4, 46);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t; })();
function fence(x, z, w, d) { const len = Math.max(w, d), t = fenceTex.clone(); t.needsUpdate = true; t.repeat.x = len / 3; const m = new THREE.MeshStandardMaterial({map:t, roughness:.7}); const b = mk(BX(w, 1.5, d), m, x, .75, z, scene); b.receiveShadow = true; }
fence(0, -22, 61, .35); fence(-30, 0, .35, 45); fence(30, 0, .35, 45); fence(-18.5, 22, 23, .35); fence(18.5, 22, 23, .35);
const leafM = [M(0x3f9e4a, .8), M(0x58b85c, .8)], trunkM = M(0x8a5a3a, .9);
function tree(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); mk(CY(.16 * s, .22 * s, 1.6 * s, 8), trunkM, 0, .8 * s, 0, g); mk(SP(.95 * s, 14, 10), leafM[0], 0, 2.2 * s, 0, g); mk(SP(.7 * s, 14, 10), leafM[1], .2 * s, 2.95 * s, .1 * s, g); scene.add(g); OBS.push({x, z, r:.55 * s}); }
TREE_GRID.forEach(([x, z], i) => tree(x + (i % 2 ? .3 : -.3), z, .85 + (i % 3) * .08)); // hàng cây trên quảng trường
for (let x = -26; x <= 26; x += 6.5) { if (Math.abs(x) < 7) continue; tree(x, 19.6, .8); } // cây dọc hàng rào trước
// bể nước dài giữa quảng trường (bo tròn hai đầu)
{ const {x, z, w, d} = POOL, g = new THREE.Group(); g.position.set(x, 0, z);
  const shape = (W, D) => { const s = new THREE.Shape(), r = D / 2; s.moveTo(-W / 2 + r, -r); s.lineTo(W / 2 - r, -r); s.absarc(W / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2); s.lineTo(-W / 2 + r, r); s.absarc(-W / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5); return s; };
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(shape(w, d), {depth:.55, bevelEnabled:false}), M(0xf2efe8, .6)); rim.rotation.x = -Math.PI / 2; rim.castShadow = rim.receiveShadow = true; g.add(rim);
  const water = new THREE.Mesh(new THREE.ShapeGeometry(shape(w - .8, d - .8)), new THREE.MeshStandardMaterial({color:0x3fb6e8, roughness:.08, metalness:.2, emissive:0x1b7fb5, emissiveIntensity:.35})); water.rotation.x = -Math.PI / 2; water.position.y = .58; g.add(water);
  scene.add(g); for (let i = -2; i <= 2; i++) OBS.push({x:x + i * (w - d) / 4, z, r:d / 2 + .1}); }
// đèn quảng trường
const lampM = M(0x2e3440, .5, .6), bulbM = new THREE.MeshBasicMaterial({color:0xfff1b8});
[[-3.8, -15], [3.8, -15], [-3.8, -3], [3.8, -3], [-3.8, 5], [3.8, 5]].forEach(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z); mk(CY(.1, .14, 4.4, 10), lampM, 0, 2.2, 0, g); mk(SP(.32, 12, 8), bulbM, 0, 4.5, 0, g).castShadow = false; scene.add(g); OBS.push({x, z, r:.35}); });
// xe máy để ở vỉa hè trước cổng
function moto(x, z, rot, col) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; const wm = MK(0x1b1b22, .9);
  [-.62, .62].forEach(o => { mk(CY(.32, .32, .14, 14), wm, 0, .32, o, g).rotation.z = Math.PI / 2; });
  mk(BX(.42, .42, 1.15), M(col, .35, .4), 0, .62, 0, g); mk(BX(.38, .14, .62), MK(0x2a2a30, .6), 0, .9, -.12, g); mk(CY(.04, .04, .7, 6), MK(0x9aa0aa, .3, .8), 0, 1.05, .55, g).rotation.z = Math.PI / 2;
  scene.add(g); OBS.push({x, z, r:.65});
}
[0xe8453c, 0x4a90d9, 0xffffff, 0x2b2b36, 0xff8fa3, 0x7fd6c2].forEach((c, i) => moto(-24 + i * 1.3, 17.7, 0, c));
// cổng trường: khung trắng mái bằng, hai trụ có sọc đỏ + biển tên đỏ chữ vàng bên phải
{ const g = new THREE.Group(); g.position.set(0, 0, 21.6); const wh = M(0xf7f4ee, .6), rd = M(0xc8102e, .6);
  [-6.4, 6.4].forEach(s => { mk(BX(2.2, 5.2, 1.6), wh, s, 2.6, 0, g); for (let i = -2; i <= 2; i++) mk(BX(.18, 4.4, 1.65), rd, s + i * .38, 2.4, 0, g); });
  mk(BX(15.4, .9, 3.2), wh, 0, 5.6, 0, g); mk(BX(15.6, .25, 3.4), MK(0xd9d4c7, .6), 0, 6.15, 0, g);
  const gf = mk(new THREE.PlaneGeometry(15.8, 15.8 / IMG.gate.a), new THREE.MeshStandardMaterial({map:imgTex("gate"), transparent:true, alphaTest:.5, roughness:.7}), 0, 15.8 / IMG.gate.a / 2 - .05, 1.72, g); gf.castShadow = false; // mặt trước vẽ tay
  scene.add(g); OBS.push({x:-6.4, z:21, r:1.3}, {x:6.4, z:21, r:1.3});
  const s = new THREE.Group(); s.position.set(12.5, 0, 21.4); mk(BX(7, 1.8, .6), MK(0xd9d4c7, .6), 0, .9, 0, s);
  mk(new THREE.PlaneGeometry(6.6, 1.4), new THREE.MeshStandardMaterial({map:textTex(["TRƯỜNG ĐẠI HỌC HOA LƯ"], 1024, 200, "#b5121b", "#ffd25e", "800 70px Nunito, sans-serif"), roughness:.7}), 0, .95, -.31, s).rotation.y = Math.PI;
  scene.add(s); }
// ---- các tòa nhà (ngoài khu vực chơi) ----
function facade2(floors, cols, base, opt = {}) { // tường trắng, cửa kính xanh, các tầng đế sơn đỏ có cửa vòm
  const fh = 64, c = document.createElement("canvas"); c.width = 512; c.height = floors * fh; const x = c.getContext("2d");
  x.fillStyle = opt.wall || "#f7f5f0"; x.fillRect(0, 0, 512, c.height); const w = 512 / cols;
  for (let f = 0; f < floors; f++) { const y = f * fh, isBase = f >= floors - base;
    if (isBase) { x.fillStyle = "#c8102e"; x.fillRect(0, y, 512, fh); }
    for (let i = 0; i < cols; i++) { const x0 = i * w + w * .18, ww = w * .64;
      if (isBase && opt.arch) { x.fillStyle = "#f7f5f0"; x.beginPath(); x.moveTo(x0 - 3, y + fh); x.lineTo(x0 - 3, y + fh * .45); x.arc(x0 + ww / 2, y + fh * .45, ww / 2 + 3, Math.PI, 0); x.lineTo(x0 + ww + 3, y + fh); x.fill();
        x.fillStyle = "#5d8fb8"; x.beginPath(); x.moveTo(x0, y + fh); x.lineTo(x0, y + fh * .45); x.arc(x0 + ww / 2, y + fh * .45, ww / 2, Math.PI, 0); x.lineTo(x0 + ww, y + fh); x.fill(); }
      else { x.fillStyle = isBase ? "#f7f5f0" : "#c9d3dc"; x.fillRect(x0 - 3, y + 10, ww + 6, fh - 18); x.fillStyle = "#5d8fb8"; x.fillRect(x0, y + 13, ww, fh - 24); x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(x0, y + 13, ww * .25, fh - 24); } } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function block(x, z, w, h, d, tex, ry = 0, roof = null) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const wall = M(0xf3f1ea, .8), front = new THREE.MeshStandardMaterial({map:tex, roughness:.75});
  const b = new THREE.Mesh(BX(w, h, d), [wall, wall, M(0xb9bec6, .8), wall, front, wall]); b.position.y = h / 2; b.castShadow = b.receiveShadow = true; g.add(b);
  if (roof) { const r = Math.SQRT1_2, hip = mk(new THREE.ConeGeometry(1, 1, 4, 1), M(roof, .55), 0, h + 1.3, 0, g); hip.rotation.y = Math.PI / 4; hip.scale.set((w + 1.2) * r, 2.6, (d + 1.2) * r); }
  else mk(BX(w + .4, .4, d + .4), MK(0xd9d4c7, .6), 0, h + .2, 0, g);
  scene.add(g); return g;
}
const ROOF = 0x7fcfae; // mái xanh ngọc
// nhà hiệu bộ 9 tầng + sảnh đỏ ở giữa + biển tên
{ const TW = 15, g = block(0, -29, TW, TW / IMG.tower.a, 8, imgTex("tower")); // mặt tiền vẽ tay, đã có đế đỏ và sảnh
  mk(new THREE.PlaneGeometry(3.1, .42), new THREE.MeshBasicMaterial({map:textTex(["ĐẠI HỌC HOA LƯ"], 512, 70, "#ffffff", "#c8102e", "900 46px Nunito, sans-serif")}), 0, TW / IMG.tower.a * .125, 4.06, g).castShadow = false; }
// sảnh đỏ và biển tên đã có trong ảnh mặt tiền
// hai dãy nhà 2 tầng hai bên: tầng trệt vòm đỏ, mái xanh ngọc
{ const WW = 22, WH = WW / IMG.wing.a, t = imgTex("wing"); block(-(7.5 + WW / 2), -28, WW, WH, 9, t, 0, ROOF); block(7.5 + WW / 2, -28, WW, WH, 9, t, 0, ROOF); }
// giảng đường hai bên quảng trường (mái xanh), mặt tiền quay vào trong
{ const LW = 26, LH = LW / IMG.lect.a, t = imgTex("lect"); block(-38, -6, LW, LH, 9, t, Math.PI / 2, ROOF); block(38, -6, LW, LH, 9, t, -Math.PI / 2, ROOF); }
// nhà thể thao đa năng (mái vòm xanh) và xưởng thực hành phía nam đường
{ const g = new THREE.Group(); g.position.set(-38, 0, 30); mk(BX(18, 6, 12), M(0xf3f1ea, .7), 0, 3, 0, g); const roof = mk(new THREE.CylinderGeometry(6.2, 6.2, 18.4, 24, 1, false, -Math.PI / 2, Math.PI), M(ROOF, .45), 0, 6, 0, g); roof.rotation.z = Math.PI / 2; scene.add(g); }
block(38, 30, 16, 7, 10, facade2(2, 6, 1, {arch:true}), Math.PI, ROOF);
// núi đá vôi Ninh Bình ở phía xa (không bị sương mù che)
{ const rock = [0x6f8f6a, 0x7fa076, 0x8e9a86, 0x6a8a66].map(c => new THREE.MeshStandardMaterial({color:c, roughness:1, fog:false, flatShading:true}));
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) { const a = -Math.PI * .95 + i / 25 * Math.PI * .9 + (rnd() - .5) * .08, R = 78 + rnd() * 30, hh = 18 + rnd() * 26, ww = 7 + rnd() * 7;
    const m = new THREE.Mesh(SP(1, 10, 8), rock[i % 4]); m.scale.set(ww, hh, ww * (.8 + rnd() * .4)); m.position.set(Math.cos(a) * R, hh * .35, Math.sin(a) * R * .75 - 18); scene.add(m); } }
const CAMPUS = scene.children.slice(CAMPUS_N0), CAMPUS_OBS = OBS.slice(), MAPTEX = {};
const miniC = $("mini"), mx = miniC.getContext("2d"), MINI_BG = Object.assign(new Image(), {src:IMG.ground.uri});
function applyMap(c) {
  const m = c.map; CAMPUS.forEach(o => o.visible = !m); OBS.length = 0; if (!m) OBS.push(...CAMPUS_OBS);
  if (m && !MAPTEX[m]) { const tx = MAPTEX[m] = new THREE.TextureLoader().load(MAPS[m].top); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; if (MAPS[m].px) tx.magFilter = THREE.NearestFilter; }
  ground.material.map = m ? MAPTEX[m] : groundTex; ground.material.bumpScale = m ? .06 : .25; ground.material.needsUpdate = true; outer.material.color.setHex(c.edge);
  MINI_BG.src = m ? MAPS[m].top : IMG.ground.uri;
  const L = c.lt; sun.color.setHex(L[0]); sun.intensity = L[1]; hemi.color.setHex(L[2]); hemi.intensity = L[3]; fill.color.setHex(L[4]); fill.intensity = L[5]; renderer.toneMappingExposure = L[6];
  box.parentElement.style.setProperty("--vig", c.vig); ambSetup(c); placeProps(CHAP.indexOf(c));
}
// [tên ảnh, x, z, cao, bán kính va chạm]
const PROPL = [
  [["congtruong", 0, -19.5, 7.5, 0], ["caybang", -23, -15, 6, 1], ["caybang2", 23, -15, 6, 1], ["cotden2", -14, -10, 4.2, .4], ["cotden2", 14, -10, 4.2, .4], ["ghenda", -24, 2, 1.2, 1.2], ["ghenda", 24, 2, 1.2, 1.2], ["ghenda", -10, 17, 1.2, 1.2], ["ghenda", 10, 17, 1.2, 1.2]],
  [["bang", -18, -15, 4, 1.7], ["cayn", 18, -15, 2.6, .5], ["sac", 22, 13, 3.2, 1.5], ["nam", -22, 12, 3.4, 1.2], ["lua", -9, -17, 3.2, .4], ["lua", 9, -17, 3.2, .4], ["cot", -25, 0, 4.4, .4], ["cot", 25, 0, 4.4, .4]],
  [["xe", -20, -14, 3.8, 1.7], ["sapo", 20, -14, 3.8, 1.7], ["quang", -14, 15, 2, .9], ["ghenhua", 12, 14, 1, .45], ["ghenhua", 14, 15.5, 1, .45], ["cayn", 24, 6, 2.6, .5], ["lua", -24, 6, 3.2, .4], ["cot", 0, -18, 4.4, .4]],
  [["thuyen", -19, -15, 2.4, 2], ["be", 20, -15, 2.8, 1.6], ["bonsen", 0, -17, 1.8, 1.6], ["liu", -24, 8, 6, 1], ["dahoc", 24, 9, 3.4, 1.4], ["nhu", 17, 16, 4.6, 1.1], ["da", -15, 15, 2.4, 1.6], ["nam", 9, -10, 3, 1.1], ["lua", -8, 18, 3.2, .4], ["cot", 26, -4, 4.4, .4]],
  [["ghe", -21, 15, 2.6, 1.4], ["ghe", 21, 15, 2.6, 1.4], ["cot", -7, -16, 4.4, .4], ["cot", 7, -16, 4.4, .4], ["liu", -24, -12, 6, 1], ["bang", 22, -13, 3.8, 1.6], ["coc", 0, 17, 1.1, .4]],
  [["khung", -26, 0, 3, 0], ["khung", 26, 0, 3, 0], ["ghe", 0, -19, 2.6, 1.4], ["coc", -10, 10, 1.1, .4], ["coc", 10, -10, 1.1, .4], ["coc", 12, 12, 1.1, .4], ["cayn", -22, -17, 2.6, .5]],
  [["sac", -21, -14, 3.2, 1.5], ["sac", 21, -14, 3.2, 1.5], ["cayn", -24, 10, 2.6, .5], ["nam", 22, 12, 3.2, 1.1], ["bang", 0, -18, 3.8, 1.6]]
];
Object.assign(PROP, {"congtruong":{"uri":IP[1090],"a":1.198},"caybang":{"uri":IP[1091],"a":1.036},"caybang2":{"uri":IP[1092],"a":0.911},"cotden2":{"uri":IP[1093],"a":0.198},"ghenda":{"uri":IP[1094],"a":1.424}});
const PROP_TEX = {}; let PROPM = [], PROP_OBS = [];
PROPL.splice(0, 4, ...[[["q_cong_cong", 0, -19.5, 7.5, 0], ["q_cong_caylon", -23, -15, 6, 1], ["q_cong_caylon", 23, -15, 6, 1], ["q_cong_den", -14, -10, 4.2, 0.4], ["q_cong_den", 14, -10, 4.2, 0.4], ["q_cong_ghe", -24, 2, 1.6, 1.2], ["q_cong_ghe", 24, 2, 1.6, 1.2], ["q_cong_chau", -10, 17, 1.8, 0.8], ["q_cong_xemay", 10, 17, 2.2, 1.6], ["q_cong_caynho", 0, 15, 4.4, 0.8]], [["q_lib_ke", -18, -15, 4.2, 1.5], ["q_lib_ban", 18, -14, 2.6, 1.5], ["q_lib_thienc", 22, 12, 3.2, 0.8], ["q_lib_xesach", -22, 12, 2.4, 1.2], ["q_lib_cayla", -9, -17, 2.6, 0.7], ["q_lib_binhsen", 9, -17, 2.4, 0.6], ["q_lib_ke", 25, 0, 4.2, 1.5], ["q_lib_ban", -25, 0, 2.6, 1.5]], [["q_dorm_ro", -20, -14, 4.4, 0.8], ["q_dorm_banghe", 20, -14, 2, 1.4], ["q_dorm_giaphoi", -14, 15, 2.6, 1.3], ["q_dorm_thungrac", 12, 14, 2, 0.6], ["q_dorm_xe", 24, 6, 2.4, 1.2], ["q_dorm_hoagiay", -24, 6, 2.4, 1.2], ["q_dorm_banghe", 0, -18, 2, 1.4]], [["q_tran_do", -19, -15, 2.4, 1.8], ["q_tran_congda", 20, -16, 5.5, 0], ["q_tran_liu", -24, 8, 6, 1], ["q_tran_nonbo", 24, 9, 3, 1.2], ["q_tran_chausen", 17, 16, 2, 0.8], ["q_tran_den", -15, 15, 4, 0.4], ["q_tran_nonbo", 9, -10, 3, 1.2], ["q_tran_chausen", -8, 18, 2, 0.8]]]);
PROPL.splice(4, 3, ...[[["q_quang_co", 0, -18, 3.6, 0.4], ["q_quang_ghe", -21, 15, 1.6, 1.2], ["q_quang_ghe", 21, 15, 1.6, 1.2], ["q_quang_den", -7, -16, 4.2, 0.4], ["q_quang_den", 7, -16, 4.2, 0.4], ["q_quang_bui", -24, -12, 2, 0.8], ["q_quang_bien", 22, -13, 2.6, 0.4], ["q_quang_thung", 0, 17, 1.8, 0.9]], [["q_san_khung", -26, 0, 2.6, 1.6], ["q_san_khung", 26, 0, 2.6, 1.6], ["q_san_cabin", 0, -19, 2.6, 1.8], ["q_san_dendai", -24, -17, 6, 0.6], ["q_san_coc", -10, 10, 1.4, 0.8], ["q_san_xebong", 10, -10, 2, 1], ["q_san_thung", 12, 12, 1.4, 0.7]], [["q_lab_tu", -21, -14, 3.6, 1.2], ["q_lab_server", 21, -14, 3.6, 1], ["q_lab_tesla", -24, 10, 2.6, 0.8], ["q_lab_ban", 22, 12, 2.4, 1.6], ["q_lab_plasma", 0, -18, 2, 0.7], ["q_lab_xeday", -12, 14, 2, 0.9]]]);
function placeProps(ci) {
  PROPM.forEach(m => scene.remove(m)); PROPM = []; PROP_OBS.forEach(o => { const i = OBS.indexOf(o); if (i >= 0) OBS.splice(i, 1); }); PROP_OBS = [];
  for (const [k, x, z, hh, r] of PROPL[ci] || []) {
    if (!PROP_TEX[k]) { const tx = PROP_TEX[k] = new THREE.TextureLoader().load(PROP[k].uri); tx.colorSpace = THREE.SRGBColorSpace; if (PROP[k].px) { tx.magFilter = tx.minFilter = THREE.NearestFilter; tx.generateMipmaps = false; } }
    const m = new THREE.Sprite(new THREE.SpriteMaterial({map:PROP_TEX[k], transparent:true, alphaTest:.08})); m.center.set(.5, .03); m.scale.set(hh * PROP[k].a, hh, 1); m.position.set(x, 0, z); scene.add(m); PROPM.push(m);
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.set(x, .03, z); sh.scale.set(Math.max(.6, hh * PROP[k].a * .55), Math.max(.4, hh * .22), 1); scene.add(sh); PROPM.push(sh);
    if (r) { const o = {x, z, r}; OBS.push(o); PROP_OBS.push(o); }
  }
}
// hạt bay theo chương: bụi vàng trong thư viện, đom đóm ở ký túc xá, cánh hoa ở Tràng An
const PETAL_TEX = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d"); x.fillStyle = "#ffb3cf"; x.beginPath(); x.ellipse(16, 16, 13, 7, .5, 0, 6.3); x.fill(); x.fillStyle = "#ffe0ec"; x.beginPath(); x.ellipse(13, 14, 6, 3, .5, 0, 6.3); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const AMB = [];
function ambSetup(c) {
  AMB.forEach(a => { scene.remove(a.m); a.m.material.dispose(); }); AMB.length = 0; const k = c.amb; if (!k) return;
  for (let i = 0, n = LOW ? 24 : 44; i < n; i++) { const pet = k === "petal", m = new THREE.Sprite(new THREE.SpriteMaterial({map:pet ? PETAL_TEX : FLASH_TEX, color:k === "dust" ? 0xffe2a0 : k === "fly" ? 0xd8ff7a : 0xffffff, transparent:true, depthWrite:false, blending:pet ? THREE.NormalBlending : THREE.AdditiveBlending, opacity:.8}));
    const s = pet ? .42 : k === "fly" ? .55 : .3; m.scale.setScalar(s); m.renderOrder = 3; scene.add(m); AMB.push({m, k, x:(Math.random() - .5) * 34, y:.6 + Math.random() * 4.5, z:(Math.random() - .5) * 26, ph:Math.random() * 6.3}); }
}
function ambTick(dt) {
  const cx = P ? P.x : 0, cz = P ? P.z : 0;
  for (const a of AMB) { a.ph += dt;
    if (a.k === "petal") { a.x += dt * 1.1; a.z += dt * .5; a.y -= dt * .55; a.m.material.rotation += dt * 1.5; if (a.y < .1) a.y = 5; }
    else if (a.k === "fly") { a.x += Math.sin(a.ph * .9) * dt * .9; a.z += Math.cos(a.ph * .7) * dt * .9; a.y = 1 + Math.sin(a.ph * .5) * .8 + 1; a.m.material.opacity = .35 + .6 * Math.max(0, Math.sin(a.ph * 2.2)); }
    else { a.y += Math.sin(a.ph * .6) * dt * .25; a.x += dt * .15; a.m.material.opacity = .45 + .3 * Math.sin(a.ph * 1.3); }
    if (a.x - cx > 17) a.x -= 34; if (a.x - cx < -17) a.x += 34; if (a.z - cz > 13) a.z -= 26; if (a.z - cz < -13) a.z += 26; a.m.position.set(a.x, a.y, a.z); }
}
const panoOf = c => c.map ? MAPS[c.map].pano : IMG.pano.uri;
function menuBg() { ["menu", "end"].forEach(id => $(id).style.background = `linear-gradient(rgba(43,27,61,.7), rgba(43,27,61,.88)), url(${panoOf(CHAP[SV.chap])}) center / cover`); }
function drawMini() {
  if (DG.on && P) return dgMini();
  const W = 120, H = 88, X = x => (x + 32) / 64 * W, Z = z => (z + 24) / 48 * H; mx.clearRect(0, 0, W, H);
  if (MINI_BG.complete && MINI_BG.naturalWidth) { mx.globalAlpha = .9; mx.drawImage(MINI_BG, 0, 0, W, H); mx.globalAlpha = 1; } // ảnh mặt sân thu nhỏ
  else { mx.fillStyle = "rgba(123,184,101,.6)"; mx.fillRect(X(-28.5), Z(-21), X(28.5) - X(-28.5), Z(21) - Z(-21)); mx.fillStyle = "rgba(217,214,205,.9)"; mx.fillRect(X(-28.5), Z(-21), X(28.5) - X(-28.5), Z(11) - Z(-21));
  mx.fillStyle = "rgba(84,90,100,.85)"; mx.fillRect(X(-28.5), Z(12), X(28.5) - X(-28.5), Z(17) - Z(12)); mx.fillStyle = "rgba(63,182,232,.95)"; mx.fillRect(X(POOL.x - POOL.w / 2), Z(POOL.z - POOL.d / 2), POOL.w / 64 * W, POOL.d / 48 * H); }
  mx.fillStyle = "rgba(43,27,61,.45)"; OBS.forEach(o => mx.fillRect(X(o.x) - 1, Z(o.z) - 1, 2, 2));
  if (!P) return; E.forEach(e => { mx.fillStyle = e.boss ? "#ffd25e" : "#e8453c"; mx.beginPath(); mx.arc(X(e.x), Z(e.z), e.boss ? 4 : 2.2, 0, 7); mx.fill(); });
  mx.fillStyle = "#fff"; mx.strokeStyle = "#2b1b3d"; mx.lineWidth = 1.5; mx.beginPath(); mx.arc(X(P.x), Z(P.z), 3.4, 0, 7); mx.fill(); mx.stroke();
}

// ---------- Nhân vật 3D ----------
const R = {}, PM = {shoe:M(0xffffff, .5), glove:M(0xf1c9a0, .6), pad:M(0x9aa3b5, .35, .7), band:M(0xe8453c, .6), glass:M(0x111111, .15, .5),
  jk:M(0x4a78b8, .7), sh:Object.assign(M(0xa8774a, .45, .35), {transparent:true}), rim:M(0xa3a9b5, .3, .9)};
function buildPlayer(cfg) {
  R.model = null; R.rig = null; R.anim = null; R.heldPhi = null; const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
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
  if (cfg.anim) { body.visible = false; R.spr = null; buildAnim(root, cfg.anim); }
  else if (cfg.rig) { body.visible = false; R.spr = null; buildRig(root, cfg.rig); }
  else if (cfg.spr) { body.visible = false; R.spr = facingSprite(cfg.spr, cfg.sw); root.add(R.spr); const bl = new THREE.Mesh(shadowGeo, shadowMat); bl.rotation.x = -Math.PI / 2; bl.position.y = .03; root.add(bl); }
  else R.spr = null;
  R.body = body; if (cfg.big) root.scale.setScalar(1.18);
  const w = R.weapon = new THREE.Group(); w.position.y = 2.1; root.add(w);
  R.held = null; R.hand = mk(SP(.25), PM.glove, 0, 0, 1.75, w); if (cfg.anim) R.hand.visible = false; // nhân vật 2D không cần "bàn tay" 3D lơ lửng
  outline(root, .022); scene.add(root); return root;
}
// ---------- Dữ liệu và cấu hình (kiểu Survivor) ----------
const fmt = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
const SV0 = {coins:0, chars:["lop"], sel:"lop", up:{hp:0, dmg:0, spd:0, mag:0, xp:0, rev:0}, best:0, gift:"", mis:{day:"", k:0, t:0, b:0, c:[0, 0, 0]}, cl:0, chap:0, kt:0, rare:[]};
const SV = Object.assign({}, SV0, JSON.parse(localStorage.getItem("lopSave") || "{}")); SV.up = Object.assign({}, SV0.up, SV.up); SV.mis = Object.assign({}, SV0.mis, SV.mis);
const save = () => localStorage.setItem("lopSave", JSON.stringify(SV)), today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }; // theo giờ máy (UTC+7 ở VN), không phải UTC
if (SV.mis.day !== today()) SV.mis = {day:today(), k:0, t:0, b:0, c:[0, 0, 0]};
const CH = {
  lop:{n:"Lốp Trưởng", d:"Chàng trai yêu đơn phương. Khởi đầu: Ném lốp.", w:"throw", hair:0x1c1a1f, shirt:0xefeadf, letter:"E", cost:0, anim:"lop"},
  ban:{n:"Bạn Thân", d:"Nhanh nhẹn +12% tốc độ. Khởi đầu: Tên lửa tình yêu.", w:"heart", hair:0x6b3a1f, shirt:0xff8fa3, letter:"B", spd:1.12, pony:1, cost:300, anim:"ban"},
  hot:{n:"Hot Boy", d:"Chí mạng +15%. Khởi đầu: Sấm sét.", w:"bolt", hair:0xd9b44a, shirt:0x2b2b36, letter:"H", crit:.15, cost:800, anim:"hot"},
  gym:{n:"Gym Bro", d:"Trâu bò +40% máu. Khởi đầu: Sóng xung.", w:"wave", hair:0x2b2b2b, shirt:0xe8453c, letter:"G", hp:1.4, big:1, cost:1500, anim:"gym"},
  bo:{n:"Bố", d:"Lực lưỡng, chịu đòn tốt +30% máu. Khởi đầu: Ném dép.", w:"slipper", hair:0x3b2a1e, shirt:0x5a7d52, letter:"B", beard:1, big:1, hp:1.3, cost:1200, rig:"bo", anim:"bo"},
  me:{n:"Mẹ", d:"Vung chảo rất mạnh +15% sát thương. Khởi đầu: Chảo boomerang.", w:"pan", hair:0x2a1a14, shirt:0xf2a7c0, letter:"M", bun:1, dm:1.15, cost:1000, rig:"me", anim:"me", model:0}, // model:1 = dùng lại mô hình 3D mom.glb
  anh:{n:"Anh trai", d:"Tay đua nhanh nhẹn +8% tốc độ. Khởi đầu: Ném máy tính.", w:"laptop", hair:0x1a1a1a, shirt:0x3c6fb0, letter:"A", cap:0x2e5aa8, spd:1.08, cost:900, rig:"anh", anim:"anh"}
};
const WP = {
  throw:{n:"Ném lốp", ic:"🛞", d:"Cầm lốp xe ném thẳng, xuyên qua hàng loạt kẻ địch.", evo:"Lốp quái vật", need:"dmg"},
  heart:{n:"Tên lửa tình yêu", ic:"💘", d:"Trái tim tự dẫn hướng, nổ lan.", evo:"Mưa tình yêu", need:"cdr"},
  bolt:{n:"Sấm sét", ic:"⚡", d:"Sét đánh ngẫu nhiên vào kẻ địch.", evo:"Thiên lôi", need:"crit"},
  wave:{n:"Sóng xung", ic:"💥", d:"Sóng nổ đẩy lùi mọi thứ quanh bạn.", evo:"Động đất", need:"hp"},
  gun:{n:"Súng lửa", ic:"🔫", d:"Bắn liên thanh: chớp lửa đầu nòng, đạn lửa bay thật, tóe tia khi trúng.", evo:"Súng máy", need:"crit"},
  bow:{n:"Cung tên", ic:"🏹", d:"Bắn mũi tên kéo vệt sáng, xuyên qua nhiều kẻ địch.", evo:"Cung thần", need:"dmg"},
  laptop:{n:"Ném máy tính", ic:"💻", d:"Ném laptop, phát nổ khi chạm đất.", evo:"Siêu máy chủ", need:"cdr"},
  slipper:{n:"Ném dép", ic:"🩴", d:"Ném dép xoay tít, xuyên qua và đẩy lùi kẻ địch.", evo:"Dép thần (bay về tay)", need:"arm"},
  thermos:{n:"Bình Giữ Nhiệt Băng", ic:"🧊", d:"Ném bình vỡ thành vùng băng: sát thương liên tục, làm chậm yêu quái.", evo:"Kỷ Băng Hà", need:"mag", rare:1},
  pen:{n:"Bút Laser", ic:"🖊️", d:"Bắn tia laser xuyên thẳng qua mọi kẻ địch trên đường.", evo:"Bút Thần Hủy Diệt", need:"crit", rare:1},
  pan:{n:"Chảo boomerang", ic:"🍳", d:"Ném chảo bay ra rồi quay về, đập kẻ địch 2 lần.", evo:"Chảo thần", need:"hp"}
};
const PS = {
  hp:{n:"Áo giáp", ic:"🛡️", d:"+20 máu tối đa, hồi đầy 20"}, spd:{n:"Giày chạy", ic:"👟", d:"+8% tốc độ chạy"}, mag:{n:"Nam châm", ic:"🧲", d:"+30% tầm hút kinh nghiệm"},
  dmg:{n:"Găng tay", ic:"🥊", d:"+12% sát thương"}, crit:{n:"Kính râm", ic:"🕶️", d:"+8% chí mạng"}, cdr:{n:"Băng đô", ic:"⏱️", d:"-8% hồi chiêu"}, arm:{n:"Áo khoác", ic:"🧥", d:"-7% sát thương nhận"}
};
const UPG = {hp:["Máu gốc", "+10% máu mỗi cấp", 10], dmg:["Sức mạnh", "+8% sát thương", 10], spd:["Tốc độ", "+4% tốc độ chạy", 10], mag:["Nam châm", "+15% tầm hút", 10], xp:["Học nhanh", "+8% kinh nghiệm", 10], rev:["Hồi sinh", "Thêm 1 lần hồi sinh miễn phí", 2]};
const MIS = [["Hạ 150 tình địch", () => SV.mis.k, 150, 60], ["Sống sót 4 phút trong một ván", () => Math.floor(SV.mis.t), 240, 80], ["Đánh bại 1 trùm", () => SV.mis.b, 1, 100]];
const ECFG = {
  nhan:{c:0xf4f2ec, h:0x2a1d14, s:.85, hp:3, sp:3.4, r:.55, dmg:6, xp:1}, hot:{c:0x26262b, h:0x3a2616, s:.92, hp:6, sp:4, r:.6, dmg:9, xp:3, dash:1},
  gym:{c:0xe8453c, h:0x2b2b2b, s:1.15, hp:22, sp:2.1, r:.9, dmg:14, xp:8}, boss:{c:0x1d1d28, h:0x9a9aa5, s:2.3, hp:700, sp:2.3, r:1.9, dmg:26, xp:40, dash:1, boss:1}
};
// Kẻ địch ở Đại học Hoa Lư: nhan = sinh viên cùng lớp với crush (áo trắng, balo), hot = hot boy CLB guitar, gym = đội bóng khoa Thể chất, boss = thủ khoa kiêm hot boy toàn trường
const NAMES = {nhan:"Ma Deadline", hot:"Quỷ Điểm F", gym:"Yêu tinh Học lại", boss:"Đại yêu Thi cử", final:"Ma vương Đồ án tốt nghiệp",
  phuthuy:"Phù thủy Nợ Môn", qua:"Quạ Lửa Thi Lại", batuoc:"Bá tước Tiệc Tùng", lon:"Lon Tăng Lực Nổi Điên", nuhoang:"Nữ hoàng Quạ Đêm", vosi:"Võ Sĩ Phố Đi Bộ", ptv:"Phù Thủy Thư Viện", sep:"Sếp Vét Deadline", mi:"Bạch Tuộc Mì Ly", robot:"Robot Điểm Danh", wifi:"Ma Mất Wifi", rua:"Huyền Quy Tràng An"};
Object.assign(ECFG, {
  phuthuy:{hp:9, sp:2.5, r:.65, dmg:8, xp:4, keep:7, shoot:{cd:2.6, sp:7, col:0x3fe0c0, d:9}},          // giữ khoảng cách, bắn cầu lửa xanh ngọc
  qua:{hp:4, sp:5.4, r:.55, dmg:7, xp:2, weave:1},                                                        // bay lượn vòng, đi thành đàn
  batuoc:{hp:15, sp:2.2, r:.7, dmg:10, xp:6, keep:6, lob:{cd:3.2, col:0xff4fa0, d:12, R:1.9}},           // ném chai sủi bọt có vòng báo trước
  lon:{hp:5, sp:5.8, r:.6, dmg:8, xp:3, boom:1},                                                          // chạy rất nhanh, nổ khi bị hạ
  vosi:{hp:32, sp:2.3, r:.95, dmg:15, xp:10, dash:1},                                                     // trâu, đấm lao tới
  ptv:{hp:20, sp:2.2, r:.7, dmg:10, xp:8, keep:6, shoot:{cd:2.8, sp:6.5, col:0xffe28a, d:10, n:3}},      // phóng 3 trang sách
  sep:{hp:26, sp:2.4, r:.8, dmg:12, xp:9, keep:6, shoot:{cd:3, sp:6.5, col:0xb26bff, d:11, n:2}},             // ném cặp deadline tím
  mi:{hp:14, sp:2.4, r:.8, dmg:10, xp:6, keep:6, lob:{cd:3, col:0xff9a3a, d:12, R:2}},                    // ném mì sôi có vòng báo trước
  robot:{hp:22, sp:3, r:.8, dmg:12, xp:8, dash:1},                                                         // lao tới điểm danh
  wifi:{hp:6, sp:5, r:.6, dmg:8, xp:3, weave:1},                                                           // chập chờn, lượn nhanh
  rua:{hp:900, sp:1.7, r:2.6, dmg:30, xp:60, dash:1, boss:1, shoot:{cd:2.6, sp:7, col:0x3fffb0, d:16, n:7}},  // trùm: rùa núi phun ngọc nước
  nuhoang:{hp:700, sp:2.3, r:1.9, dmg:26, xp:40, dash:1, boss:1, summon:"qua", shoot:{cd:2.4, sp:8, col:0xff5a2a, d:14, n:5}}
});
// 4 chương: mỗi chương một bản đồ, bầy yêu quái, tinh anh, trùm giữa trận và trùm cuối
const CHAP = [
  {n:"Cổng trường Hoa Lư", map:null, edge:0x8fb877, amb:null, vig:.28, lt:[0xfff2dd, 2.4, 0xffffff, .6, 0x9fc4ff, .7, .86], mobs:[["nhan", .6], ["hot", .25, 40], ["gym", .18, 100]], elite:"gym", ring:"nhan", boss:[["boss", {}], ["boss", {}]]},
  {n:"Thư viện", map:"lib", edge:0x8a4b2a, amb:"dust", vig:.4, lt:[0xffe0b0, 2.0, 0xfff0d8, .7, 0xffc89a, .5, .84], mobs:[["nhan", .5], ["qua", .35, 20], ["phuthuy", .18, 70], ["sep", .08, 120]], elite:"ptv", ring:"qua", boss:[["ptv", {sc:2.2, name:"Phù Thủy Thư Viện khổng lồ"}], ["nuhoang", {}]]},
  {n:"Ký túc xá & căng tin", map:"dorm", edge:0x5d5468, amb:"fly", vig:.5, lt:[0xffb070, 1.35, 0xa58ad8, .8, 0x7a6cff, .9, .8], mobs:[["lon", .55], ["batuoc", .22, 50], ["vosi", .15, 100], ["sep", .12, 80]], elite:"vosi", ring:"lon", boss:[["nuhoang", {}], ["batuoc", {sc:2.3, name:"Bá tước Tiệc Tùng khổng lồ"}]]},
  {n:"Bến thuyền Tràng An", map:"tran", edge:0x2f7a55, amb:"petal", vig:.36, lt:[0xffc890, 2.2, 0xffe2c8, .65, 0xff9fb0, .6, .86], mobs:[["nhan", .35], ["qua", .25], ["lon", .2, 30], ["phuthuy", .12, 60], ["batuoc", .12, 90], ["vosi", .1, 120], ["gym", .08, 150], ["sep", .1, 70]], elite:"sep", ring:"qua", boss:[["sep", {sc:2.2, name:"Sếp Vét Deadline khổng lồ"}], ["boss", {}]]}
];
CHAP[0].map = "cong"; CHAP[0].edge = 0x8f8f96; IMG.pano.uri = MAPS.cong.pano;
CHAP[3].boss[1] = ["rua", {name:"Huyền Quy Tràng An"}]; CHAP[3].mobs.push(["mi", .15, 40], ["wifi", .2, 20]); CHAP[0].mobs.push(["robot", .1, 120]); CHAP[2].mobs.push(["mi", .14, 30]);
CHAP.push(
  {n:"Quảng trường trường", map:"quang", edge:0x8f8f96, amb:"petal", vig:.3, lt:[0xfff0d0, 2.3, 0xffffff, .65, 0xffd0a0, .6, .86], mobs:[["nhan", .4], ["hot", .25], ["robot", .2, 30], ["wifi", .2, 60], ["sep", .1, 100]], elite:"robot", ring:"wifi", boss:[["sep", {sc:2.2, name:"Sếp Vét Deadline khổng lồ"}], ["final", {}]]},
  {n:"Sân vận động", map:"san", edge:0xb84a3a, amb:null, vig:.28, lt:[0xffe8c8, 2.4, 0xffffff, .6, 0xa0c8ff, .6, .86], mobs:[["gym", .3], ["vosi", .2, 20], ["lon", .3], ["robot", .15, 60], ["hot", .2]], elite:"vosi", ring:"lon", boss:[["gym", {sc:2.4, name:"Yêu tinh Học lại khổng lồ"}], ["rua", {}]]},
  {n:"Phòng thí nghiệm", map:"lab", edge:0x5aa8a0, amb:"dust", vig:.42, lt:[0xd8fff8, 2.1, 0xc8fff0, .75, 0x7fffe0, .8, .84], mobs:[["robot", .35], ["wifi", .3], ["mi", .2, 30], ["phuthuy", .15, 60], ["sep", .1, 120]], elite:"robot", ring:"wifi", boss:[["robot", {sc:2.6, name:"Siêu Robot Điểm Danh"}], ["final", {}]]}
);
let CUR = CHAP[0];
const RARE = {thermos:{img:"binh", c:"Hạ tổng 3000 yêu quái", ok:() => SV.kt >= 3000, cost:2500}, pen:{img:"but", c:"Hoàn thành Chương 3", ok:() => SV.cl >= 3, cost:4000},
  badge:{img:"the", c:"Hoàn thành Chương 2", ok:() => SV.cl >= 2, cost:3000}, mu:{img:"w_mu", c:"Hoàn thành Chương 4", ok:() => SV.cl >= 4, cost:5000}};
const rareOwn = id => SV.rare.includes(id) || RARE[id].ok();

// ---------- Mô hình, hiệu ứng dùng chung ----------
const shadowMat = new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:.25}), shadowGeo = new THREE.CircleGeometry(.7, 16);
function ol(m) { m.geometry.computeBoundingSphere(); const o = new THREE.Mesh(m.geometry, OUT); o.scale.setScalar(1 + .055 / m.geometry.boundingSphere.radius); o.castShadow = false; m.add(o); }
// ---------- Yêu quái học đường (kẻ địch) ----------
// nhan = Ma Deadline (bóng ma tím ôm đồng hồ báo thức), hot = Quỷ Điểm F (tiểu quỷ đỏ cầm bài điểm F, hay lao tới),
// gym = Yêu tinh Học lại (yêu tinh xanh to khỏe đội chồng sách), boss = Đại yêu Thi cử (tờ đề thi biết đi), boss cuối = Ma vương Đồ án tốt nghiệp
const FTEX = {};
function paperTex(kind) {
  if (FTEX[kind]) return FTEX[kind]; const c = document.createElement("canvas"); c.width = 128; c.height = 160; const x = c.getContext("2d");
  x.fillStyle = "#fffdf6"; x.fillRect(0, 0, 128, 160); x.strokeStyle = "#9cc3e6"; x.lineWidth = 3; for (let y = 34; y < 160; y += 16) { x.beginPath(); x.moveTo(8, y); x.lineTo(120, y); x.stroke(); }
  x.textAlign = "center"; x.textBaseline = "middle";
  if (kind === "F") { x.fillStyle = "#d62828"; x.font = "900 96px Nunito, sans-serif"; x.fillText("F", 64, 92); x.strokeStyle = "#d62828"; x.lineWidth = 5; x.beginPath(); x.arc(64, 92, 52, 0, 7); x.stroke(); }
  else if (kind === "exam") { x.fillStyle = "#2b1b3d"; x.font = "800 22px Nunito, sans-serif"; x.fillText("ĐỀ THI", 64, 18); x.fillStyle = "#d62828"; x.font = "900 54px Nunito, sans-serif"; x.fillText("0đ", 96, 126); }
  else { x.fillStyle = "#3b2160"; x.fillRect(0, 0, 128, 160); x.fillStyle = "#ffd25e"; x.font = "900 26px Nunito, sans-serif"; x.fillText("ĐỒ ÁN", 64, 60); x.fillText("TỐT", 64, 92); x.fillText("NGHIỆP", 64, 122); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return FTEX[kind] = t;
}
function foeEyes(g, y, z, sp, s, angry, glow) {
  const dark = MK(0x111118, .3), white = glow ? new THREE.MeshBasicMaterial({color:0xfff27a}) : MK(0xffffff, .3);
  [-1, 1].forEach(k => { mk(SP(s, 10, 8), white, k * sp, y, z, g); if (!glow) mk(SP(s * .5, 8, 6), dark, k * sp, y, z + s * .7, g); if (angry) mk(BX(s * 2.4, s * .45, s * .45), dark, k * sp, y + s * 1.25, z + s * .3, g).rotation.z = k * -.5; });
}
// Yêu quái vẽ tay: mỗi loại 1 ảnh atlas, các khung là texture dùng chung nguồn ảnh (tải lên GPU 1 lần)
const FOE_H = {nhan:2.8, hot:2.7, gym:3.8, boss:6.6, final:8, phuthuy:3.5, qua:2.4, batuoc:3.7, lon:2.5, nuhoang:7.4, vosi:3.4, ptv:3.2, sep:3.6, mi:2.8, robot:3, wifi:2.8, rua:7.2}, FOE_TEX = {};
// v17: tỉ lệ quái theo nhân vật pixel (cao 3): quái thường thấp hơn người chơi, trùm ~1.7 lần
Object.assign(FOE_H, {nhan:2.3, hot:2.3, gym:2.9, boss:5, final:5.8, phuthuy:2.5, qua:1.9, batuoc:2.8, lon:2, nuhoang:5.2, vosi:2.9, ptv:2.7, sep:2.8, mi:2.1, robot:2.5, wifi:2.3, rua:5.4});
function foeTex(k) {
  if (FOE_TEX[k]) return FOE_TEX[k]; const A = FOEA[k], all = [];
  const base = new THREE.TextureLoader().load(A.uri, () => all.forEach(t => t.needsUpdate = true)); base.colorSpace = THREE.SRGBColorSpace; base.generateMipmaps = false; base.minFilter = THREE.LinearFilter; if (A.px) base.magFilter = base.minFilter = THREE.NearestFilter;
  const NR = A.v2 ? 4 : 2, fr = (c, r, flip) => { const t = base.clone(); t.repeat.set((flip ? -1 : 1) / A.cols, 1 / NR); t.offset.set((flip ? c + 1 : c) / A.cols, 1 - (r + 1) / NR); all.push(t); return t; };
  if (A.v2) { const pr = (c, r) => [fr(c, r, true), fr(c, r, false)], row = r => Array.from({length:6}, (_, c) => pr(c, r));
    return FOE_TEX[k] = {walk:row(0), atk:row(1), hurt:row(2), die:row(3), hit:pr(2, 2), dead:pr(5, 3)}; }
  return FOE_TEX[k] = {walk:Array.from({length:A.n}, (_, c) => [fr(c, 0, false), fr(c, 0, true)]), hit:[fr(0, 1, false), fr(0, 1, true)], dead:[fr(1, 1, false), fr(1, 1, true)]};
}
function buildFoeSprite(k, mats) {
  const A = FOEA[k], F = foeTex(k), g = new THREE.Group(), kk = FOE_H[k] / A.fh, mt = new THREE.SpriteMaterial({map:F.walk[0][0], transparent:true, alphaTest:.05, depthWrite:false}); mats.push(mt);
  const sp = new THREE.Sprite(mt); sp.center.set(.5, 3 / A.ch); sp.scale.set(A.cw * kk, A.ch * kk, 1); g.add(sp);
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = .03; sh.scale.setScalar(FOE_H[k] / 2.4); g.add(sh);
  g.userData = {legs:[], spr:sp, key:k}; return g;
}
// xác yêu quái nằm bẹp rồi mờ dần
function corpse(e) { const ud = e.mesh.userData; if (!ud.spr) return; const FT = FOE_TEX[ud.key];
  if (FT.die) { const fl = P.x > e.x ? 1 : 0, sp = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:FT.die[0][fl], transparent:true, depthWrite:false})));
    sp.center.copy(ud.spr.center); sp.scale.copy(ud.spr.scale).multiplyScalar(e.mesh.scale.x); sp.position.set(e.x, 0, e.z); scene.add(sp); FM.push({mesh:sp, t:0, dur:1.3, seq:FT.die.map(p => p[fl])}); return; } const sp = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:FOE_TEX[ud.key].dead[P.x > e.x ? 1 : 0], transparent:true, depthWrite:false})));
  sp.center.copy(ud.spr.center); sp.scale.copy(ud.spr.scale).multiplyScalar(e.mesh.scale.x); sp.position.set(e.x, 0, e.z); scene.add(sp); FM.push({mesh:sp, t:0, dur:.8, op:1}); }
// Yêu quái 3 hướng (trước / nghiêng / sau): đổi ảnh theo hướng di chuyển, lắc nhẹ khi bước
const DIR_TEX = {};
function dirTex(k) { if (DIR_TEX[k]) return DIR_TEX[k]; const L = new THREE.TextureLoader(), V = DIR3[k], ld = (u, flip) => { const t = L.load(u); t.colorSpace = THREE.SRGBColorSpace; if (flip) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; } return t; };
  return DIR_TEX[k] = {front:ld(V[0].uri), right:ld(V[1].uri), left:ld(V[1].uri, true), back:ld(V[2].uri)}; }
function buildDirFoe(k, mats) {
  const T = dirTex(k), g = new THREE.Group(), H = FOE_H[k], mt = new THREE.SpriteMaterial({map:T.front, transparent:true, alphaTest:.05, depthWrite:false}); mats.push(mt);
  const sp = new THREE.Sprite(mt); sp.center.set(.5, .01); sp.scale.set(H * DIR3[k][0].a, H, 1); g.add(sp);
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = .03; sh.scale.setScalar(H / 2.6); g.add(sh);
  g.userData = {legs:[], dir:sp, key:k, H}; return g;
}
function buildFoe(type, mats, final = false) {
  const key = type === "boss" && final ? "final" : type; if (DIR3[key]) return buildDirFoe(key, mats); if (FOEA[key]) return buildFoeSprite(key, mats); // có ảnh vẽ tay thì dùng, không thì dựng 3D
  const c = ECFG[type], g = new THREE.Group(), M2 = (col, r = .6, m = 0) => { const x = M(col, r, m); mats.push(x); return x; }, dark = MK(0x111118, .3);
  const legs = (col, sp = .25, len = .7) => [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * sp, len, 0); g.add(l); mk(BX(.26, len, .3), col, 0, -len / 2, 0, l); mk(SP(.2, 8, 6), col, 0, -len + .05, .1, l); return l; });
  let main = [];
  if (type === "nhan") { // Ma Deadline
    const body = M2(0xc9b8f0, .45); const b = mk(SP(.6, 18, 14), body, 0, 1.4, 0, g); b.scale.set(1, 1.12, 1); const tail = mk(geo("ghostTail", () => new THREE.ConeGeometry(.6, 1.1, 18, 1, true)), body, 0, .6, 0, g); tail.rotation.x = Math.PI;
    foeEyes(g, 1.55, .5, .2, .12, false); mk(SP(.08, 8, 6), dark, 0, 1.3, .57, g);
    [-1, 1].forEach(s => mk(SP(.16, 8, 6), body, s * .62, 1.25, .1, g));
    const ck = new THREE.Group(); ck.position.set(.75, 1.2, .25); mk(CY(.26, .26, .14, 16), M2(0xe8453c, .5), 0, 0, 0, ck).rotation.x = Math.PI / 2; mk(CY(.2, .2, .02, 16), MK(0xffffff, .4), 0, 0, .08, ck).rotation.x = Math.PI / 2; [-1, 1].forEach(s => mk(SP(.09, 8, 6), MK(0xffd25e, .3, .7), s * .17, .25, 0, ck)); g.add(ck);
    g.userData.legs = [new THREE.Group(), new THREE.Group()]; main = [b];
  } else if (type === "hot") { // Quỷ Điểm F
    const red = M2(0xe8453c, .5), dk = M2(0x5b1f2b, .6); const b = mk(SP(.58, 18, 14), red, 0, 1.25, 0, g);
    [-1, 1].forEach(s => { const h = mk(geo("impHorn", () => new THREE.ConeGeometry(.12, .45, 8)), MK(0x2b1b3d, .4), s * .3, 1.82, 0, g); h.rotation.z = s * -.35;
      const w = mk(BX(.7, .05, .45), dk, s * .7, 1.45, -.35, g); w.rotation.z = s * .5; w.rotation.y = s * -.4; });
    foeEyes(g, 1.35, .48, .2, .12, true); mk(BX(.3, .06, .06), dark, 0, 1.1, .55, g);
    const tl = mk(CY(.05, .05, .8, 6), red, 0, .9, -.6, g); tl.rotation.x = -.9; mk(geo("impTip", () => new THREE.ConeGeometry(.13, .25, 4)), MK(0x2b1b3d, .4), 0, 1.15, -.95, g).rotation.x = -.9;
    const pp = mk(new THREE.PlaneGeometry(.55, .7), new THREE.MeshStandardMaterial({map:paperTex("F"), side:THREE.DoubleSide, roughness:.8}), .75, 1.2, .3, g); pp.rotation.y = -.3;
    g.userData.legs = legs(dk, .22, .55); main = [b];
  } else if (type === "gym") { // Yêu tinh Học lại
    const grn = M2(0x6fae4f, .6), pants = M2(0x6b4a2f, .8); const b = mk(geo("ogreBody", () => new THREE.CapsuleGeometry(.5, .6, 5, 12)), grn, 0, 1.45, 0, g); b.scale.set(1.35, 1, 1);
    const hd = mk(SP(.48, 16, 12), grn, 0, 2.3, .05, g); foeEyes(g, 2.38, .45, .18, .1, true);
    [-1, 1].forEach(s => { mk(geo("tusk", () => new THREE.ConeGeometry(.07, .25, 6)), MK(0xfffbe8, .4), s * .17, 2.07, .42, g); mk(SP(.32, 10, 8), grn, s * .95, 1.55, 0, g); mk(SP(.24, 10, 8), grn, s * 1.05, 1.0, .1, g); });
    [[0xe8453c, 1.0], [0x4a90d9, .9], [0xffd25e, .8]].forEach(([col, w], i) => mk(BX(w, .2, .7), MK(col, .6), (i - 1) * .06, 2.85 + i * .2, 0, g).rotation.y = i * .25); // chồng sách trên đầu
    g.userData.legs = legs(pants, .3, .75); main = [b, hd];
  } else if (!final) { // Đại yêu Thi cử
    const pap = M2(0xfffdf6, .7); const b = mk(BX(1.5, 2.1, .25), pap, 0, 1.75, 0, g);
    mk(new THREE.PlaneGeometry(1.4, 2), new THREE.MeshStandardMaterial({map:paperTex("exam"), roughness:.8}), 0, 1.75, .13, g).castShadow = false;
    foeEyes(g, 2.25, .2, .3, .14, true); mk(BX(.6, .1, .05), dark, 0, 1.95, .16, g);
    [-1, 1].forEach(s => { const a = mk(CY(.07, .07, 1, 6), MK(0x2b1b3d, .5), s * .95, 1.6, 0, g); a.rotation.z = s * .6; });
    const pen = mk(CY(.08, .08, 1.2, 6), MK(0xffd25e, .5), 1.35, 1.25, .1, g); pen.rotation.z = -.4; // bút chì
    g.userData.legs = legs(MK(0x2b1b3d, .5), .4, .65); main = [b];
  } else { // Ma vương Đồ án tốt nghiệp
    const cov = M2(0x3b2160, .5), page = M2(0xfffaf0, .8);
    [-1, 1].forEach(s => { const cv = mk(BX(1.05, 1.5, .18), cov, s * .5, 1.8, 0, g); cv.rotation.y = s * -.45; const pg = mk(BX(.95, 1.38, .14), page, s * .46, 1.8, .1, g); pg.rotation.y = s * -.45; });
    mk(new THREE.PlaneGeometry(.9, 1.15), new THREE.MeshStandardMaterial({map:paperTex("book"), roughness:.8}), 0, 1.8, -.2, g).rotation.y = Math.PI;
    foeEyes(g, 2.05, .35, .25, .13, true, true); mk(BX(.7, .12, .05), MK(0xff4d4d, .4), 0, 1.6, .4, g);
    [-1, 1].forEach(s => { const h = mk(geo("bossHorn", () => new THREE.ConeGeometry(.16, .8, 8)), MK(0x2b1b3d, .4), s * .55, 2.85, 0, g); h.rotation.z = s * -.5; });
    const cr = mk(CY(.38, .4, .25, 10), MK(0xffd25e, .3, .8), 0, 2.75, 0, g); [0, 1, 2, 3, 4].forEach(i => { const a = i / 5 * 6.28; mk(geo("crownTip", () => new THREE.ConeGeometry(.07, .22, 4)), MK(0xffd25e, .3, .8), Math.cos(a) * .32, 2.98, Math.sin(a) * .32, g); });
    g.userData.legs = legs(MK(0x2b1b3d, .5), .4, .75); main = [cr];
  }
  if (type === "boss") outline(g); else { main.forEach(ol); g.traverse(m => { if (m.isMesh) m.castShadow = false; }); }
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = .03; g.add(sh); g.scale.setScalar(c.s); return g;
}
// Vật ném: ảnh 2D xoay tít trong không trung (lốp, dép, chảo); bản tiến hóa có màu lửa
function spinSprite(key, W, tint = 0xffffff) {
  const g = new THREE.Group(), mt = tmpMat(new THREE.SpriteMaterial({map:sprMap(key, false), transparent:true, alphaTest:.05, depthWrite:false, color:tint}));
  const sp = new THREE.Sprite(mt); sp.scale.set(W, W / SPR[key].a, 1); g.add(sp);
  g.userData.sp = {rotation:{get z() { return mt.rotation; }, set z(v) { mt.rotation = v; }}}; return g;
}
function tireMesh(evo, s = 1) { const g = spinSprite("tire", 1.6, evo ? 0xffa060 : 0xffffff); g.scale.setScalar(s * (evo ? 1.2 : 1)); return g; }
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

// ---------- Nhân vật hoạt hình từng khung (sprite sheet) ----------
const ANIM_TEX = {}, ANIM_H = 4.4, ROW = {walk:0, atk:1, idle:2, gun:3, bow:4, hurt:5, dead:6, front:7, back:8, throw2:9, roll:10, win:11};
const ACT_T = {atk:.5, gun:.3, bow:.45, throw2:.4, roll:.45, win:1.3}; // thời lượng mỗi động tác (giây)
function buildAnim(root, key) {
  const A = ANIM[key];
  let tex;
  const tk = key + "_" + (A.sk || 0); tex = ANIM_TEX[tk]; if (!tex) { tex = ANIM_TEX[tk] = new THREE.TextureLoader().load(A.uri); tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; if (A.px) tex.magFilter = tex.minFilter = THREE.NearestFilter; }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, alphaTest:.05, depthWrite:false}));
  const k = (A.px ? 3 : ANIM_H) / A.fh; sp.scale.set(A.cw * k, A.ch * k, 1); sp.center.set(.5, 3 / A.ch); root.add(sp); // chân nằm cách đáy ô 3px
  const bl = new THREE.Mesh(shadowGeo, shadowMat); bl.rotation.x = -Math.PI / 2; bl.position.y = .03; root.add(bl);
  if (A.px) sp.renderOrder = 5.4; R.anim = {A, tex, sp, atk:-1, wt:0, it:0, lastAct:null}; setFrame("idle", 0, false);
  const V = DIR3["p_" + key]; if (V && SV.look !== "2d" && !A.v2) { // kiểu 3D mới: ảnh nhân vật 3 hướng, cử động bằng nhún/nghiêng
    const L = new THREE.TextureLoader(), ld = (u, f) => { const t2 = L.load(u); t2.colorSpace = THREE.SRGBColorSpace; if (f) { t2.wrapS = THREE.RepeatWrapping; t2.repeat.x = -1; t2.offset.x = 1; } return t2; };
    const T = {front:ld(V[0].uri), right:ld(V[1].uri), left:ld(V[1].uri, true), back:ld(V[2].uri)}, H = ANIM_H * .98;
    const d = new THREE.Sprite(new THREE.SpriteMaterial({map:T.front, transparent:true, alphaTest:.05, depthWrite:false})); d.center.set(.5, .01); d.scale.set(H * V[0].a, H, 1); root.add(d); sp.visible = false;
    R.anim.d = {sp:d, T, V, H, v:0};
  }
}
function setFrame(row, col, left) {
  const {A, tex} = R.anim, u = 1 / A.cols, v = 1 / A.rows;
  if (A.fm) { const [rr, cc] = A.fm[row][col] || A.fm[row][0]; tex.repeat.set(left ? -u : u, v); tex.offset.set((left ? cc + 1 : cc) * u, 1 - (rr + 1) * v); return; } // sheet pixel
  tex.repeat.set(left ? -u : u, v); tex.offset.set((left ? col + 1 : col) * u, 1 - (ROW[row] + 1) * v); // lật ngang khi nhìn sang trái
}
function animDir(a, dt) { // nhân vật 3D mới: chọn hướng nhìn, nhún khi đi, bật người khi ra đòn
  const D = a.d; let v = 0, tx = D.T.front; const fx = a.atk >= 0 ? (a.faceL ? -1 : 1) : P.fx, fz = a.atk >= 0 ? 0 : P.fz;
  if (Math.abs(fx) > Math.abs(fz) * .9) { v = 1; tx = fx < 0 ? D.T.left : D.T.right; } else if (fz < 0) { v = 2; tx = D.T.back; }
  D.sp.material.map = tx; const k = a.atk >= 0 ? Math.sin(Math.min(1, a.atk / (ACT_T[a.row] || .4)) * Math.PI) : 0, br = P.mv ? 0 : Math.sin(t * 2.4) * .012;
  D.sp.scale.set(D.H * D.V[v].a * (1 + .1 * k - br), D.H * (1 - .06 * k + br), 1);
  D.sp.material.rotation = P.mv ? Math.sin(P.t * 9) * .05 - P.fx * .05 : k * (a.faceL ? .12 : -.12); D.sp.position.y = P.mv ? Math.abs(Math.sin(P.t * 9)) * .16 : 0;
  D.sp.material.color.setHex(P.inv > 0 && (t * 20 | 0) % 2 ? 0xff9a9a : 0xffffff);
}
function animateAnim(dt) {
  const a = R.anim, A = a.A, own = CH[SV.sel].w; if (a.d) { const r0 = a.atk; animateAnimCore(dt, a, A, own); animDir(a, dt); return; } animateAnimCore(dt, a, A, own);
}
function animateAnimCore(dt, a, A, own) {
  if (a.dieT !== undefined) { a.dieT += dt; setFrame("dead", Math.min(A.n.dead - 1, Math.floor(a.dieT / .9 * A.n.dead)), P.fx < 0); a.sp.position.y = 0; return; } // gục ngã
  if (a.winT !== undefined && A.n.win) { a.winT += dt; setFrame("win", Math.min(5, Math.floor(a.winT / 1.3 * 6)), P.fx < 0); a.sp.position.y = 0; if (a.winT >= 1.3) a.winT = undefined; return; } // đứng dậy hò reo khi hồi sinh
  if (P.roll > 0 && A.n.roll) { setFrame("roll", Math.min(5, Math.floor((1 - P.roll / .45) * 6)), P.rfx < 0); a.sp.position.y = 0; return; } // lăn né
  if (a.hurtT > 0 && A.n.hurt) { a.hurtT -= dt; if (a.atk < 0) { setFrame("hurt", 1 + Math.min(3, Math.floor((.45 - a.hurtT) / .45 * 4)), P.fx < 0); a.sp.position.y = 0; return; } } // trúng đòn
  // động tác mới: ném vũ khí khởi đầu, bắn súng hoặc bắn cung (ưu tiên động tác ném)
  if (P.act && P.act !== a.lastAct) {
    const row = P.act.w === own ? "atk" : P.act.w === "gun" || P.act.w === "bow" ? P.act.w : A.n.throw2 && a.atk < 0 && P.act.w !== "orbit" ? "throw2" : null;
    if (row && !(a.row === "atk" && a.atk >= 0 && row !== "atk")) { a.row = row; a.atk = 0; a.faceL = P.act.ax < 0; }
    a.lastAct = P.act;
  }
  if (a.atk >= 0) { // khi tấn công, nhân vật quay mặt về phía mục tiêu
    a.atk += dt; const T = ACT_T[a.row], n = A.n[a.row]; setFrame(a.row, Math.min(n - 1, Math.floor(a.atk / T * n)), a.faceL);
    R.anim.sp.position.y = P.mv ? Math.abs(Math.sin(P.t * 9)) * .12 : 0; if (a.atk >= T) a.atk = -1;
  }
  else { R.anim.sp.position.y = 0; if (P.mv) { a.wt += dt; const f = Math.floor(a.wt * 12) % A.n.walk; if (A.n.front && Math.abs(P.fz) > Math.abs(P.fx) * 1.3) setFrame(P.fz > 0 ? "front" : "back", f, false); else setFrame("walk", f, P.fx < 0); } else { a.it += dt; setFrame("idle", Math.floor(a.it * 5) % A.n.idle, P.fx < 0); } }
}
// Điểm trên hình nhân vật (cao h, lệch ngang d theo hướng nhìn) quy ra toạ độ 3D: dùng để đạn, mũi tên, vật ném xuất phát đúng tay/nòng súng
const _cu = new THREE.Vector3(), _cr = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
function handPt(h, d, left) {
  const k = (CH[SV.sel].big ? 1.18 : 1) * (R.anim && R.anim.A.px ? .62 : 1), sg = left ? -1 : 1; _cu.set(0, 1, 0).applyQuaternion(cam.quaternion); _cr.set(1, 0, 0).applyQuaternion(cam.quaternion);
  return {x:P.x + (_cu.x * h + _cr.x * d * sg) * k, y:(_cu.y * h + _cr.y * d * sg) * k, z:P.z + (_cu.z * h + _cr.z * d * sg) * k};
}
// Góc trên màn hình của một hướng bay trong thế giới (để xoay ảnh đạn/mũi tên đúng chiều)
function scrAng(x, y, z, dx, dz) { _p1.set(x, y, z).project(cam); _p2.set(x + dx, y, z + dz).project(cam); return Math.atan2((_p2.y - _p1.y) * box.clientHeight, (_p2.x - _p1.x) * box.clientWidth); }
const FXT = {}; const fxTex = (k, i) => { const key = k + i; if (!FXT[key]) { const t = new THREE.TextureLoader().load(FXI[k][i].uri); t.colorSpace = THREE.SRGBColorSpace; if (FXI[k].px) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; } FXT[key] = t; } return FXT[key]; };
// Hiệu ứng nhiều khung (chớp nòng, tia lửa, lông vũ): đổi ảnh theo thời gian rồi mờ dần
function fxAnim(k, x, y, z, w, rot, dur, cx = .5, tint = 0xffffff, cy = .5) {
  const sp = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:fxTex(k, 0), transparent:true, depthWrite:false, depthTest:false, color:tint})));
  sp.center.set(cx, cy); sp.material.rotation = rot; sp.position.set(x, y, z); sp.scale.set(w, w / FXI[k][0].a, 1); sp.renderOrder = 5; scene.add(sp); FM.push({mesh:sp, t:0, dur, fr:k, w, o2:w > 3.4 ? .6 : .9});
}
function fxSprite(k, i, w, rot, cx = .5, tint = 0xffffff) { const sp = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:fxTex(k, i), transparent:true, depthWrite:false, color:tint}))); sp.center.set(cx, .5); sp.material.rotation = rot; sp.scale.set(w, w / FXI[k][i].a, 1); sp.renderOrder = 4; return sp; }

// ---------- Nhân vật khớp xương 2D: mỗi bộ phận là một sprite xoay quanh khớp ----------
const RIG_K = .9, RIG_HIP = 2.45, ROT_SIGN = 1;
const RIG_PARTS = [["uaL","ua",0],["faL","fa",0],["thL","th",1],["shL","sh",1],["ftL","ft",1],
  ["thR","th",1],["shR","sh",1],["ftR","ft",1],["torso","tor",2],["head","hd",3],["uaR","ua",4],["faR","fa",4]];
function pivOf(char, suf) { if (suf === "tor") return char === "me" ? [.5, .816] : [.5, 1]; if (suf === "hd") return [.5, 1]; return [.5, 0]; }
function buildRig(root, char) {
  R.rig = {char, parts: {}};
  for (const [name, suf, layer] of RIG_PARTS) {
    const key = char + "_" + suf, e = SPR[key], pv = pivOf(char, suf);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: sprMap(key, false), transparent: true, alphaTest: .05, depthWrite: false}));
    sp.center.set(pv[0], 1 - pv[1]); sp.scale.set(e.pw / 100 * RIG_K, e.ph / 100 * RIG_K, 1); sp.renderOrder = layer; root.add(sp); R.rig.parts[name] = sp;
  }
  const bl = new THREE.Mesh(shadowGeo, shadowMat); bl.rotation.x = -Math.PI / 2; bl.position.y = .03; bl.scale.set(1.15, 1.15, 1); root.add(bl);
}
const rot2 = (a, x, y) => { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const lerp = (a, b, t) => a + (b - a) * t, ease = t => 1 - Math.pow(1 - t, 3);
function actPose(k, p) { // trả về [ua, fa] cho tay thuận (quy ước: dương = hướng +x), và độ nghiêng thân
  if (k === "throw") return p < .45 ? [lerp(.4, 2.4, p / .45), lerp(.6, 1.7, p / .45)] : [lerp(2.4, .3, (p - .45) / .55), lerp(1.7, .05, (p - .45) / .55)];
  if (k === "swing") return [lerp(.3, 2.5, ease(p)), lerp(1.0, .2, p)];
  return [1.3 - .25 * Math.sin(p * Math.PI), .08 + .2 * Math.sin(p * Math.PI)]; // aim (bắn)
}
function animateRig(dt = 1 / 60) {
  const K = RIG_K, d = P.fx < 0 ? -1 : 1, moving = P.mv, ph = P.t * 9, sw = Math.sin(ph), cw = Math.cos(ph), br = Math.sin(P.t * 2.2) * .025;
  const hold = R.heldKind === "gun" || R.heldKind === "bow", act = P.act, p = act ? Math.min(1, act.t / act.d) : 0;
  const spread = Math.abs(sw), sy = 1 + .03 * (1 - spread) - .04 * spread, lg2 = Math.sin(ph - .6);
  let T = (moving ? .035 * sw : 0) + (R.lean || 0), H = br * .4 - T * 1.2 + (moving ? .03 * Math.sin(ph - .9) : 0), bob = moving ? (.035 * (1 - spread) - .025 * spread) : br, hipX = moving ? .05 * sw : 0;
  let thR = moving ? .5 * sw : .03, thL = moving ? -.5 * sw : -.03, shR = moving ? -.35 * Math.max(0, cw) : 0, shL = moving ? -.35 * Math.max(0, -cw) : 0;
  // tay mặc định: buông hai bên (dương = hướng +x)
  let uaR = .22 + br - (moving ? .25 * lg2 : 0), faR = .35, uaL = -.22 - br + (moving ? .25 * lg2 : 0), faL = -.35;
  const dominantR = d > 0;
  if (act) { const [a1, a2] = actPose(act.k, p); const sn = Math.sin(p * Math.PI); T += d * .2 * sn; if (dominantR) { uaR = d * a1; faR = d * a2; } else { uaL = d * a1; faL = d * a2; } }
  else if (R.heldKind) {
    if (hold) { if (dominantR) { uaR = d * 1.3; faR = d * .08; uaL = d * 1.0; faL = d * .1; } else { uaL = d * 1.3; faL = d * .08; uaR = d * 1.0; faR = d * .1; } }
    else { if (dominantR) { uaR = d * .5; faR = d * .95; } else { uaL = d * .5; faL = d * .95; } }
  }
  // FK 2D (đơn vị gốc, y hướng lên)
  const hip = [hipX, RIG_HIP + bob], neck = add2(hip, rot2(T, 0, 1.55 * sy));
  const shR_ = add2(neck, rot2(T, .72, -.15)), shL_ = add2(neck, rot2(T, -.72, -.15));
  const aUR = T + uaR, aFR = aUR + faR, aUL = T + uaL, aFL = aUL + faL;
  const elR = add2(shR_, rot2(aUR, 0, -.85)), wrR = add2(elR, rot2(aFR, 0, -.8));
  const elL = add2(shL_, rot2(aUL, 0, -.85)), wrL = add2(elL, rot2(aFL, 0, -.8));
  const hipR = add2(hip, [.3, 0]), hipL = add2(hip, [-.3, 0]);
  const aThR = T * .5 + thR, aThL = T * .5 + thL, kneeR = add2(hipR, rot2(aThR, 0, -1.1)), kneeL = add2(hipL, rot2(aThL, 0, -1.1));
  const ankR = add2(kneeR, rot2(aThR + shR, 0, -1.0)), ankL = add2(kneeL, rot2(aThL + shL, 0, -1.0));
  const parts = R.rig.parts, put = (sp, x, y, a) => { sp.position.set(x * K, y * K, 0); sp.material.rotation = a * ROT_SIGN; };
  put(parts.torso, hip[0], hip[1], T); parts.torso.scale.y = (parts.torso.userData.bs ??= parts.torso.scale.y) * sy; put(parts.head, neck[0], neck[1], T + H);
  put(parts.uaR, shR_[0], shR_[1], aUR); put(parts.faR, elR[0], elR[1], aFR);
  put(parts.uaL, shL_[0], shL_[1], aUL); put(parts.faL, elL[0], elL[1], aFL);
  put(parts.thR, hipR[0], hipR[1], aThR); put(parts.shR, kneeR[0], kneeR[1], aThR + shR); put(parts.ftR, ankR[0], ankR[1], 0);
  put(parts.thL, hipL[0], hipL[1], aThL); put(parts.shL, kneeL[0], kneeL[1], aThL + shL); put(parts.ftL, ankL[0], ankL[1], 0);
  // vũ khí cầm tay: gắn vào cổ tay, hướng theo cẳng tay
  const wr = dominantR ? wrR : wrL, aF = dominantR ? aFR : aFL, phi = lagPhi(aF - Math.PI / 2, dt), rr = d > 0 ? phi : phi - Math.PI;
  R.weapon.position.set(wr[0] * K, wr[1] * K, .3); R.weapon.rotation.set(0, 0, 0);
  if (R.held) { const ofs = (R.held.userData.w || 1.4) * .4, fx = Math.cos(phi) * ofs, fy = Math.sin(phi) * ofs; R.held.position.set(fx, fy, 0); R.held.children.forEach(c => c.material.rotation = rr * ROT_SIGN); }
  R.rig.shadow = null;
}

// ---------- Mô hình Mẹ (GLB, xương Mixamo, animation WarriorIdle) ----------
const MOM = {ok: false, scene: null, clip: null};
if (Object.values(CH).some(c => c.model)) new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("mom.glb", g => { // mom.glb đã nén meshopt: 12,5 MB -> 1,6 MB
  const sc0 = g.scene; sc0.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const box = new THREE.Box3().setFromObject(sc0), size = box.getSize(new THREE.Vector3()), k = 4.6 / size.y;
  sc0.scale.setScalar(k); sc0.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(sc0); sc0.position.y = -b2.min.y;
  MOM.scene = sc0; MOM.clip = g.animations.find(a => a.name === "WarriorIdle") || g.animations[0]; MOM.ok = !!MOM.clip;
  if (SV.sel === "me") setChar("me");
}, undefined, err => { MOM.ok = false; console.warn("Không tải được mom.glb, dùng nhân vật 2D thay thế:", err); });
const stub = () => ({visible: false, rotation: {x: 0, y: 0, z: 0}, position: {set() {}}, scale: {set() {}, setScalar() {}}, material: {color: {set() {}}, emissive: {set() {}}}, userData: {}});
function buildModelPlayer(cfg) {
  const root = new THREE.Group(), model = SkeletonUtils.clone(MOM.scene), sq = new THREE.Group(); sq.add(model); root.add(sq);
  const mixer = new THREE.AnimationMixer(model); mixer.clipAction(MOM.clip).play();
  const bn = {}; model.traverse(o => { if (o.isBone) { const nm = o.name.replace(/^mixamorig\d*:?/, "").replace(/_\d+$/, ""); if (/^(Hips|Spine|Spine1|Spine2|Neck|Head|(Left|Right)(Arm|ForeArm|Hand|UpLeg|Leg|Foot))$/.test(nm)) bn[nm] = o; } });
  R.model = {root, model, squash: sq, mixer, bn, t: 0, lean: 0, side: 0}; R.heldPhi = null;
  R.rig = null; R.spr = null; R.body = stub(); R.legs = [stub(), stub()]; R.arms = [stub(), stub()];
  R.wings = [stub(), stub()]; R.pads = [stub(), stub()]; R.cape = stub(); R.badge = stub(); R.band = stub(); R.tails = stub();
  R.glasses = stub(); R.jk = stub(); R.shield = stub(); R.hand = stub();
  R.weapon = new THREE.Group(); root.add(R.weapon); R.held = null;
  const bl = new THREE.Mesh(shadowGeo, shadowMat); bl.rotation.x = -Math.PI / 2; bl.position.y = .03; bl.scale.set(1.2, 1.2, 1); root.add(bl);
  scene.add(root);
  return root;
}
function lagPhi(phi, dt) { if (R.heldPhi == null) R.heldPhi = phi; let df = phi - R.heldPhi; df = Math.atan2(Math.sin(df), Math.cos(df)); R.heldPhi += df * Math.min(1, dt * 7); return R.heldPhi; }
function placeHeld(wr, phi, d, dt = 1 / 60) {
  phi = lagPhi(phi, dt);
  const K = RIG_K, rr = d > 0 ? phi : phi - Math.PI;
  R.weapon.position.set(wr[0] * K, wr[1] * K, .3); R.weapon.rotation.set(0, 0, 0);
  if (R.held) { const ofs = (R.held.userData.w || 1.4) * .4; R.held.position.set(Math.cos(phi) * ofs, Math.sin(phi) * ofs, 0); R.held.children.forEach(c => c.material.rotation = rr); if (R.held.userData.face) R.held.userData.face(d < 0); }
}
const Q_X = new THREE.Vector3(1, 0, 0), Q_Z = new THREE.Vector3(0, 0, 1);
const qRot = (ax, a) => new THREE.Quaternion().setFromAxisAngle(ax, a);
function animateModel(dt) {
  const M = R.model, bn = M.bn, d = P.fx < 0 ? -1 : 1, ph = P.t * 9, sn = Math.sin(ph), cs = Math.cos(ph);
  M.mixer.update(dt);
  const mul = (b, q) => { if (b) b.quaternion.multiply(q); };
  if (P.mv) {
    mul(bn.LeftUpLeg, qRot(Q_X, .45 * sn)); mul(bn.RightUpLeg, qRot(Q_X, -.45 * sn));
    mul(bn.LeftLeg, qRot(Q_X, -.35 * Math.max(0, -cs))); mul(bn.RightLeg, qRot(Q_X, -.35 * Math.max(0, cs)));
  }
  const lagS = Math.sin(ph - .6);
  if (P.mv) { mul(bn.LeftArm, qRot(Q_X, -.3 * lagS)); mul(bn.RightArm, qRot(Q_X, .3 * lagS)); }
  M.lean = (M.lean || 0) + ((P.mv ? .08 : 0) - (M.lean || 0)) * Math.min(1, dt * 6);
  M.side = (M.side || 0) + ((R.lean || 0) - (M.side || 0)) * Math.min(1, dt * 8);
  const spreadM = Math.abs(sn); M.squash.scale.set(1, 1 + .03 * (1 - spreadM) - .04 * spreadM, 1);
  mul(bn.Spine, qRot(Q_X, M.lean)); mul(bn.Spine, qRot(Q_Z, M.side));
  mul(bn.Spine2, qRot(Q_X, .02 * Math.sin(P.t * 2.2)));
  mul(bn.Head, qRot(Q_X, -M.lean * .8)); mul(bn.Head, qRot(Q_Z, -M.side * .8));
  mul(bn.Hips, qRot(Q_Z, (P.mv ? .04 : 0) * sn));
  // tay thuận (phía màn hình theo hướng nhìn): tư thế theo hành động
  const dom = d > 0 ? "Right" : "Left", arm = bn[dom + "Arm"];
  if (P.act) {
    const p = Math.min(1, P.act.t / P.act.d), k = P.act.k;
    if (k === "throw") mul(arm, qRot(Q_Z, d * (p < .45 ? lerp(.2, 1.4, p / .45) : lerp(1.4, -.4, (p - .45) / .55))));
    else if (k === "swing") mul(arm, qRot(Q_Z, d * lerp(.2, 1.3, p)));
    else mul(arm, qRot(Q_Z, d * (.2 + .8 * Math.sin(p * Math.PI))));
  } else if (R.heldKind) mul(arm, qRot(Q_Z, d * .5));
  M.model.updateMatrixWorld(true);
  // vị trí tay cầm vũ khí, đưa về hệ của nhân vật
  const hand = bn[dom + "Hand"], fore = bn[dom + "ForeArm"], v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  if (hand && fore) {
    hand.getWorldPosition(v1); fore.getWorldPosition(v2); M.root.worldToLocal(v1); M.root.worldToLocal(v2);
    placeHeld([v1.x / RIG_K, v1.y / RIG_K], Math.atan2(v1.y - v2.y, v1.x - v2.x), d, dt);
  }
  M.model.rotation.y = P.mv ? (d > 0 ? .35 : -.35) : 0;
}
function setChar(id) { pxApply(id); if (playerMesh) scene.remove(playerMesh); playerMesh = (CH[id].model && MOM.ok) ? buildModelPlayer(CH[id]) : buildPlayer(CH[id]); updateHeld(id, false); applyGear(); }
const pGeo = BX(.2, .2, .2), pMats = {};
function burst(x, z, col, n, sp = 7) {
  const m = pMats[col] = pMats[col] || new THREE.MeshBasicMaterial({color:col});
  for (let i = 0; i < n && PT.length < 160; i++) { const a = Math.random() * 6.28, v = sp * (.3 + Math.random()), mesh = new THREE.Mesh(pGeo, m); mesh.position.set(x, 1.2, z); scene.add(mesh); PT.push({mesh, vx:Math.cos(a) * v, vz:Math.sin(a) * v, vy:3 + Math.random() * 5, t:.4 + Math.random() * .3}); }
}
function floatText(x, y, z, txt, col) { if (FX.length > 10) return; const el = document.createElement("div"); el.className = "ft"; el.textContent = txt; el.style.color = col; box.parentElement.append(el); FX.push({el, p:new THREE.Vector3(x, y, z), t:.8}); }
function ring(x, z, r, col, dur = .3) { const m = new THREE.Mesh(geo("ring", () => new THREE.RingGeometry(.9, 1, 40)), tmpMat(new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.8, side:THREE.DoubleSide}))); m.rotation.x = -Math.PI / 2; m.position.set(x, .25, z); scene.add(m); FM.push({mesh:m, t:0, dur, r1:r}); }
function beam(x, z) { const m = new THREE.Mesh(CY(.25, .25, 14, 8), tmpMat(new THREE.MeshBasicMaterial({color:0xfff3a0, transparent:true, opacity:.9}))); m.position.set(x, 7, z); scene.add(m); FM.push({mesh:m, t:0, dur:.18, r1:0}); }
let AC;
function snd(f, d = .08, type = "square", v = .03, slide = 0) {
  try { AC = AC || new AudioContext(); if (AC.state === "suspended") AC.resume(); const o = AC.createOscillator(), g = AC.createGain(), tt = AC.currentTime; o.type = type; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), tt + d);
    g.gain.setValueAtTime(v, tt); g.gain.exponentialRampToValueAtTime(.001, tt + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(tt + d); } catch {}
}

// ---------- Trạng thái ----------
let EB = [], CANS = [], ZN = [], AURA = null;
let P = null, E = [], G = [], C = [], PJ = [], PT = [], FX = [], FM = [], state = "menu", t = 0, kills = 0, bossKills = 0, score = 0, lvq = 0, spawnT = 0, nextElite = 55, bi = 0, ri = 0, bannerT = 0, hurtT = 0, shake = 0, last = 0, tab = "char", won = false, jo = null;
const keys = {}, camT = {x:0, z:7}, BOSSAT = [170, 330], RINGAT = [60, 140, 220, 300];
const dmgM = () => (1 + SV.up.dmg * .08 + P.pl.dmg * .12) * (CH[SV.sel].dm || 1), cdM = () => Math.max(.4, 1 - P.pl.cdr * .08) * (P.buff > 0 ? .7 : 1) * (DG.on ? .6 : 1), critC = () => (CH[SV.sel].crit || 0) + P.pl.crit * .08;
const projCoins = () => Math.floor(kills * .4 + t / 6 + bossKills * 80 + (won ? 300 : 0));
const banner = txt => { $("banner").textContent = txt; bannerT = 2; };
function h(tag, props = {}, ...kids) { const e = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (k === "onclick") e.onclick = v; else if (k === "cls") e.className = v; else e.setAttribute(k, v); } e.append(...kids.flat()); return e; }

// Vào trận: phủ kín màn hình (cả máy tính lẫn điện thoại); về trang chủ thì trả lại bố cục cũ
function goFull() { const d = document.documentElement; if (!APP && !document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({navigationUI:"hide"}).catch(() => {}); }
let battleOn = false;
function battleTick() {
  const on = state !== "menu"; if (on === battleOn) return; battleOn = on; document.body.classList.toggle("inbattle", on);
  if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
}
function startRun() {
  goFull();
  if (P) Object.values(P.ws).forEach(w => w.ms.forEach(dropFx));
  E.forEach(dropFoe); [...PJ, ...FM, ...EB, ...CANS, ...ZN, ...SWV].forEach(o => dropFx(o.mesh)); PJ.forEach(p => p.esp && dropFx(p.esp)); EB = []; CANS = []; ZN = []; SWV = []; [...G, ...C, ...PT].forEach(o => scene.remove(o.mesh)); FX.forEach(f => f.el.remove()); E = []; G = []; C = []; PJ = []; PT = []; FX = []; FM = [];
  CUR = CHAP[SV.chap] || CHAP[0]; applyMap(CUR);
  const ch = CH[SV.sel], max = Math.round(100 * (ch.hp || 1) * (1 + SV.up.hp * .1)); P = null; setChar(SV.sel);
  P = {x:0, z:7, fx:1, fz:0, hp:max, max, inv:0, t:0, mv:false, xp:0, lvl:1, need:6, rev:SV.up.rev, paid:false, ws:{}, pl:{hp:0, spd:0, mag:0, dmg:0, crit:0, cdr:0, arm:0}};
  t = 0; kills = 0; bossKills = 0; lvq = 0; spawnT = .5; nextElite = 55; bi = 0; ri = 0; won = false; addWeapon(ch.w); updateHeld(SV.sel, true); applyGear(); renderSlots();
  state = "run"; ["menu", "end", "lv"].forEach(i => $(i).hidden = true); $("hud").hidden = false; snd(440, .15, "triangle", .05, 400); dgStart();
}
function addWeapon(id) { P.ws[id] = {lv:1, evo:false, cd:.4, ang:0, ms:[], sig:""}; }
function renderSlots() {
  if (DG.on && P.hand) return $("slots").replaceChildren(...P.hand.map((id, i) => h("span", {cls:i === P.cur ? "on" : "off"}, id ? wIc(id) : "–", id ? (P.ws[id].evo ? "★" : "Lv" + P.ws[id].lv) + (dgCost(id) ? " ⚡" + dgCost(id) : "") : " trống")), ...Object.entries(P.pl).filter(([, v]) => v).map(([id, v]) => h("span", {cls:"p"}, PS[id].ic + v)));
  $("slots").replaceChildren(...Object.entries(P.ws).map(([id, w]) => h("span", {}, wIc(id), w.evo ? "★" : String(w.lv))), ...Object.entries(P.pl).filter(([, v]) => v).map(([id, v]) => h("span", {cls:"p"}, PS[id].ic + v)));
}
function spawnE(type, o = {}) {
  const base = ECFG[type] || ECFG.boss, cfg = o.boss ? {...ECFG.boss, ...(base.shoot ? {shoot:base.shoot} : {}), ...(base.lob ? {lob:base.lob} : {}), ...(base.summon ? {summon:base.summon} : {})} : base; let p = [P.x + 18, P.z];
  for (let i = 0; i < 8; i++) { const an = o.an !== undefined ? o.an : Math.random() * 6.283, ds = o.ds || 17 + Math.random() * 4; p = [clamp(P.x + Math.cos(an) * ds, -MAXX - 2, MAXX + 2), clamp(P.z + Math.sin(an) * ds, -MAXZ - 2, MAXZ + 2)]; if (o.an !== undefined || Math.hypot(p[0] - P.x, p[1] - P.z) >= 13) break; }
  if (o.at) p = DG.on ? [o.at[0], o.at[1]] : [clamp(o.at[0], -MAXX - 2, MAXX + 2), clamp(o.at[1], -MAXZ - 2, MAXZ + 2)];
  const mats = [], mesh = buildFoe(type, mats, !!o.final); if (o.elite) mesh.scale.multiplyScalar(1.35); if (o.sc) mesh.scale.multiplyScalar(o.sc); scene.add(mesh);
  const hp = Math.round(cfg.hp * (cfg.boss ? (o.final ? 2.4 : 1) * (DG.on ? 1 + .25 * SV.chap : 1 + t / 200) : DG.on ? 1 + .35 * (DG.floor - 1) + .2 * SV.chap : 1 + t / 80) * (o.elite ? 4 : 1));
  E.push({...cfg, type, hp, mhp:hp, keep:cfg.boss ? 0 : cfg.keep || 0, r:cfg.r * (o.elite ? 1.3 : 1) * (o.sc ? o.sc * .8 : 1), x:p[0], z:p[1], h:0, w:Math.random() * 6, dt2:1 + Math.random() * 2, boost:0, mesh, mats, elite:!!o.elite, final:!!o.final, dead:false, em:-1});
}
function spawnTick(dt) {
  const cap = Math.min(70, 16 + (t / 4 | 0));
  if ((spawnT -= dt) <= 0 && E.length < cap) { spawnT = 1 / (1.6 + t / 40); for (let i = 0, n = 1 + (t > 90) + (t > 200); i < n; i++) spawnE(pickMob()); }
  if (t >= nextElite) { nextElite += 70; spawnE(CUR.elite, {elite:true}); banner(NAMES[CUR.elite] + " tinh anh! Hạ nó để nhận rương"); }
  if (ri < RINGAT.length && t >= RINGAT[ri]) { ri++; for (let i = 0; i < 24; i++) spawnE(CUR.ring, {an:i / 24 * 6.283, ds:11}); banner("Bầy " + NAMES[CUR.ring] + " vây quanh!"); snd(150, .3, "sawtooth", .05, -60); }
  if (bi < BOSSAT.length && t >= BOSSAT[bi]) { const [k, o] = CUR.boss[bi], fin = bi === 1; spawnE(k, {...o, boss:true, final:fin}); banner((fin ? "TRÙM CUỐI: " : "Trùm: ") + (o.name || (k === "boss" && fin ? NAMES.final : NAMES[k])) + "!"); bi++; }
}
function pickMob() { const tt = DG.on ? [45, 110, 1e9][DG.floor - 1] || 1e9 : t, av = CUR.mobs.filter(m => tt >= (m[2] || 0)), tot = av.reduce((a, m) => a + m[1], 0); let r = Math.random() * tot; for (const m of av) if ((r -= m[1]) <= 0) return m[0]; return av[0][0]; }
function nearest() { let b = null, bd = 1e9; for (const e of E) { if (e.dead) continue; const d = Math.hypot(e.x - P.x, e.z - P.z); if (d < bd) { bd = d; b = e; } } return b; }
function dmg(e, base, kb = 0, fx = 0, fz = 0) {
  if (e.dead) return; const c = Math.random() < critC(), d = Math.round(base * dmgM() * (c ? 2 : 1)); e.hp -= d; e.h = .08;
  if (kb) { const dx = e.x - fx, dz = e.z - fz, l = Math.hypot(dx, dz) || 1, k = e.boss ? kb * .12 : kb; e.x += dx / l * k; e.z += dz / l * k; }
  if (c || (e.boss && Math.random() < .35)) floatText(e.x, 2.8 * e.mesh.scale.x, e.z, String(d), c ? "#ffd25e" : "#fff");
  if (e.hp <= 0) die(e);
}
function die(e) {
  e.dead = true; corpse(e); dropFoe(e); kills++; puff(e.x, e.z, e.boss ? 5 : 1.4 * e.mesh.scale.x); burst(e.x, e.z, ({nhan:0xc9b8f0, hot:0xe8453c, gym:0x6fae4f, boss:0xffd25e, phuthuy:0x3fe0c0, qua:0xff8a2a, batuoc:0xff4fa0, lon:0xffd23f, nuhoang:0xff4a2a, vosi:0xb070ff, ptv:0xffe28a, sep:0xb26bff, mi:0xff9a3a, robot:0x4cc9f0, wifi:0x6a5cff, rua:0x3fffb0, nhan:0xc9b8f0})[e.type] || 0xffffff, e.boss ? 40 : 4, e.boss ? 12 : 6);
  if (e.boom) lonBoom(e); if (e.elite || e.boss || (Math.random() < .012 && CANS.length < 3)) dropCan(e.x + .8, e.z);
  const n = e.boss ? 8 : 1; for (let i = 0; i < n; i++) dropGem(e.x + (Math.random() - .5) * 2 * (n > 1), e.z + (Math.random() - .5) * 2 * (n > 1), e.xp / n * (e.elite ? 3 : 1));
  if ((e.elite || e.boss) && !DG.on) { const m = new THREE.Group(); mk(BX(1.1, .7, .8), MK(0x8a5a3a, .6), 0, .35, 0, m); mk(BX(1.15, .2, .85), MK(0xffd25e, .3, .8), 0, .8, 0, m); mk(BX(.2, .8, .86), MK(0xffd25e, .3, .8), 0, .4, 0, m); m.position.set(e.x, 0, e.z); scene.add(m); C.push({x:e.x, z:e.z, mesh:m}); }
  if (e.boss) { bossKills++; shake = 14; snd(300, .5, "triangle", .08, 400); if (e.final) { won = true; endRun(true); } } else if (Math.random() < .3) snd(480 + Math.random() * 200, .08, "triangle", .02, 200);
}
function dropGem(x, z, v) {
  if (G.length > 150) { P.xp += v * (1 + SV.up.xp * .08); return; }
  const k = v >= 8 ? 2 : v >= 3 ? 1 : 0, m = new THREE.Mesh(gemGeo, gemMats[k]); m.scale.setScalar(1 + k * .5); m.position.set(x, .7, z); scene.add(m); G.push({x, z, v, mesh:m, mag:false});
}

// ---------- Vũ khí tự động ----------
function wOrbit(w, dt) {
  const l = w.lv, cnt = 2 + (l >> 1) + (w.evo ? 2 : 0), R0 = 3.2 + (w.evo ? .8 : 0), sig = cnt + "" + w.evo;
  if (w.sig !== sig) { w.ms.forEach(dropFx); w.ms = Array.from({length:cnt}, () => { const m = tireMesh(w.evo); scene.add(m); return m; }); w.sig = sig; }
  w.ang += dt * (2.6 + l * .25); const d0 = Math.round((8 + 4 * l) * (w.evo ? 2.2 : 1));
  w.ms.forEach((m, i) => { const a = w.ang + i * 6.283 / cnt, x = P.x + Math.cos(a) * R0, z = P.z + Math.sin(a) * R0; m.position.set(x, 1.3, z); m.userData.sp.rotation.z += dt * 8; m.rotation.y = -a;
    for (const e of E) if (!e.dead && t - (e["o" + i] || 0) > .4 && Math.hypot(e.x - x, e.z - z) < e.r + .9) { e["o" + i] = t; dmg(e, d0, .6, x, z); if (!P.act && t - (w.spin || -9) > 2.2) { w.spin = t; act("spin", .45, "orbit"); } } });
}
function wThrow(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, cnt = 1 + (l >= 3) + (l >= 5) + (w.evo ? 2 : 0); w.cd = (1.5 - .12 * l) * cdM(); const a0 = aimAng(tg, P.x, P.z, 14);
  for (let i = 0; i < cnt; i++) { const a = a0 + (i - (cnt - 1) / 2) * .28, m = tireMesh(w.evo, w.evo ? 1.7 : 1.1); m.position.set(P.x, 2, P.z); scene.add(m);
    PJ.push({k:"tire", x:P.x, z:P.z, vx:Math.cos(a) * 14, vz:Math.sin(a) * 14, life:1.5, d:Math.round((14 + 5 * l) * (w.evo ? 2 : 1)), pierce:w.evo ? 99 : 3 + l, hit:new Set(), mesh:m, r:w.evo ? 1.3 : .8}); }
  fromHand("throw", cnt); snd(200, .1, "square", .03, -80); act("throw", .45, "throw", tg.x - P.x);
}
function wHeart(w, dt) {
  w.cd -= dt; if (w.cd > 0 || !E.length) return; const l = w.lv, cnt = 1 + ((l + 1) >> 1) + (w.evo ? 3 : 0); w.cd = (1.7 - .1 * l) * cdM();
  for (let i = 0; i < cnt; i++) { const a = Math.random() * 6.283, m = fxSprite("heart", 0, w.evo ? 2 : 1.6, 0, .72); m.position.set(P.x, 1.4, P.z); scene.add(m); // tim vẽ tay có vệt sáng
    PJ.push({k:"heart", x:P.x, z:P.z, vx:Math.cos(a) * 8, vz:Math.sin(a) * 8, life:3, d:Math.round((16 + 6 * l) * (w.evo ? 1.8 : 1)), rad:2 + (w.evo ? 1.5 : 0), mesh:m, tgt:null}); }
  snd(520, .1, "triangle", .03, 200); const tg = nearest(); act("throw", .45, "heart", tg ? tg.x - P.x : P.fx);
}
function wBolt(w, dt) {
  w.cd -= dt; if (w.cd > 0 || !E.length) return; const l = w.lv, cnt = 1 + (l >> 1) + (w.evo ? 3 : 0), d0 = Math.round((22 + 8 * l) * (w.evo ? 1.8 : 1)), rr = w.evo ? 2.4 : 1.6; w.cd = (2 - .15 * l) * cdM();
  const pool = E.filter(e => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 14);
  for (let i = 0; i < cnt && pool.length; i++) { const e = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], x = e.x, z = e.z; strike(x, z, rr, d0, w.evo); if (tierOf("bolt")) fxAnim("eset_i", x, 0, z, rr * 2.8, 0, .45, .5, 0xffffff, .12); }
  if (pool.length || cnt) act("throw", .45, "bolt", (nearest() || {x:P.x + P.fx}).x - P.x);
  snd(700, .12, "sawtooth", .04, -400);
}
function wWave(w, dt) {
  w.cd -= dt; if (w.cd > 0 || !E.length) return; const l = w.lv, Rm = (4 + .7 * l) * (w.evo ? 1.5 : 1), d0 = Math.round((18 + 7 * l) * (w.evo ? 2 : 1)); w.cd = (3 - .25 * l) * cdM();
  shockwave(P.x, P.z, Rm, w.evo ? 0xffd25e : 0xff7a3d, w.evo); if (tierOf("wave")) fxAnim("esong_i", P.x, 0, P.z, Math.min(7, Rm * .9), 0, .4, .5, 0xffffff, .14); act("throw", .45, "wave", P.fx);
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
function heldSprite(key, w) { const g = facingSprite(key, w, .5); g.position.set(0, 0, 1.2); return g; }
function gunHeld() { return heldSprite("sung", 2.4); }
function bowHeld() { return heldSprite("cung", 1.5); }
function laptopHeld() { return heldSprite("laptop", 1.3); }
function slipperHeld() { return heldSprite("dep", 1.4); }
function panHeld() { return heldSprite("chao", 1.5); }
const HELD_W = {gun:2.4, bow:1.5, laptop:1.4, slipper:1.4, pan:1.5, throw:1.2};
const HELD = {gun:gunHeld, bow:bowHeld, laptop:laptopHeld, slipper:slipperHeld, pan:panHeld, throw:() => heldSprite("tire", 1.2)};
const THROWN = new Set(["throw", "laptop", "slipper", "pan"]); // vũ khí rời tay khi ném
function updateHeld(id, fromRun) {
  // Tay cầm vũ khí có mô hình cầm tay mới nhất trong trận; ngoài trận thì theo nhân vật
  const held = fromRun && P ? Object.keys(P.ws).filter(k => HELD[k]).pop() : null, w = held || CH[id].w;
  if (R.held) R.weapon.remove(R.held); R.held = (HELD[w] || defaultHeld)(); R.weapon.add(R.held); R.heldKind = w; R.held.userData.w = HELD_W[w] || 1.4;
}
function tracer(x1, z1, x2, z2) { const m = new THREE.Mesh(TRG, tmpMat(new THREE.MeshBasicMaterial({color:0xfff1a8, transparent:true, opacity:.9}))); const L = Math.hypot(x2 - x1, z2 - z1); m.scale.set(1, 1, L); m.position.set((x1 + x2) / 2, 1.3, (z1 + z2) / 2); m.rotation.y = Math.atan2(x2 - x1, z2 - z1); scene.add(m); FM.push({mesh:m, t:0, dur:.12, r1:0}); }
function arcRing(x, z, R0, center, half, col) { const g = new THREE.RingGeometry(R0 * .45, R0, 28, 1, -center - half, half * 2); g.userData.own = true; const m = new THREE.Mesh(g, tmpMat(new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.85, side:THREE.DoubleSide}))); m.rotation.x = -Math.PI / 2; m.position.set(x, .6, z); scene.add(m); FM.push({mesh:m, t:0, dur:.2, r1:0}); }
function segDist(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1; const u = clamp(((px - ax) * dx + (pz - az) * dz) / L2, 0, 1); return Math.hypot(ax + dx * u - px, az + dz * u - pz); }
// Hiệu ứng bắn: chớp lửa đầu nòng (sprite cộng sáng), đạn lửa bay thật, tia lửa khi trúng
const FLASH_TEX = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,230,1)"); g.addColorStop(.25, "rgba(255,210,90,.95)"); g.addColorStop(.6, "rgba(255,110,30,.5)"); g.addColorStop(1, "rgba(255,60,0,0)"); x.fillStyle = g;
  x.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 26 : 62, a = i * Math.PI / 8; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
function flash(x, y, z, size, col = 0xffffff, dur = .09) {
  const sp = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:FLASH_TEX, color:col, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false})));
  sp.material.rotation = Math.random() * 6.28; sp.position.set(x, y, z); sp.scale.setScalar(size); scene.add(sp); FM.push({mesh:sp, t:0, dur, r1:size * 1.4});
}
const BULLET_M = [new THREE.MeshBasicMaterial({color:0xfff1a8}), new THREE.MeshBasicMaterial({color:0xff8a1f})], STREAK_M = [0xfff1a8, 0xff8a1f, 0xffffff, 0xffd25e].map(c => new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:.4, blending:THREE.AdditiveBlending, depthWrite:false}));
function bulletMesh(evo) { const g = new THREE.Group(); mk(BX(.13, .13, .7), BULLET_M[evo ? 1 : 0], 0, 0, 0, g).castShadow = false; mk(BX(.09, .09, 1.6), STREAK_M[evo ? 1 : 0], 0, 0, -1, g).castShadow = false; return g; }
function muzzle(a, dist) { return [P.x + Math.cos(a) * dist, P.z + Math.sin(a) * dist]; }
function wGun(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (l >> 1) + (w.evo ? 3 : 0), R0 = 13 + l * .5, base = Math.round((9 + 2 * l) * (w.evo ? 1.5 : 1));
  w.cd = (.42 - .025 * l) * cdM(); const spread = w.evo ? .14 : .07, pierce = w.evo ? 99 : 1 + (l >> 2), left = tg.x < P.x, mz = handPt(2.72, 1.95, left), a0 = aimAng(tg, mz.x, mz.z, 42);
  fxAnim("muzzle", mz.x, mz.y, mz.z, w.evo ? 1.9 : 1.5, scrAng(mz.x, mz.y, mz.z, Math.cos(a0), Math.sin(a0)), .13, .04, w.evo ? 0xffc890 : 0xffffff); // chớp lửa đầu nòng
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * spread + (Math.random() - .5) * .03, m = fxSprite("bullet", 0, w.evo ? 1.4 : 1.1, scrAng(mz.x, mz.y, mz.z, Math.cos(a), Math.sin(a)), .8, w.evo ? 0xffb070 : 0xffffff);
    m.position.set(mz.x, mz.y, mz.z); scene.add(m);
    PJ.push({k:"bullet", x:mz.x, z:mz.z, vx:Math.cos(a) * 42, vz:Math.sin(a) * 42, life:R0 / 42, d:base, pierce, hit:new Set(), mesh:m, r:.3});
  }
  burst(P.x, P.z, 0xffd25e, 1, 3); R.recoil = .35; // vỏ đạn văng
  snd(880, .05, "square", .02, -500); snd(120, .06, "sawtooth", .025, -40); act("aim", .25, "gun", tg.x - P.x);
}
function wBow(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (l >> 2) + (w.evo ? 2 : 0), left = tg.x < P.x, bp = handPt(2.45, 1.7, left), a0 = aimAng(tg, bp.x, bp.z, 24);
  w.cd = (1.25 - .08 * l) * cdM();
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * .12, m = fxSprite("arrow", w.evo ? 1 : 0, 1.9, scrAng(bp.x, bp.y, bp.z, Math.cos(a), Math.sin(a)), .7); m.position.set(bp.x, bp.y, bp.z); m.visible = false; scene.add(m);
    PJ.push({k:"arrow", x:bp.x, z:bp.z, vx:Math.cos(a) * 24, vz:Math.sin(a) * 24, life:1.1, d:Math.round((12 + 4 * l) * (w.evo ? 1.6 : 1)), pierce:w.evo ? 99 : 2 + (l >> 1), hit:new Set(), mesh:m, r:.45, evo:w.evo, wait:R.anim ? .2 : 0}); // mũi tên rời dây ở khung buông tay
  }
  R.recoil = .25; snd(1100, .04, "triangle", .02, -400); snd(300, .08, "triangle", .02, -150); act("aim", .3, "bow", tg.x - P.x);
}
function wLaptop(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (l >> 2) + (w.evo ? 1 : 0), a0 = aimAng(tg, P.x, P.z, 9);
  w.cd = (2.2 - .1 * l) * cdM();
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * .35, m = spinSprite("laptop", 1.35); m.position.set(P.x, 1.9, P.z); scene.add(m);
    PJ.push({k:"laptop", x:P.x, z:P.z, vx:Math.cos(a) * 9, vz:Math.sin(a) * 9, life:1.2, d:Math.round((26 + 8 * l) * (w.evo ? 1.6 : 1)), rad:2.2 + .25 * l, exp:true, col:0x4cc9f0, mesh:m, r:.7, hit:new Set()});
  }
  fromHand("laptop", n); snd(260, .12, "sawtooth", .03, -120); act("throw", .5, "laptop", tg.x - P.x);
}
// Dép: ném thẳng, xoay tít, xuyên qua kẻ địch; bản tiến hóa bay về tay như boomerang
function wSlipper(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (l >= 3) + (l >= 5) + (w.evo ? 1 : 0), a0 = aimAng(tg, P.x, P.z, 15);
  w.cd = (1.05 - .06 * l) * cdM(); const base = Math.round((13 + 5 * l) * (w.evo ? 1.5 : 1));
  for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .3, m = spinSprite("dep", w.evo ? 1.5 : 1.15, w.evo ? 0xffd0a0 : 0xffffff); m.position.set(P.x, 2, P.z); scene.add(m);
    PJ.push({k:"spin", x:P.x, z:P.z, vx:Math.cos(a) * 15, vz:Math.sin(a) * 15, life:w.evo ? 2.2 : .9, d:base, pierce:w.evo ? 99 : 2 + (l >> 1), hit:new Set(), mesh:m, r:.7, kb:1.8, boom:w.evo ? .45 : 0, spd:15}); }
  fromHand("slipper", n); snd(320, .07, "square", .035, -150); act("throw", .4, "slipper", tg.x - P.x);
}
// Chảo: ném như boomerang, bay ra rồi quay về, trúng địch cả lượt đi lẫn lượt về
function wPan(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (w.evo ? 1 : 0), a0 = aimAng(tg, P.x, P.z, 14);
  w.cd = (1.7 - .08 * l) * cdM(); const base = Math.round((20 + 7 * l) * (w.evo ? 1.5 : 1));
  for (let i = 0; i < n; i++) { const a = a0 + i * Math.PI, m = spinSprite("chao", w.evo ? 1.9 : 1.45, w.evo ? 0xffc080 : 0xffffff); m.position.set(P.x, 2, P.z); scene.add(m);
    PJ.push({k:"spin", x:P.x, z:P.z, vx:Math.cos(a) * 14, vz:Math.sin(a) * 14, life:3, d:base, pierce:99, hit:new Set(), mesh:m, r:w.evo ? 1.1 : .85, kb:3, boom:.5 + .03 * l, spd:14, heavy:true}); }
  fromHand("pan", n); snd(180, .12, "triangle", .05, -60); act("throw", .5, "pan", tg.x - P.x);
}
const WF = {thermos:wThermos, pen:wPen, orbit:wOrbit, throw:wThrow, heart:wHeart, bolt:wBolt, wave:wWave, gun:wGun, bow:wBow, laptop:wLaptop, slipper:wSlipper, pan:wPan};
// Vũ khí khởi đầu: vật ném chỉ rời tay ở khung "buông tay" của động tác ném
function fromHand(id, cnt) { if (!R.anim || id !== CH[SV.sel].w) return; for (const p of PJ.slice(-cnt)) { p.wait = R.anim.A.rel || (R.anim.A.v2 ? .3 : .21); p.hand = [2.75, 1.4]; p.mesh.visible = false; } }
function act(k, d, w, ax = P.fx) { P.act = {k, t: 0, d, w, ax}; if (THROWN.has(w) && w === R.heldKind) P.empty = .35; } // ax: hướng ngang tới mục tiêu
function explodeAt(p) { if (p.efx) fxAnim("e" + p.efx + "_i", p.x, 0, p.z, clamp(p.rad * 1.4, 2.4, 5), 0, .4, .5, 0xffffff, .12); if (p.ice) iceZone(p); if (p.nw && p.nw.zone) nwZone(p); if (p.nw && p.nw.slow) for (const e of E) if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) < p.rad + e.r) e.slow = 2; if (p.k === "heart") heartBoom(p); else if (p.k === "laptop") laptopBoom(p); else ring(p.x, p.z, p.rad, p.col || 0xff4d8d); for (const e of E) if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) < p.rad + e.r) { dmg(e, p.d, 1.2, p.x, p.z); if (p.ice) e.slow = 2; if (p.efx) react(e, p.efx, p.d); } snd(160, .15, "square", .05, -70); }
function explode(p) { explodeAt(p); p.exp = false; p.life = 0; }

// ---------- Hiệu ứng nâng cấp: sấm sét, tên lửa tình yêu, sóng xung, nổ máy tính, khói khi hạ địch, lên cấp, rương ----------
const UPV = new THREE.Vector3(0, 1, 0), ADD = THREE.AdditiveBlending;
const HEART_TEX = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); x.beginPath(); x.moveTo(32, 56); x.bezierCurveTo(-6, 30, 10, 2, 32, 18); x.bezierCurveTo(54, 2, 70, 30, 32, 56); x.fillStyle = "#ff5c9a"; x.fill(); x.lineWidth = 5; x.strokeStyle = "#fff0f6"; x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const HEART_GLOW = new THREE.SpriteMaterial({map:FLASH_TEX, color:0xff6fae, transparent:true, blending:ADD, depthWrite:false, opacity:.7});
function part(tex, x, y, z, size, dur, v, tint = 0xffffff, add = false, g = 0) { // hạt sprite bay theo vận tốc rồi nhỏ dần, mờ dần
  const sp = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:tex, color:tint, transparent:true, depthWrite:false, blending:add ? ADD : THREE.NormalBlending})));
  sp.position.set(x, y, z); sp.scale.setScalar(size); sp.material.rotation = Math.random() * .6 - .3; scene.add(sp); FM.push({mesh:sp, t:0, dur, v, g, shrink:size, op:1});
}
function puff(x, z, size = 1.6, y = 1.2) { const sp = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:fxTex("poof", 0), transparent:true, depthWrite:false, depthTest:false}))); sp.position.set(x, y, z); scene.add(sp); FM.push({mesh:sp, t:0, dur:.4, r1:size, op:.9, v:[0, 1, 0]}); }
function lightning(x0, y0, z0, x1, y1, z1, w = 1, col = 0xfff6b0, dur = .24) {
  const g = new THREE.Group(), core = tmpMat(new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, blending:ADD, depthWrite:false})), glow = tmpMat(new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.6, blending:ADD, depthWrite:false}));
  const seg = geo("boltSeg", () => new THREE.CylinderGeometry(1, 1, 1, 5, 1, true)), n = 9, d = new THREE.Vector3();
  const line = (a, b, r) => { d.subVectors(b, a); const len = d.length(); if (len < 1e-3) return; d.normalize(); for (const [m, k] of [[core, 1], [glow, 3.4]]) { const s = new THREE.Mesh(seg, m); s.position.addVectors(a, b).multiplyScalar(.5); s.scale.set(r * k, len, r * k); s.quaternion.setFromUnitVectors(UPV, d); g.add(s); } };
  let prev = new THREE.Vector3(x0, y0, z0);
  for (let i = 1; i <= n; i++) { const t = i / n, j = (1 - t * .5) * 1.1 * w, p = new THREE.Vector3(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t);
    if (i < n) { p.x += (Math.random() - .5) * j; p.z += (Math.random() - .5) * j; p.y += (Math.random() - .5) * j * .3; }
    line(prev, p, .06 * w);
    if (i > 1 && i < n - 1 && Math.random() < .4) { const q = p.clone().add(new THREE.Vector3((Math.random() - .5) * 2.4 * w, -Math.random() * 1.6 * w, (Math.random() - .5) * 2 * w)); line(p, q, .035 * w); } // nhánh phụ
    prev = p; }
  scene.add(g); FM.push({mesh:g, t:0, dur, mats:[core, glow], flick:true, op:1});
}
let flashT = 0; const flashEl = Object.assign(document.createElement("div"), {className:"hurt"}); flashEl.style.background = "#fffbe6"; $("hurt").after(flashEl);
function strike(x, z, rr, d0, evo) { // một tia sét đánh xuống: tia chính + nhánh, chớp sáng, vòng điện, vết cháy
  fxAnim("bolt", x, 0, z, evo ? 4.6 : 3.8, 0, .32, .5, 0xffffff, .02); // tia sét vẽ tay đánh thẳng xuống
  fxAnim("zap", x, .2, z, rr * 2.6, 0, .32, .5, 0xffffff, .25); ring(x, z, rr, 0xfff27a, .3);
  const sc = new THREE.Mesh(geo("scorch", () => new THREE.CircleGeometry(1, 24)), tmpMat(new THREE.MeshBasicMaterial({color:0x2b1b3d, transparent:true, opacity:.45, depthWrite:false}))); sc.rotation.x = -Math.PI / 2; sc.position.set(x, .04, z); sc.scale.setScalar(rr * .8); scene.add(sc); FM.push({mesh:sc, t:0, dur:.9, op:.45});
  for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, v = 4 + Math.random() * 4; part(FLASH_TEX, x, .8, z, .5, .3, [Math.cos(a) * v, 3 + Math.random() * 3, Math.sin(a) * v], 0xfff27a, true, 12); }
  const hit = []; for (const o of E) if (!o.dead && Math.hypot(o.x - x, o.z - z) < rr + o.r) { dmg(o, d0, .4, x, z); hit.push(o); }
  if (evo) { // Thiên lôi: sét lan sang 2 kẻ địch gần nhất
    flashT = Math.max(flashT, .18); let from = {x, z}; const near = E.filter(o => !o.dead && !hit.includes(o) && Math.hypot(o.x - x, o.z - z) < 7).sort((p, q) => Math.hypot(p.x - x, p.z - z) - Math.hypot(q.x - x, q.z - z)).slice(0, 2);
    for (const o of near) { lightning(from.x, 1.4, from.z, o.x, 1.4, o.z, .6, 0xbfe8ff, .2); dmg(o, Math.round(d0 * .6), .3, from.x, from.z); from = o; }
  }
}
function shockwave(x, z, R, col, evo) { // sóng xung: 2 vòng sóng nở ra, đĩa sáng, bụi văng
  const mkRing = (c, dur, r1, op) => { const m = new THREE.Mesh(geo("shock", () => new THREE.RingGeometry(.72, 1, 64)), tmpMat(new THREE.MeshBasicMaterial({color:c, transparent:true, blending:ADD, depthWrite:false, side:THREE.DoubleSide}))); m.rotation.x = -Math.PI / 2; m.position.set(x, .3, z); scene.add(m); FM.push({mesh:m, t:0, dur, r1, op}); };
  mkRing(col, .38, R, .8); fxAnim("shock", x, .3, z, R * 2.5, 0, .45, .5, evo ? 0xffe08a : 0xffffff, .45); // vòng sóng và bụi đá vẽ tay
  if (evo) for (let i = 0; i < 4; i++) { const a = i * 1.57 + Math.random(); lightning(x, .5, z, x + Math.cos(a) * R, .3, z + Math.sin(a) * R, .5, 0xffd25e, .2); }
}
function heartBoom(p) { // tên lửa tình yêu nổ: trái tim tung ra + vòng hồng + chớp
  fxAnim("heartboom", p.x, 1.4, p.z, p.rad * 1.9, 0, .42); ring(p.x, p.z, p.rad, 0xff4d8d, .32);
  for (let i = 0; i < 5; i++) { const a = i / 10 * 6.28, v = 5 + Math.random() * 3; part(HEART_TEX, p.x, 1.4, p.z, .6, .55, [Math.cos(a) * v, 2 + Math.random() * 3, Math.sin(a) * v], 0xffffff, false, 8); }
}
function laptopBoom(p) { // máy tính nổ: chớp điện xanh, tia điện ngắn, khói
  fxAnim("ezap", p.x, .2, p.z, p.rad * 2.2, 0, .5, .5, 0xffffff, .2); ring(p.x, p.z, p.rad, 0x4cc9f0, .3);
  for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28, r = p.rad * (.6 + Math.random() * .5); lightning(p.x, 1, p.z, p.x + Math.cos(a) * r, .3 + Math.random(), p.z + Math.sin(a) * r, .35, 0x7fe0ff, .18); }
  burst(p.x, p.z, 0x4cc9f0, 6, 7);
}
function levelUpFx() { // cột sáng vàng + vòng + chữ
  const m = fxSprite("pillar", 0, 4.4, 0); m.center.set(.5, .04); m.position.set(P.x, 0, P.z); scene.add(m); FM.push({mesh:m, t:0, dur:.9, op:1}); ring(P.x, P.z, 4, 0xffd25e, .5); // cột sáng vẽ tay
  for (let i = 0; i < 10; i++) part(FLASH_TEX, P.x + (Math.random() - .5) * 2, .5, P.z + (Math.random() - .5) * 2, .5, .8, [0, 6 + Math.random() * 4, 0], 0xffe58a, true);
  floatText(P.x, 5, P.z, "LÊN CẤP!", "#ffd25e");
}
function chestFx(x, z) { const c = fxSprite("chest", 0, 2.6, 0); c.position.set(x, 1.4, z); scene.add(c); FM.push({mesh:c, t:0, dur:1.1, op:1, v:[0, 1.2, 0]}); flash(x, 1.2, z, 3, 0xffd25e, .3); ring(x, z, 3, 0xffd25e, .45); [0xe8453c, 0x4cc9f0, 0xffd25e, 0x7fd6c2, 0xff8fa3].forEach(c => burst(x, z, c, 5, 8)); }

// ---------- Hỗ trợ ngắm: đón đầu kẻ địch, đạn tự bám mục tiêu, vòng đánh dấu mục tiêu ----------
// ---------- Hiệu ứng nguyên tố khi nâng cấp vũ khí (bậc 1: cấp 4+, bậc 2: tiến hóa có hào quang dưới chân) ----------
const EVOK = {throw:"lop", slipper:"dep", pan:"chao", gun:"sung", bow:"cung", heart:"tim", bolt:"set", wave:"song", thermos:"binh", pen:"but"};
const EFX_W = {bullet:1.7, arrow:2.4, heart:2.4, tire:2.6, spin:2.4, lob:2.2};
const FLOAT = new Set(["nhan", "final", "qua", "nuhoang", "phuthuy", "wifi"]);
const tierOf = id => { const w = P && P.ws[id]; return !w ? 0 : w.evo ? 2 : w.lv >= 4 ? 1 : 0; };
function elemFx(p, dt) {
  const K = "e" + p.efx, fr = FXI[K + "_p"], W = p.ew || EFX_W[p.k] || 2.2, y = p.mesh.position.y;
  if (!p.esp) { p.esp = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:fxTex(K + "_p", 0), transparent:true, depthWrite:false}))); p.esp.renderOrder = 4; scene.add(p.esp); }
  p.mesh.visible = false; const i = (t * 12 | 0) % fr.length; p.esp.material.map = fxTex(K + "_p", i); p.esp.scale.set(W, W / fr[i].a, 1); p.esp.position.set(p.x, y, p.z);
  const rot = p.esp.material.rotation = scrAng(p.x, y, p.z, p.vx, p.vz);
  if ((p.etr = (p.etr || 0) - dt) <= 0 && FM.length < 150) { p.etr = .08; fxAnim(K + "_t", p.x, y, p.z, W * .9, rot, .3); }
}
function elemHit(p, e) { if (p.nw) nwHit(p, e); react(e, p.efx, p.d); if (FM.length < 150) fxAnim("e" + p.efx + "_i", e.x, 0, e.z, 2.6 * Math.min(2, e.mesh.scale.x), 0, .4, .5, 0xffffff, .12); if (p.efx === "cung" || p.efx === "binh") e.slow = 1.6; }
function auraTick(dt) {
  const ev = Object.keys(P.ws).filter(id => P.ws[id].evo && EVOK[id]).pop();
  if (!ev) { if (AURA) AURA.visible = false; return; }
  const k = "e" + EVOK[ev] + "_a", fr = FXI[k], i = (t * 8 | 0) % fr.length;
  if (!AURA) { AURA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map:fxTex(k, 0), transparent:true, depthWrite:false, opacity:.9})); AURA.rotation.x = -Math.PI / 2; AURA.renderOrder = 1; scene.add(AURA); }
  AURA.visible = true; AURA.material.map = fxTex(k, i); AURA.scale.set(5.2, 5.2 / fr[i].a, 1); AURA.position.set(P.x, .1, P.z); AURA.rotation.z += dt * .9;
}
// ---------- Vũ khí mới (v10): mỗi món một bộ hiệu ứng vẽ tay riêng, 5 kiểu đòn ----------
// t: shot = phóng thẳng (tự bám), lob = ném vòng cung rồi để lại vùng, orbit = xoay quanh người, pulse = sóng lan quanh người, drone = bay theo và phóng điện
const NW = {
  ruler:{n:"Thước Thép Hoàng Kim", ic:"📏", img:"thuoc", fx:"thuoc", t:"orbit", dm:12, n0:2, R:3.4, w:2.6, kb:.8, d:"Thước vàng xoay quanh người, chém mọi yêu quái chạm vào.", evo:"Thước Thần Vạn Trượng", need:"dmg"},
  umb:{n:"Ô Lốc Xoáy", ic:"☂️", img:"o", fx:"o", t:"lob", dm:10, cd:3.2, rad:2.6, zone:"pull", zt:2.6, col:0x8fffd0, d:"Ném ô tạo lốc xoáy hút yêu quái vào giữa và cứa liên tục.", evo:"Bão Ô Thần", need:"mag"},
  mic:{n:"Micro Thần Tượng", ic:"🎤", img:"mic", fx:"mic", t:"pulse", dm:14, cd:2.2, R:6, slow:1, d:"Hát một nốt cao: sóng âm lan ra, làm yêu quái chậm lại.", evo:"Đêm Nhạc Thần Tượng", need:"cdr"},
  badge:{n:"Thẻ Lớp Trưởng", ic:"🪪", img:"the", fx:"the", t:"shot", dm:24, cd:1.6, sp:15, pierce:3, w:2.4, shield:1, rare:1, d:"Phóng thẻ vàng tự tìm mục tiêu; cứ 3 lần phóng tạo 1 lá chắn đỡ đòn.", evo:"Quyền Lực Lớp Trưởng", need:"arm"},
  nonla:{img:"w_nonla", n:"Nón Lá Gió", ic:"👒", fx:"nonla", t:"shot", boom:1, dm:18, cd:1.6, sp:13, pierce:99, kb:2.5, life:2.2, w:2.4, d:"Phi nón lá xoáy gió, bay ra rồi quay về như boomerang.", evo:"Nón Thần Phong", need:"spd"},
  quat:{img:"w_quat", n:"Quạt Bay", ic:"🌀", fx:"quat", t:"orbit", dm:9, n0:1, R:2.6, w:2.4, kb:3, spin:3.4, d:"Quạt có cánh bay vòng quanh, thổi bật yêu quái ra xa.", evo:"Cuồng Phong", need:"hp"},
  am:{img:"w_am", n:"Ấm Siêu Tốc", ic:"🫖", fx:"am", t:"lob", dm:14, cd:2.6, rad:2.4, zone:"burn", zt:2.6, col:0x5ac8ff, d:"Ném ấm nước sôi vỡ thành vũng nước bỏng, sát thương liên tục.", evo:"Thác Nước Sôi", need:"dmg"},
  lau:{img:"w_lau", n:"Cây Lau Nhà Thủy Triều", ic:"🧹", fx:"lau", t:"shot", dm:16, cd:1.5, sp:11, pierce:99, kb:2.5, slow:1, r:1.3, w:2.8, life:1, d:"Quét một vệt nước rộng, xuyên qua tất cả, đẩy lùi và làm chậm.", evo:"Sóng Thần Tổng Vệ Sinh", need:"arm"},
  caplong:{img:"w_caplong", n:"Cặp Lồng Độc", ic:"🍱", fx:"caplong", t:"lob", dm:10, cd:2.8, rad:2.5, zone:"burn", zt:4, col:0x9cff3a, d:"Ném cặp lồng cơm thiu: vũng độc tồn tại lâu, ăn mòn yêu quái.", evo:"Đầm Lầy Độc", need:"mag"},
  sach:{img:"w_sach", n:"Sách Giáo Khoa Địa Chấn", ic:"📕", fx:"sach", t:"lob", dm:40, cd:3, rad:3, slow:1, col:0xd9a35a, d:"Đập sách dày xuống đất: đá vỡ tung, sát thương lớn, làm choáng.", evo:"Địa Chấn Tri Thức", need:"hp"},
  den:{img:"w_den", n:"Đèn Bàn Thần", ic:"💡", fx:"den", t:"shot", dm:15, cd:1.1, sp:22, pierce:5, life:.9, w:2.6, d:"Phóng tia sáng cực nhanh, xuyên 5 kẻ địch.", evo:"Thái Dương Học Bá", need:"crit"},
  mu:{img:"w_mu", n:"Mũ Tốt Nghiệp", ic:"🎓", fx:"mu", t:"shot", dm:30, cd:1.4, sp:14, pierce:2, n0:2, w:2.4, rare:1, d:"Tung 2 mũ tốt nghiệp vàng rực, tự bám mục tiêu, nổ sáng khi trúng.", evo:"Thủ Khoa Toàn Trường", need:"crit"},
  ao:{img:"w_ao", n:"Áo Choàng Bóng Đêm", ic:"🧥", fx:"ao", t:"shot", dm:16, cd:1.3, sp:12, pierce:3, drain:1, w:2.6, d:"Phóng áo choàng bóng tối; mỗi lần trúng hút lại 1 máu.", evo:"Dạ Vương", need:"hp"},
  loa:{img:"w_loa", n:"Loa Kéo Quẩy", ic:"🔊", fx:"loa", t:"pulse", dm:18, cd:3.2, R:7.5, kb:3.5, d:"Mở loa hết cỡ: sóng âm lớn hất văng mọi thứ xung quanh.", evo:"Bass Đập Tung Nóc", need:"dmg"},
  guitar:{img:"w_guitar", n:"Guitar Tỏ Tình", ic:"🎸", fx:"guitar", t:"shot", dm:13, cd:.9, sp:16, pierce:3, spread:.18, w:2.4, d:"Gảy đàn liên tục, nốt nhạc bay xuyên 3 kẻ địch.", evo:"Bản Tình Ca Bất Tận", need:"cdr"},
  butmuc:{img:"w_butmuc", n:"Bút Máy Mực Tàu", ic:"🖋️", fx:"butmuc", t:"shot", dm:11, cd:1, sp:15, pierce:1, n0:3, spread:.3, slow:1, w:2.2, d:"Vẩy 3 tia mực hình quạt, mực làm chậm yêu quái.", evo:"Thư Pháp Đại Sư", need:"spd"},
  sen:{img:"w_sen", n:"Bình Gốm Sen", ic:"🪷", fx:"sen", t:"lob", dm:8, cd:3.5, rad:2.8, zone:"heal", zt:4, col:0xff9fc8, d:"Ném bình gốm nở hoa sen: gây sát thương và hồi máu khi bạn đứng trong vòng.", evo:"Hồ Sen Bất Tử", need:"hp"},
  drone:{img:"w_drone", n:"Drone Sấm Tím", ic:"🛸", fx:"drone", t:"drone", dm:16, cd:1.6, w:1.9, d:"Drone bay theo bạn, phóng sét tím vào kẻ địch gần nhất.", evo:"Phi Đội Drone", need:"cdr"}
};
const WIMG = {throw:"tire", slipper:"dep", pan:"chao", laptop:"laptop", gun:"sung", bow:"cung", thermos:"binh", pen:"but"};
const wIc = id => { const k = PXHELD[id] || (NW[id] ? NW[id].img : WIMG[id]); return k && SPR[k] ? h("img", {src:SPR[k].uri, cls:"wic", alt:""}) : WP[id].ic; };
const lvD = (c, w) => Math.round(c.dm * (1 + .3 * (w.lv - 1)) * (w.evo ? 1.8 : 1)), lvCd = (c, w) => c.cd * (1 - .06 * (w.lv - 1)) * cdM();
let SWV = [];
const NWF = {
  shot(id, c, w, dt) {
    w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; w.cd = lvCd(c, w);
    const sp = c.sp || 13, n = (c.n0 || 1) + (w.lv >= 3) + (w.lv >= 5) + (w.evo ? 1 : 0), a0 = aimAng(tg, P.x, P.z, sp), spr = c.spread || .22;
    for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * spr, m = spinSprite(c.img, 1.1); m.position.set(P.x, 1.6, P.z); scene.add(m);
      PJ.push({k:"spin", x:P.x, z:P.z, vx:Math.cos(a) * sp, vz:Math.sin(a) * sp, life:c.life || 1.3, d:lvD(c, w), pierce:(c.pierce || 2) + (w.evo ? 3 : 0), hit:new Set(), mesh:m, r:(c.r || .8) * (w.evo ? 1.25 : 1), kb:c.kb || 1, efx:c.fx, nw:c, ew:(c.w || 2.2) * (w.evo ? 1.3 : 1), boom:c.boom ? .45 + .03 * w.lv : 0, spd:sp}); }
    if (c.shield && !P.shield && (w.sh = (w.sh || 0) + 1) % 3 === 0) { P.shield = 1; ring(P.x, P.z, 2.2, 0xffd25e, .4); }
    snd(420 + Math.random() * 200, .08, "triangle", .03, 120); act("throw", .4, id, tg.x - P.x);
  },
  lob(id, c, w, dt) {
    w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; w.cd = lvCd(c, w); const cnt = 1 + (w.lv >= 4) + (w.evo ? 1 : 0);
    for (let i = 0; i < cnt; i++) { const e = i === 0 ? tg : E[Math.floor(Math.random() * E.length)]; if (!e || e.dead) continue;
      const dx = e.x - P.x, dz = e.z - P.z, L = Math.hypot(dx, dz) || 1, T = clamp(L / 14, .35, .9), m = spinSprite(c.img, 1.2); m.position.set(P.x, 2, P.z); scene.add(m);
      PJ.push({k:"lob", x:P.x, z:P.z, vx:dx / T, vz:dz / T, life:T, T, mesh:m, exp:true, rad:(c.rad + .15 * w.lv) * (w.evo ? 1.35 : 1), d:lvD(c, w), col:c.col, efx:c.fx, nw:c, ew:2.4}); }
    snd(300, .1, "triangle", .03, -100); act("throw", .45, id, tg.x - P.x);
  },
  orbit(id, c, w, dt) {
    const l = w.lv, cnt = (c.n0 || 2) + (l >> 1) + (w.evo ? 2 : 0), R0 = c.R + (w.evo ? .8 : 0), sig = cnt + "" + w.evo, fk = "e" + c.fx + "_p", fr = FXI[fk];
    if (w.sig !== sig) { w.ms.forEach(dropFx); w.ms = Array.from({length:cnt}, () => { const m = fxSprite(fk, 0, c.w, 0); scene.add(m); return m; }); w.sig = sig; }
    w.ang += dt * (c.spin || 2.5) * (1 + l * .08); const d0 = lvD(c, w), fi = (t * 12 | 0) % fr.length;
    w.ms.forEach((m, i) => { const a = w.ang + i * 6.283 / cnt, x = P.x + Math.cos(a) * R0, z = P.z + Math.sin(a) * R0; m.position.set(x, 1.3, z); m.material.map = fxTex(fk, fi); m.scale.set(c.w, c.w / fr[fi].a, 1); m.material.rotation = scrAng(x, 1.3, z, -Math.sin(a), Math.cos(a));
      for (const e of E) if (!e.dead && t - (e["o" + id + i] || 0) > .5 && Math.hypot(e.x - x, e.z - z) < e.r + .9) { e["o" + id + i] = t; dmg(e, d0, c.kb || .6, x, z); react(e, c.fx, d0); if (FM.length < 150) fxAnim("e" + c.fx + "_i", e.x, 0, e.z, 2.3, 0, .35, .5, 0xffffff, .12); } });
  },
  pulse(id, c, w, dt) {
    w.cd -= dt; if (w.cd > 0) return; const tg = nearest(), R = c.R * (1 + .06 * (w.lv - 1)) * (w.evo ? 1.35 : 1); if (!tg || Math.hypot(tg.x - P.x, tg.z - P.z) > R + 1.5) { w.cd = .25; return; } w.cd = lvCd(c, w);
    const fk = "e" + c.fx + "_a", m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), tmpMat(new THREE.MeshBasicMaterial({map:fxTex(fk, 0), transparent:true, depthWrite:false}))); m.geometry.userData.own = true;
    m.rotation.x = -Math.PI / 2; m.position.set(P.x, .12, P.z); m.renderOrder = 1; scene.add(m); SWV.push({x:P.x, z:P.z, R, t:0, T:.55, d:lvD(c, w), c, mesh:m, fk, hit:new Set()});
    fxAnim("e" + c.fx + "_i", P.x, 0, P.z, 4.2, 0, .45, .5, 0xffffff, .12); snd(c.fx === "loa" ? 110 : 660, .2, "sine", .05, c.fx === "loa" ? -40 : 300); act("throw", .35, id, tg.x - P.x);
  },
  drone(id, c, w, dt) {
    const fk = "e" + c.fx + "_p", fr = FXI[fk], cnt = 1 + (w.lv >= 4) + (w.evo ? 1 : 0), fi = (t * 10 | 0) % fr.length;
    if (w.ms.length !== cnt) { w.ms.forEach(dropFx); w.ms = Array.from({length:cnt}, () => { const m = fxSprite(fk, 0, c.w, 0); scene.add(m); return m; }); }
    w.ang += dt * 1.3; w.ms.forEach((m, i) => { const a = w.ang + i * 6.283 / cnt; m.position.set(P.x + Math.cos(a) * 2.3, 3.3 + Math.sin(t * 3 + i) * .25, P.z + Math.sin(a) * 1.6); m.material.map = fxTex(fk, fi); m.scale.set(c.w, c.w / fr[fi].a, 1); });
    w.cd -= dt; if (w.cd > 0) return; w.cd = lvCd(c, w); const d0 = lvD(c, w); let any = false;
    w.ms.forEach(m => { let b = null, bd = 11; for (const e of E) if (!e.dead) { const dd = Math.hypot(e.x - m.position.x, e.z - m.position.z); if (dd < bd) { bd = dd; b = e; } } if (!b) return; any = true;
      lightning(m.position.x, m.position.y, m.position.z, b.x, .8, b.z, .6, 0xff6bff, .2); fxAnim("e" + c.fx + "_i", b.x, 0, b.z, 3, 0, .4, .5, 0xffffff, .12);
      for (const e of E) if (!e.dead && Math.hypot(e.x - b.x, e.z - b.z) < 1.8 + e.r) { dmg(e, d0, .5, b.x, b.z); react(e, "drone", d0); } });
    if (any) snd(900, .08, "square", .03, -400); else w.cd = .3;
  }
};
// Hệ nguyên tố của từng bộ hiệu ứng; trúng 2 hệ khác nhau trong 3 giây -> phản ứng
const ELM = {lop:"fire", chao:"fire", sung:"fire", cung:"ice", binh:"ice", set:"elec", lap:"elec", drone:"elec", song:"earth", sach:"earth", thuoc:"earth", tim:"light", but:"light", den:"light", mu:"light", the:"light", ao:"dark", butmuc:"dark",
  am:"water", lau:"water", sen:"nature", o:"wind", nonla:"wind", quat:"wind", caplong:"poison", mic:"sound", loa:"sound", guitar:"sound"};
const RXN = {"water+elec":["dien", "ĐIỆN GIẬT", 2.2], "ice+water":["bang", "ĐÓNG BĂNG", 1.6], "earth+ice":["vobang", "VỠ BĂNG", 2.6], "fire+wind":["loclua", "LỐC LỬA", 2.4], "fire+poison":["noc", "NỔ ĐỘC", 2.4],
  "dark+light":["nhat", "NHẬT THỰC", 3], "nature+water":["sen", "SEN NỞ", 1.4], "earth+elec":["diachan", "ĐỊA CHẤN SẤM", 2.4], "fire+ice":["vobang", "TAN CHẢY", 2.2], "elec+wind":["dien", "BÃO SÉT", 2]};
let rxT = 0;
function react(e, fx, base) {
  const el = ELM[fx]; if (!el || e.dead) return;
  if (e.el && e.el !== el && t < e.elT) { const r = RXN[[e.el, el].sort().join("+")]; e.el = null; if (!r) return;
    const [k, nm, mul] = r, d0 = Math.round((base || 15) * mul); if (window.__d) window.__d.rx = (window.__d.rx || 0) + 1; if (FM.length < 160) fxAnim("r_" + k, e.x, 0, e.z, 5.2, 0, .55, .5, 0xffffff, .2);
    for (const o of E) if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.z - e.z) < 3.2 + o.r) { dmg(o, d0 * .6, 1, e.x, e.z); if (k === "bang" || k === "diachan") o.slow = 2.5; }
    if (k === "bang" || k === "diachan") e.slow = 3; if (k === "sen") P.hp = Math.min(P.max, P.hp + 6);
    if (t - rxT > .35) { rxT = t; floatText(e.x, 3.6, e.z, nm + "!", "#9ff3ff"); snd(700, .15, "triangle", .05, 500); } dmg(e, d0, 1.5, e.x, e.z); return; }
  e.el = el; e.elT = t + 3;
}
function nwHit(p, e) { const c = p.nw; if (c.slow) e.slow = 1.5; if (c.drain && P.hp < P.max) P.hp = Math.min(P.max, P.hp + 1); }
function nwZone(p) { // vùng hiệu ứng khi vật ném chạm đất: lốc hút, nước bỏng/độc, hồ sen hồi máu
  const c = p.nw, R = p.rad, fk = "e" + c.fx + "_a", m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), tmpMat(new THREE.MeshBasicMaterial({map:fxTex(fk, 0), transparent:true, depthWrite:false, opacity:.9}))); m.geometry.userData.own = true;
  m.rotation.x = -Math.PI / 2; m.scale.set(R * 2.2, R * 2.2, 1); m.position.set(p.x, .12, p.z); m.renderOrder = 1; scene.add(m); ZN.push({x:p.x, z:p.z, R, d:Math.round(p.d * .35), t:c.zt, tick:0, mesh:m, fk, kind:c.zone});
}
Object.entries(NW).forEach(([id, c]) => {
  if (!c.img) { const f = FXI["e" + c.fx + "_p"][0]; SPR["fx_" + id] = {uri:f.uri, a:f.a}; c.img = "fx_" + id; }
  WP[id] = {n:c.n, ic:c.ic, d:c.d, evo:c.evo, need:c.need, rare:c.rare}; EVOK[id] = c.fx; WF[id] = (w, dt) => NWF[c.t](id, c, w, dt);
});
EVOK.laptop = "lap"; // máy tính ném có bộ hiệu ứng điện xanh riêng
// ---------- Đòn đánh xa của yêu quái ----------
const SHOT_TEX = {};
function shotTex(col) { // quả cầu nguy hiểm: lõi tím đậm, vành màu, viền trắng; khác hẳn hiệu ứng của người chơi
  if (SHOT_TEX[col]) return SHOT_TEX[col]; const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), hx = "#" + col.toString(16).padStart(6, "0"), g = x.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, "#2b1b3d"); g.addColorStop(.38, "#2b1b3d"); g.addColorStop(.55, hx); g.addColorStop(.8, hx + "88"); g.addColorStop(1, hx + "00"); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  x.strokeStyle = "#fff"; x.lineWidth = 3; x.beginPath(); x.arc(32, 32, 17, 0, 6.3); x.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return SHOT_TEX[col] = t;
}
const shotSprite = col => { const m = new THREE.Sprite(tmpMat(new THREE.SpriteMaterial({map:shotTex(col), transparent:true, depthWrite:false, depthTest:false}))); m.renderOrder = 7; return m; };
function foeShot(e) { e.atkT = .55;
  const S0 = e.shoot, n = S0.n || 1, a0 = Math.atan2(P.z - e.z, P.x - e.x);
  for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .3, m = shotSprite(S0.col);
    m.scale.setScalar(1.25); m.position.set(e.x, 1.4, e.z); scene.add(m); EB.push({x:e.x, z:e.z, vx:Math.cos(a) * S0.sp, vz:Math.sin(a) * S0.sp, life:3, d:S0.d, mesh:m}); }
}
function foeLob(e) { e.atkT = .55;
  const L = e.lob, tx = P.x + P.fx * 1.5 + (Math.random() - .5) * 2, tz = P.z + P.fz * 1.5 + (Math.random() - .5) * 2, m = shotSprite(L.col);
  m.scale.setScalar(1.2); m.position.set(e.x, 1, e.z); scene.add(m); ring(tx, tz, L.R, L.col, .9); EB.push({k:"lob", sx:e.x, sz:e.z, tx, tz, f:0, T:.9, life:2, d:L.d, R:L.R, col:L.col, mesh:m});
}
function lonBoom(e) { // lon tăng lực nổ tung: trúng cả yêu quái khác lẫn người chơi đứng gần
  fxAnim("elop_i", e.x, 0, e.z, 4.2, 0, .45, .5, 0xffffff, .12); shake = Math.max(shake, 3); snd(120, .15, "square", .05, -60);
  for (const o of E) if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.z - e.z) < 2.6) dmg(o, 25, 1.5, e.x, e.z);
  if (Math.hypot(P.x - e.x, P.z - e.z) < 2.1) hurtP(8);
}
function dropCan(x, z) { const m = new THREE.Sprite(new THREE.SpriteMaterial({map:sprMap("can", false), transparent:true, alphaTest:.05, depthWrite:false})); m.scale.set(1.1 * SPR.can.a, 1.1, 1); m.position.set(x, .9, z); scene.add(m); CANS.push({x, z, mesh:m}); }
function iceZone(p) { // vùng băng: sát thương liên tục, làm chậm
  const R = p.rad, m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), tmpMat(new THREE.MeshBasicMaterial({map:fxTex("ebinh_a", 0), transparent:true, depthWrite:false, opacity:.9}))); m.geometry.userData.own = true;
  m.rotation.x = -Math.PI / 2; m.scale.set(R * 2.2, R * 2.2, 1); m.position.set(p.x, .12, p.z); m.renderOrder = 1; scene.add(m); ZN.push({x:p.x, z:p.z, R, d:Math.round(p.d * .35), t:3, tick:0, mesh:m});
}
let PRING = null;
function extrasTick(dt) {
  auraTick(dt);
  if (!PRING) { PRING = new THREE.Mesh(new THREE.RingGeometry(.95, 1.2, 40), new THREE.MeshBasicMaterial({color:0xffe9a8, transparent:true, opacity:.65, depthWrite:false})); PRING.rotation.x = -Math.PI / 2; PRING.renderOrder = 2; scene.add(PRING); }
  PRING.position.set(P.x, .07, P.z); PRING.material.color.setHex(P.inv > 0 ? 0xff6a6a : P.shield ? 0xffb300 : P.buff > 0 ? 0xffd23f : 0xffe9a8); PRING.scale.setScalar(P.shield ? 1.25 : 1);
  if (P.buff > 0) { P.buff -= dt; if ((P.bt = (P.bt || 0) - dt) <= 0) { P.bt = .12; burst(P.x, P.z, 0xffd25e, 1, 3); } }
  for (const c of CANS) { c.mesh.position.y = .9 + Math.sin(t * 4 + c.x) * .2; if (Math.hypot(P.x - c.x, P.z - c.z) < 1.5) { c.dead = true; dropFx(c.mesh); P.buff = 8; banner("TĂNG LỰC! Nhanh hơn 8 giây"); ring(P.x, P.z, 3.5, 0xffd25e, .4); snd(880, .2, "triangle", .06, 600); } }
  CANS = CANS.filter(c => !c.dead);
  for (const z of ZN) { z.t -= dt; z.mesh.rotation.z += dt * .6; z.mesh.material.opacity = Math.min(.9, z.t * 1.5); z.mesh.material.map = fxTex(z.fk || "ebinh_a", (t * 8 | 0) % 4);
    if (z.kind === "pull") for (const e of E) { const dx = z.x - e.x, dz = z.z - e.z, dd = Math.hypot(dx, dz); if (!e.dead && !e.boss && dd < z.R * 1.7 && dd > .3) { e.x += dx / dd * 4 * dt; e.z += dz / dd * 4 * dt; } }
    if (z.kind === "heal" && Math.hypot(P.x - z.x, P.z - z.z) < z.R) P.hp = Math.min(P.max, P.hp + 5 * dt);
    if ((z.tick -= dt) <= 0) { z.tick = .5; for (const e of E) if (!e.dead && Math.hypot(e.x - z.x, e.z - z.z) < z.R + e.r) { if (!z.kind) e.slow = 1; dmg(e, z.d, 0); } } }
  ZN = ZN.filter(z => { if (z.t > 0) return true; dropFx(z.mesh); return false; });
  for (const s of SWV) { s.t += dt; const k = Math.min(1, s.t / s.T), r = s.R * k; s.mesh.scale.set(r * 2.3 + .1, r * 2.3 + .1, 1); s.mesh.material.opacity = 1 - k * k; s.mesh.material.map = fxTex(s.fk, (t * 10 | 0) % 4); s.mesh.position.set(s.x, .12, s.z);
    for (const e of E) if (!e.dead && !s.hit.has(e) && Math.hypot(e.x - s.x, e.z - s.z) < r + e.r) { s.hit.add(e); dmg(e, s.d, s.c.kb || .8, s.x, s.z); react(e, s.c.fx, s.d); if (s.c.slow) e.slow = 1.5; } }
  SWV = SWV.filter(s => { if (s.t < s.T) return true; dropFx(s.mesh); return false; });
  for (const b of EB) { b.life -= dt;
    if (b.k === "lob") { b.f += dt / b.T; const k = Math.min(1, b.f); b.mesh.position.set(b.sx + (b.tx - b.sx) * k, 1 + Math.sin(k * Math.PI) * 4, b.sz + (b.tz - b.sz) * k);
      if (k >= 1) { b.life = 0; burst(b.tx, b.tz, b.col, 10, 5); fxAnim("heartboom", b.tx, .2, b.tz, b.R * 2.4, 0, .4, .5, b.col, .2); if (Math.hypot(P.x - b.tx, P.z - b.tz) < b.R && hurtP(b.d)) return; } continue; }
    b.x += b.vx * dt; b.z += b.vz * dt; b.mesh.position.set(b.x, 1.4, b.z); b.mesh.material.rotation += dt * 6; if (DG.on && !canStand(b.x, b.z, 0)) { b.life = 0; continue; }
    if (Math.hypot(P.x - b.x, P.z - b.z) < .85) { b.life = 0; if (hurtP(b.d)) return; } }
  EB = EB.filter(b => { if (b.life > 0) return true; dropFx(b.mesh); return false; });
}
// ---------- Vũ khí hiếm ----------
function wThermos(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, cnt = 1 + (l >= 4) + (w.evo ? 1 : 0); w.cd = (2.8 - .2 * l) * cdM();
  for (let i = 0; i < cnt; i++) { const e = i === 0 ? tg : E[Math.floor(Math.random() * E.length)]; if (!e || e.dead) continue;
    const dx = e.x - P.x, dz = e.z - P.z, L = Math.hypot(dx, dz) || 1, T = clamp(L / 14, .35, .9), m = spinSprite("binh", 1.2); m.position.set(P.x, 2, P.z); scene.add(m);
    PJ.push({k:"lob", x:P.x, z:P.z, vx:dx / T, vz:dz / T, life:T, T, mesh:m, exp:true, ice:true, rad:(2.3 + .2 * l) * (w.evo ? 1.4 : 1), d:Math.round((12 + 4 * l) * (w.evo ? 1.8 : 1)), col:0x7fe3ff}); }
  act("throw", .45, "thermos", tg.x - P.x); snd(330, .1, "triangle", .03, -120);
}
function wPen(w, dt) {
  w.cd -= dt; if (w.cd > 0) return; const tg = nearest(); if (!tg) return; const l = w.lv, n = 1 + (l >= 3) + (w.evo ? 2 : 0), tr = tierOf("pen"); w.cd = (1.8 - .12 * l) * cdM();
  const a0 = aimAng(tg, P.x, P.z, 80), L = 22 + (w.evo ? 8 : 0), d0 = Math.round((16 + 6 * l) * (w.evo ? 1.8 : 1));
  for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .2, x2 = P.x + Math.cos(a) * L, z2 = P.z + Math.sin(a) * L; let c = 0; laser(P.x, P.z, x2, z2, w.evo, tr);
    for (const e of E) if (!e.dead && segDist(e.x, e.z, P.x, P.z, x2, z2) < e.r + .5) { dmg(e, d0, .4, P.x, P.z); if (c++ < 4 && FM.length < 150) fxAnim(tr ? "ebut_i" : "hit", e.x, tr ? 0 : 1.5, e.z, tr ? 2.6 : 1.5, 0, .3, .5, 0xffffff, tr ? .12 : .5); } }
  act("throw", .3, "pen", tg.x - P.x); snd(1300, .08, "square", .03, -700);
}
function laser(x1, z1, x2, z2, evo, tr) {
  const L = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1);
  [[evo ? 0xff3b6b : 0xff2a2a, evo ? 9 : 6], [0xffffff, 2.2]].forEach(([col, k]) => { const m = new THREE.Mesh(TRG, tmpMat(new THREE.MeshBasicMaterial({color:col, transparent:true, opacity:.95, blending:THREE.AdditiveBlending, depthWrite:false})));
    m.scale.set(k, k, L); m.position.set((x1 + x2) / 2, 1.5, (z1 + z2) / 2); m.rotation.y = ry; scene.add(m); FM.push({mesh:m, t:0, dur:.22, op:1}); });
  if (tr) fxAnim("ebut_t", x1 + (x2 - x1) * .12, 1.5, z1 + (z2 - z1) * .12, 3.4, scrAng(x1, 1.5, z1, x2 - x1, z2 - z1), .25);
}
function aimAng(tg, fx, fz, spd) { const t = Math.hypot(tg.x - fx, tg.z - fz) / spd; return Math.atan2(tg.z + (tg.vz || 0) * t * .85 - fz, tg.x + (tg.vx || 0) * t * .85 - fx); }
const HOME = {tire:3.2, spin:3.2, arrow:2.6, bullet:1.8}; // tốc độ bẻ lái (rad/giây)
function homing(p, dt) {
  const turn = HOME[p.k]; if (!turn || p.back) return; const sp = Math.hypot(p.vx, p.vz) || 1, ux = p.vx / sp, uz = p.vz / sp; let best = null, bs = 1e9;
  for (const e of E) { if (e.dead || p.hit && p.hit.has(e)) continue; const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz); if (d > 8 || (dx * ux + dz * uz) / (d || 1) < .35) continue; if (d < bs) { bs = d; best = e; } }
  if (!best) return; const want = Math.atan2(best.z - p.z, best.x - p.x), cur = Math.atan2(uz, ux); let df = Math.atan2(Math.sin(want - cur), Math.cos(want - cur)); df = clamp(df, -turn * dt, turn * dt);
  const a = cur + df; p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp;
  if (p.k === "bullet" || p.k === "arrow") p.mesh.material.rotation = scrAng(p.x, p.mesh.position.y, p.z, p.vx, p.vz);
}
const reticle = new THREE.Mesh(geo("reticle", () => new THREE.RingGeometry(1, 1.22, 32, 1, 0, Math.PI * 1.6)), new THREE.MeshBasicMaterial({color:0xffd25e, transparent:true, opacity:.85, depthWrite:false, side:THREE.DoubleSide}));
reticle.rotation.x = -Math.PI / 2; reticle.visible = false; scene.add(reticle);

// ===================== CHẾ ĐỘ VƯỢT ẢI (v13) =====================
// Mỗi chương = 3 tầng. Mỗi tầng = 6–9 phòng nối bằng hành lang, sắp xếp ngẫu nhiên mỗi lần chơi.
// Vào phòng chiến đấu: cửa khóa, quái ra theo đợt; diệt hết thì cửa mở. Có phòng rương, phòng cổng (qua tầng), tầng 3 có trùm.
const DG_RW = 26, DG_RD = 18, DG_CW = 40, DG_CD = 32, DG_COR = 5, DG_T = 1; // phòng 26x18, lưới 40x32, hành lang rộng 5, tường dày 1
const DG = {on:false, floor:1, rooms:[], cors:[], cur:null, lock:null, waves:0, pend:[], portal:null, grp:new THREE.Group(), boss:null};
scene.add(DG.grp);
const DG_COL = [[0xd8c9a8, 0x8f8a80], [0x7a5236, 0x5e4636], [0x9aa3ad, 0x6c7076], [0x6f8f6a, 0x56705a], [0xc9b9a0, 0x8a8578], [0xb84a3a, 0x6d5e52], [0xd9e4e6, 0x7d8a8c]];
// năng lượng tốn mỗi phát; vũ khí khởi đầu của nhân vật không tốn
const DG_COST = {throw:1, heart:2, bolt:3, wave:3, slipper:1, pan:1, laptop:2, gun:1, bow:1, thermos:3, pen:2, orbit:0};
const dgCost = id => id === CH[SV.sel].w ? 0 : DG_COST[id] ?? (NW[id] ? (NW[id].t === "orbit" || NW[id].t === "melee" ? 0 : NW[id].t === "drone" ? 0 : NW[id].t === "shot" ? 1 : 3) : 2);
const dgPassive = id => id === "orbit" || (NW[id] && (NW[id].t === "orbit" || NW[id].t === "drone")); // vũ khí xoay quanh / drone tự chạy khi đang cầm
const DG_SKILL = {lop:"Lốp lăn thần tốc", ban:"Trái tim chữa lành", hot:"Thiên lôi giáng thế", gym:"Đấm đất chấn động", bo:"Tiếng quát của Bố", me:"Cả nhà xông lên", anh:"Sạc đầy năng lượng"};
let mouseFire = false, touchFire = false;

// ---------- Sinh tầng ----------
function dgGen() {
  const n = 6 + Math.min(2, DG.floor - 1) + (Math.random() < .5 ? 1 : 0), key = (x, z) => x + "," + z, cells = new Map(), list = [], links = [];
  const add = (gx, gz) => { const r = {gx, gz, x:gx * DG_CW, z:gz * DG_CD, w:DG_RW, d:DG_RD, type:"fight", cleared:false, seen:false, nb:[], cors:[], doors:[]}; cells.set(key(gx, gz), r); list.push(r); return r; };
  add(0, 0);
  for (let guard = 0; list.length < n && guard < 600; guard++) {
    const from = list[Math.floor(Math.random() * list.length)], [dx, dz] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)], gx = from.gx + dx, gz = from.gz + dz;
    if (cells.has(key(gx, gz)) || Math.abs(gx) > 3 || Math.abs(gz) > 3) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => cells.has(key(gx + a, gz + b))).length > 1 && Math.random() < .7) continue; // giữ dạng nhánh, ít vòng lặp
    const r = add(gx, gz); links.push([from, r]); from.nb.push(r); r.nb.push(from);
  }
  // phòng xa nhất tính từ phòng đầu: cổng qua tầng hoặc trùm
  const dist = new Map([[list[0], 0]]), q = [list[0]]; while (q.length) { const r = q.shift(); for (const o of r.nb) if (!dist.has(o)) { dist.set(o, dist.get(r) + 1); q.push(o); } }
  const start = list[0], end = list.slice(1).sort((a, b) => dist.get(b) - dist.get(a))[0];
  start.type = "start"; start.cleared = true; end.type = DG.floor >= 3 ? "boss" : "exit"; if (end.type === "boss") { end.w = 32; end.d = 22; }
  const leaves = list.filter(r => r.type === "fight" && r.nb.length === 1), pool = leaves.length ? leaves : list.filter(r => r.type === "fight");
  if (pool.length) pool[Math.floor(Math.random() * pool.length)].type = "chest";
  DG.rooms = list; DG.cors = links.map(([a, b]) => dgCor(a, b));
}
function dgCor(a, b) { // hành lang nối 2 phòng kề nhau, chồng vào trong phòng 1.5 đơn vị để đi qua liền mạch
  const c = {a, b}; a.cors.push(c); b.cors.push(c);
  if (a.gz === b.gz) { const [l, r] = a.x < b.x ? [a, b] : [b, a]; Object.assign(c, {hor:true, x0:l.x + l.w / 2 - 1.5, x1:r.x - r.w / 2 + 1.5, z0:a.z - DG_COR / 2, z1:a.z + DG_COR / 2}); }
  else { const [u, d] = a.z < b.z ? [a, b] : [b, a]; Object.assign(c, {hor:false, x0:a.x - DG_COR / 2, x1:a.x + DG_COR / 2, z0:u.z + u.d / 2 - 1.5, z1:d.z - d.d / 2 + 1.5}); }
  return c;
}
// ---------- Va chạm: chỉ được đứng trong phòng hoặc hành lang chưa bị khóa ----------
const dgBlocked = c => DG.lock && (c.a === DG.lock || c.b === DG.lock);
function canStand(x, z, r) {
  for (const o of DG.rooms) if (x - r >= o.x - o.w / 2 && x + r <= o.x + o.w / 2 && z - r >= o.z - o.d / 2 && z + r <= o.z + o.d / 2) return true;
  for (const c of DG.cors) if (!dgBlocked(c) && x - r >= c.x0 && x + r <= c.x1 && z - r >= c.z0 && z + r <= c.z1) return true;
  return false;
}
function dgMove(o, nx, nz, r) { if (canStand(nx, nz, r)) { o.x = nx; o.z = nz; } else if (canStand(nx, o.z, r)) o.x = nx; else if (canStand(o.x, nz, r)) o.z = nz; }
const dgRoomAt = (x, z, m = 0) => DG.rooms.find(o => Math.abs(x - o.x) <= o.w / 2 - m && Math.abs(z - o.z) <= o.d / 2 - m);

// ---------- Dựng hình: sàn, tường, cửa, đồ vật ----------
function dgClear() {
  DG.grp.traverse(m => { if (m.geometry && m.geometry.userData.own) m.geometry.dispose(); if (m.material && m.material.userData.dg) m.material.dispose(); });
  DG.grp.clear(); OBS.length = 0; DG.portal = null; DG.pend = []; DG.lock = null;
}
function dgBuild() {
  const ci = Math.max(0, CHAP.indexOf(CUR)), [wc, cc] = DG_COL[ci % DG_COL.length], wallM = dgWallM(ci, wc), capM = MK(new THREE.Color(wc).lerp(new THREE.Color(0xffffff), .35).getHex(), .7), corM = MK(cc, .9);
  const floorM = new THREE.MeshStandardMaterial({map:CUR.map ? MAPTEX[CUR.map] : null, color:CUR.map ? 0xffffff : cc, roughness:.85}); floorM.userData.dg = true;
  const plane = (w, d, x, z, m, y = 0) => { const g = new THREE.PlaneGeometry(w, d); g.userData.own = true; const p = new THREE.Mesh(g, m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; DG.grp.add(p); };
  const wall = (x0, x1, z0, z1, hh) => { if (x1 - x0 < .05 || z1 - z0 < .05) return; const g = new THREE.BoxGeometry(x1 - x0, hh, z1 - z0); g.userData.own = true;
    const m = new THREE.Mesh(g, wallM); m.position.set((x0 + x1) / 2, hh / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; DG.grp.add(m);
    const g2 = new THREE.BoxGeometry(x1 - x0 + .12, .16, z1 - z0 + .12); g2.userData.own = true; const c = new THREE.Mesh(g2, capM); c.position.set((x0 + x1) / 2, hh + .08, (z0 + z1) / 2); DG.grp.add(c); };
  const HN = 2.6, HS = .9; // tường phía xa cao, phía gần camera thấp để không che nhân vật
  for (const r of DG.rooms) {
    const x0 = r.x - r.w / 2, x1 = r.x + r.w / 2, z0 = r.z - r.d / 2, z1 = r.z + r.d / 2; plane(r.w, r.d, r.x, r.z, floorM);
    const gaps = {n:[], s:[], w:[], e:[]};
    for (const c of r.cors) { if (c.hor) gaps[c.x0 > r.x ? "e" : "w"].push(r.z); else gaps[c.z0 > r.z ? "s" : "n"].push(r.x); }
    const run = (lo, hi, gs, f) => { let a = lo; gs.sort((p, q) => p - q).forEach(g => { f(a, g - DG_COR / 2); a = g + DG_COR / 2; }); f(a, hi); };
    run(x0 - DG_T, x1 + DG_T, gaps.n, (a, b) => wall(a, b, z0 - DG_T, z0, HN));
    run(x0 - DG_T, x1 + DG_T, gaps.s, (a, b) => wall(a, b, z1, z1 + DG_T, HS));
    run(z0, z1, gaps.w, (a, b) => wall(x0 - DG_T, x0, a, b, HN * .75));
    run(z0, z1, gaps.e, (a, b) => wall(x1, x1 + DG_T, a, b, HN * .75));
    // cửa: thanh năng lượng đỏ chắn ngang lối đi, chỉ hiện khi phòng đang khóa
    for (const c of r.cors) { const dm = new THREE.MeshBasicMaterial({color:0xff4060, transparent:true, opacity:.75}); dm.userData.dg = true; let g, px, pz;
      if (c.hor) { g = new THREE.BoxGeometry(.35, 1.8, DG_COR); px = c.x0 > r.x ? x1 + .5 : x0 - .5; pz = r.z; } else { g = new THREE.BoxGeometry(DG_COR, 1.8, .35); px = r.x; pz = c.z0 > r.z ? z1 + .5 : z0 - .5; }
      g.userData.own = true; const d = pxDoor(c.hor, px, pz, g, dm); if (!d.isSprite) d.position.set(px, .9, pz); d.visible = false; DG.grp.add(d); r.doors.push(d); }
    if (r.type === "fight" || r.type === "exit") dgProps(r, ci);
    if (r.type === "chest") dgChestMesh(r.x, r.z);
  }
  for (const c of DG.cors) { // sàn và hai bức tường của hành lang (phần nằm ngoài phòng)
    if (c.hor) { const a = c.x0 + 1.5, b = c.x1 - 1.5; plane(b - a, DG_COR, (a + b) / 2, (c.z0 + c.z1) / 2, corM, -.01); wall(a, b, c.z0 - DG_T, c.z0, HN); wall(a, b, c.z1, c.z1 + DG_T, HS); }
    else { const a = c.z0 + 1.5, b = c.z1 - 1.5; plane(DG_COR, b - a, (c.x0 + c.x1) / 2, (a + b) / 2, corM, -.01); wall(c.x0 - DG_T, c.x0, a, b, HN * .75); wall(c.x1, c.x1 + DG_T, a, b, HN * .75); }
  }
}
function dgProps(r, ci) { // 2–4 đồ vật của chương đặt sát góc phòng, làm chỗ nấp
  const pool = (PROPL[ci] || []).filter(p => p[4] > 0 && p[3] <= 4.6); if (!pool.length) return;
  const spots = [[-.36, -.3], [.36, -.3], [-.36, .3], [.36, .3], [0, -.33], [-.22, 0], [.22, 0]].sort(() => Math.random() - .5).slice(0, 2 + Math.floor(Math.random() * 3));
  for (const [fx, fz] of spots) { const [k, , , hh, rr] = pool[Math.floor(Math.random() * pool.length)], x = r.x + fx * r.w, z = r.z + fz * r.d;
    if (!PROP_TEX[k]) { const tx = PROP_TEX[k] = new THREE.TextureLoader().load(PROP[k].uri); tx.colorSpace = THREE.SRGBColorSpace; if (PROP[k].px) { tx.magFilter = tx.minFilter = THREE.NearestFilter; tx.generateMipmaps = false; } }
    const mt = new THREE.SpriteMaterial({map:PROP_TEX[k], transparent:true, alphaTest:.08}); mt.userData.dg = true; const m = new THREE.Sprite(mt); m.center.set(.5, .03); m.scale.set(hh * PROP[k].a, hh, 1); m.position.set(x, 0, z); DG.grp.add(m);
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.set(x, .03, z); sh.scale.set(Math.max(.6, hh * PROP[k].a * .55), Math.max(.4, hh * .22), 1); DG.grp.add(sh);
    OBS.push({x, z, r:Math.min(rr, 1.6)}); }
}
function dgChestMesh(x, z) { const pu = DG.floor >= 3 || Math.random() < .2, m = pxSpr(pu ? "chestp" : "chest", 1.6, x, z); scene.add(m); C.push({x, z, mesh:m, purple:pu}); }
function dgPortal(x, z) {
  const g = new THREE.Group(), rm = new THREE.MeshBasicMaterial({color:0x7fe8ff, transparent:true, opacity:.9, side:THREE.DoubleSide}), bm = new THREE.MeshBasicMaterial({color:0x7fe8ff, transparent:true, opacity:.25, depthWrite:false, blending:THREE.AdditiveBlending});
  rm.userData.dg = bm.userData.dg = true; const rg = new THREE.RingGeometry(1.3, 1.7, 40), cg = new THREE.CylinderGeometry(1.5, 1.5, 4, 32, 1, true); rg.userData.own = cg.userData.own = true;
  const ring0 = new THREE.Mesh(rg, rm); ring0.rotation.x = -Math.PI / 2; ring0.position.y = .06; const beam0 = new THREE.Mesh(cg, bm); beam0.position.y = 2; g.add(ring0, beam0); g.position.set(x, 0, z); DG.grp.add(g);
  DG.portal = {x, z, mesh:g}; banner("Cổng qua tầng đã mở! Bước vào vòng sáng"); snd(660, .4, "triangle", .06, 600);
}

// ---------- Vòng chơi ----------
function dgStart() {
  DG.on = true; DG.floor = 1; const ch = CH[SV.sel];
  Object.assign(P, {max:Math.round(6 * (ch.hp || 1)) + Math.floor(SV.up.hp / 3), arm:4, armMax:4, armT:0, armR:0, en:120, enMax:120, hand:[ch.w, pxStart()], cur:0, sk:0, skMax:12});
  P.hp = P.max; ground.visible = false; CAMPUS.forEach(o => o.visible = false); outer.material.color.setHex(0x15101f);
  PROPM.forEach(m => scene.remove(m)); PROPM = []; PROP_OBS = []; dgFloor();
}
function dgFloor() {
  dgClear(); [...C].forEach(c => scene.remove(c.mesh)); C = []; [...PJ, ...EB].forEach(o => dropFx(o.mesh)); PJ = []; EB = []; E.forEach(dropFoe); E = [];
  dgGen(); dgBuild(); P.x = 0; P.z = 0; camT.x = 0; camT.z = 0; DG.cur = DG.rooms[0]; DG.cur.seen = true; DG.cur.nb.forEach(o => o.seen = true);
  banner(`Chương ${SV.chap + 1} – ${CUR.n} · Tầng ${DG.floor}/3` + (DG.floor === 1 ? ": đi qua cửa để vào phòng" : DG.floor === 3 ? ": trùm đang chờ!" : ""));
  renderSlots();
}
function dgTick(dt) {
  // giáp tự hồi khi 3 giây không bị trúng đòn
  P.armT += dt; if (P.armT > 3 && P.arm < P.armMax && (P.armR += dt) > .8) { P.armR = 0; P.arm++; }
  if (P.sk > 0) P.sk -= dt;
  // vào phòng mới
  const r = dgRoomAt(P.x, P.z, 1.3); if (r && r !== DG.cur) { DG.cur = r; r.seen = true; r.nb.forEach(o => o.seen = true); if (!r.cleared && r.type !== "chest") dgEnter(r); }
  if (r && r.type === "chest" && !r.cleared) { r.cleared = true; banner("Phòng rương! Chạm vào rương để chọn vũ khí"); }
  // quái xuất hiện sau vòng cảnh báo
  for (const s of DG.pend) if ((s.t -= dt) <= 0) { spawnE(s.k, {at:[s.x, s.z], elite:s.elite}); puff(s.x, s.z, 1.6); }
  DG.pend = DG.pend.filter(s => s.t > 0);
  const L = DG.lock; if (L && !DG.pend.length && !E.some(e => !e.dead)) { if (DG.waves > 0) dgWave(L); else dgCleared(L); }
  if (DG.portal) { const p = DG.portal; p.mesh.rotation.y += dt; p.mesh.children[1].material.opacity = .2 + .1 * Math.sin(t * 5);
    if (Math.hypot(P.x - p.x, P.z - p.z) < 1.6) { DG.portal = null; dgCards(`Qua Tầng ${DG.floor}! Chọn 1 phúc lợi`, dgBuffs(), () => { DG.floor++; dgFloor(); }); } }
}
function dgEnter(r) {
  DG.lock = r; r.doors.forEach(d => d.visible = true); snd(160, .25, "sawtooth", .05, -40); shake = Math.max(shake, 4);
  if (r.type === "boss") { DG.waves = 0; const [k, o] = CUR.boss[1]; spawnE(k, {...o, boss:true, final:true, at:[r.x, r.z - r.d * .25]}); banner("TRÙM CUỐI: " + (o.name || (k === "boss" ? NAMES.final : NAMES[k])) + "!"); return; }
  DG.waves = (DG.floor >= 2 ? 3 : 2) + (r.type === "exit" ? 1 : 0); dgWave(r);
}
function dgWave(r) {
  DG.waves--; const n = 4 + DG.floor * 2 + SV.chap + (r.type === "exit" ? 2 : 0), last = DG.waves === 0;
  for (let i = 0; i < n; i++) { let x = 0, z = 0; for (let k = 0; k < 12; k++) { x = r.x + (Math.random() - .5) * (r.w - 4); z = r.z + (Math.random() - .5) * (r.d - 4); if (Math.hypot(x - P.x, z - P.z) > 6) break; }
    const elite = last && i === 0 && (DG.floor >= 2 || r.type === "exit"); DG.pend.push({k:elite ? CUR.elite : pickMob(), x, z, t:.7 + Math.random() * .4, elite}); ring(x, z, elite ? 2 : 1.2, 0xff3050, .9); }
}
function dgCleared(r) {
  r.cleared = true; DG.lock = null; r.doors.forEach(d => d.visible = false); P.en = Math.min(P.enMax, P.en + 15); snd(660, .3, "triangle", .06, 500);
  if (r.type === "exit") dgPortal(r.x, r.z); else { banner("Phòng đã sạch! +15 năng lượng"); if (Math.random() < .3) dgChestMesh(r.x, r.z); }
}
function dgCards(title, ops, done) {
  state = "lv"; keysClear(); $("lvt").textContent = title + " (phím 1–3)";
  $("lvc").replaceChildren(...ops.map(o => h("button", {cls:"card", onclick:() => { o.f(); $("lv").hidden = true; state = "run"; renderSlots(); if (done) done(); }}, h("i", {}, o.ic), h("b", {}, o.t), h("small", {}, o.d))));
  $("lv").hidden = false; snd(600, .25, "triangle", .06, 500);
}
function dgChest() { // rương: chọn 1 trong 3 vũ khí (trùng vũ khí đang cầm thì nâng cấp)
  const all = Object.keys(WP).filter(id => (!WP[id].rare || rareOwn(id)) && !(MW[id] && MW[id].hi && DG.floor < 2)), pick = all.sort(() => Math.random() - .5).slice(0, 3);
  dgCards("Rương vũ khí! Chọn 1 món", pick.map(id => { const own = P.ws[id];
    return {ic:wIc(id), t:own ? `${WP[id].n} Lv${own.lv} → Lv${Math.min(5, own.lv + 1)}` : WP[id].n + ` (⚡${dgCost(id)}/phát)`, d:own ? "Nâng cấp vũ khí đang cầm" : WP[id].d + (P.hand.every(Boolean) ? " Thay cho vũ khí đang cầm." : ""),
      f:() => { fxAnim("px_nhat_vat", P.x, 0, P.z, 3.4, 0, .7, .5, 0xffffff, .08); if (own) { if (own.lv < 5) own.lv++; else own.evo = true; return; } const slot = P.hand.indexOf(null) >= 0 ? P.hand.indexOf(null) : P.cur, old = P.hand[slot];
        if (old && P.ws[old]) { P.ws[old].ms.forEach(dropFx); delete P.ws[old]; } P.hand[slot] = id; P.cur = slot; addWeapon(id); updateHeld(SV.sel, true); }}; }));
}
function dgBuffs() {
  const L = [{ic:pxIc("heart"), t:"Ngủ đủ giấc", d:"+1 tim tối đa, hồi đầy máu", f:() => { P.max++; P.hp = P.max; }}, {ic:pxIc("shield"), t:"Áo khoác dày", d:"+1 giáp tối đa", f:() => { P.armMax++; P.arm = P.armMax; }},
    {ic:pxIc("book"), t:"Học bổng", d:"+12% sát thương", f:() => P.pl.dmg++}, {ic:pxIc("potion"), t:"Cà phê sữa đá", d:"Bắn nhanh hơn 8%", f:() => P.pl.cdr++}, {ic:"🕶️", t:"Kính râm", d:"+8% chí mạng", f:() => P.pl.crit++},
    {ic:"👟", t:"Giày chạy", d:"+8% tốc độ chạy", f:() => P.pl.spd++}, {ic:pxIc("battery"), t:"Sạc dự phòng", d:"+40 năng lượng tối đa, nạp đầy", f:() => { P.enMax += 40; P.en = P.enMax; }}];
  return L.sort(() => Math.random() - .5).slice(0, 3);
}
function dgSwap() { if (state !== "run" || !P || !P.hand[1 - P.cur]) return; P.cur = 1 - P.cur; updateHeld(SV.sel, true); renderSlots(); snd(500, .06, "square", .03, 100); }
function dgWeapons(dt) {
  const wid = P.hand[P.cur], fire = keys.j || mouseFire || touchFire;
  for (const [id, w] of Object.entries(P.ws)) if (id !== wid) w.ms.forEach(m => m.visible = false);
  const w = wid && P.ws[wid]; if (!w) return; w.ms.forEach(m => m.visible = true); const cost = dgCost(wid);
  if (!dgPassive(wid) && !fire) { w.cd = Math.max(0, w.cd - dt); return; }
  if (cost > P.en) { if (fire && (P.noEn = (P.noEn || 0) - dt) <= 0) { P.noEn = 1.2; floatText(P.x, 4, P.z, "Hết năng lượng!", "#4cc9f0"); } return; }
  const cd0 = w.cd, n0 = PJ.length; WF[wid](w, dt); if (EVOK[wid] && tierOf(wid)) for (let i = n0; i < PJ.length; i++) PJ[i].efx = EVOK[wid];
  if (cost && w.cd > cd0 + 1e-6) P.en = Math.max(0, P.en - cost);
}
function dgHurt(base) { // trả về true nếu gục. Mỗi đòn mất 1 (trùm, tinh anh: 2); giáp đỡ trước
  let dm = base >= 25 ? 2 : 1; P.armT = 0; P.armR = 0;
  const a = Math.min(P.arm, dm); P.arm -= a; dm -= a; P.hp -= dm; P.inv = .8; hurtT = .3; shake = Math.max(shake, 6); snd(90, .2, "sawtooth", .06, -40); burst(P.x, P.z, a && !dm ? 0x9aa3b5 : 0xe8453c, 8);
  floatText(P.x, 4, P.z, a && !dm ? "-🛡" : "-❤", a && !dm ? "#dfe6f0" : "#ff8a8a"); if (R.anim) R.anim.hurtT = .45;
  if (P.hp <= 0) { playerDown(); return true; } return false;
}
// ---------- HUD và bản đồ nhỏ ----------
const dgBars = h("div", {cls:"dgbars"}, h("div", {cls:"dgb hp"}, h("i", {id:"dghp"}), h("span", {id:"dghpt"})), h("div", {cls:"dgb arm"}, h("i", {id:"dgarm"}), h("span", {id:"dgarmt"})), h("div", {cls:"dgb en"}, h("i", {id:"dgen"}), h("span", {id:"dgent"})));
$("hud").prepend(dgBars);
function dgHud() {
  $("dghp").style.width = Math.max(0, P.hp / P.max * 100) + "%"; $("dghpt").textContent = `❤ ${Math.max(0, P.hp)}/${P.max}`;
  $("dgarm").style.width = P.arm / P.armMax * 100 + "%"; $("dgarmt").textContent = `🛡 ${P.arm}/${P.armMax}`;
  $("dgen").style.width = P.en / P.enMax * 100 + "%"; $("dgent").textContent = `⚡ ${Math.floor(P.en)}/${P.enMax}`;
  $("lvl").textContent = `Tầng ${SV.chap + 1}-${DG.floor}`; $("tm").textContent = fmt(t); $("kl").textContent = "☠ " + kills; $("cn").textContent = "💰 +" + projCoins();
  skillBtn.style.opacity = P.sk > 0 ? .45 : 1; skillBtn.textContent = P.sk > 0 ? Math.ceil(P.sk) : "★";
}
function dgMini() {
  const W = 120, H = 88; mx.clearRect(0, 0, W, H); mx.fillStyle = "rgba(21,16,31,.75)"; mx.fillRect(0, 0, W, H);
  const seen = DG.rooms.filter(r => r.seen); if (!seen.length) return; const gx = seen.map(r => r.gx), gz = seen.map(r => r.gz), cx = (Math.min(...gx) + Math.max(...gx)) / 2, cz = (Math.min(...gz) + Math.max(...gz)) / 2, S = 15;
  const X = v => W / 2 + (v - cx) * S * 1.25, Z = v => H / 2 + (v - cz) * S;
  mx.strokeStyle = "rgba(255,255,255,.55)"; mx.lineWidth = 2; for (const c of DG.cors) if (c.a.seen && c.b.seen) { mx.beginPath(); mx.moveTo(X(c.a.gx), Z(c.a.gz)); mx.lineTo(X(c.b.gx), Z(c.b.gz)); mx.stroke(); }
  for (const r of seen) { mx.fillStyle = r === DG.cur ? "#ffd25e" : r.cleared ? "#cfc6e6" : "#6c5a8a"; mx.fillRect(X(r.gx) - 7, Z(r.gz) - 5, 14, 10);
    const ic = r.type === "chest" ? "#f0a020" : r.type === "boss" ? "#e8453c" : r.type === "exit" ? "#4cc9f0" : null; if (ic) { mx.fillStyle = ic; mx.beginPath(); mx.arc(X(r.gx), Z(r.gz), 3, 0, 7); mx.fill(); } }
  const pr = DG.cur; if (pr) { mx.fillStyle = "#fff"; mx.strokeStyle = "#2b1b3d"; mx.lineWidth = 1.5; mx.beginPath(); mx.arc(X(pr.gx) + (P.x - pr.x) / pr.w * 12, Z(pr.gz) + (P.z - pr.z) / pr.d * 8, 2.6, 0, 7); mx.fill(); mx.stroke(); }
}
// ---------- Nút cảm ứng ----------
const tBtn = (cls, txt, lab) => { const b = h("button", {cls:"pbtn tbtn " + cls, "aria-label":lab}, txt); box.parentElement.append(b); return b; };
const fireBtn = tBtn("fire", "🎯", "Bắn"), skillBtn = tBtn("skill", "★", "Kỹ năng"), swapBtn = tBtn("swap", "⇄", "Đổi vũ khí");
fireBtn.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); touchFire = true; try { fireBtn.setPointerCapture(e.pointerId); } catch {} });
["pointerup", "pointercancel", "lostpointercapture"].forEach(k => fireBtn.addEventListener(k, () => { touchFire = false; }));
skillBtn.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); dgSkill(); });
swapBtn.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); dgSwap(); });

// ===================== v14: VŨ KHÍ CẬN CHIẾN, VŨ KHÍ CẦM TAY PIXEL, KỸ NĂNG MỚI =====================
// Vũ khí cận chiến: giữ nút bắn để vung về phía yêu quái gần nhất; không tốn năng lượng. hi:1 = chỉ rơi từ tầng 2 trở đi.
const MW = {
  m_kiem_thuoc:{n:"Kiếm Thước Kẻ", ic:"📏", img:"kiem_thuoc", dm:16, cd:.36, R:3.3, arc:2.2, kb:1.2, fx:"chem_kiem", len:2.4, d:"Vung thước kẻ chém vòng cung trước mặt."},
  m_kiem_tre:{n:"Kiếm Tre", ic:"🎋", img:"kiem_tre", dm:13, cd:.28, R:3.1, arc:2.2, kb:1, fx:"chem_kiem", tint:0xc8ffb0, len:2.3, d:"Kiếm tre nhẹ tay, chém rất nhanh."},
  m_ma_tau:{n:"Đao Mã Tấu", ic:"🔪", img:"ma_tau", dm:22, cd:.48, R:3.5, arc:2.4, kb:1.6, fx:"quet_dao", rot:-1.5708, len:2.5, d:"Lưỡi đao to, quét một vệt lửa rộng."},
  m_song_dao:{n:"Song Đao Hồi", ic:"⚔️", img:"song_dao", dm:11, cd:.3, R:3, arc:2, kb:.8, hits:2, fx:"song_dao", len:1.9, d:"Hai lưỡi đao chém chéo, mỗi nhát trúng 2 lần."},
  m_yen_nguyet:{n:"Yển Nguyệt Đao", ic:"🌙", img:"yen_nguyet", dm:34, cd:.66, R:4.6, arc:2.6, kb:2.4, fx:"quet_dao", rot:-1.5708, len:3.4, hi:1, d:"Đại đao đầu rồng: tầm rất xa, quét cả đám."},
  m_thuong_tre:{n:"Thương Tre", ic:"🔱", img:"thuong_tre", dm:20, cd:.42, R:5.2, arc:.55, kb:1.4, fx:"dam_thuong", thrust:1, len:3.2, d:"Đâm thẳng rất xa, xuyên cả hàng yêu quái."},
  m_bua_dinh:{n:"Búa Gõ Đinh", ic:"🔨", img:"bua_dinh", dm:26, cd:.62, R:3, arc:2, kb:1.5, fx:"dap_bua", ground:1, slow:1, len:1.9, d:"Nện búa xuống đất: sát thương vùng, làm choáng."},
  m_bua_ta:{n:"Búa Tạ Phòng Gym", ic:"🏋️", img:"bua_ta", dm:38, cd:.9, R:3.4, arc:2.2, kb:3.5, fx:"dap_bua", ground:1, len:2.2, d:"Búa tạ cực nặng, hất văng yêu quái."},
  m_bua_sam:{n:"Búa Thần Sấm", ic:"⚡", img:"bua_sam", dm:40, cd:.85, R:3.6, arc:2.2, kb:2.5, fx:"set_bua", ground:1, bolt:3, hi:1, len:2.4, d:"Nện búa gọi sét đánh thêm 3 yêu quái quanh đó."},
  m_gay:{n:"Gậy Bóng Chày", ic:"⚾", img:"gay", dm:18, cd:.46, R:3.2, arc:2.2, kb:5, fx:"chem_kiem", tint:0xffd8a0, len:2.3, d:"Đánh bật yêu quái bay thật xa."},
  m_con:{n:"Côn Nhị Khúc", ic:"🥢", img:"con", dm:9, cd:.2, R:2.9, arc:6.3, kb:.7, fx:"xoay_con", spin:1, len:2, d:"Xoay côn quanh người, đánh mọi hướng liên tục."},
  m_quat:{n:"Quạt Thép", ic:"🪭", img:"quat", dm:15, cd:.42, R:3.6, arc:2.6, kb:3, fx:"quet_dao", rot:-1.5708, tint:0xffc0c0, len:1.8, d:"Phẩy quạt thép: vừa chém vừa thổi lùi yêu quái."},
  m_choi:{n:"Chổi Rơm Thần", ic:"🧹", img:"choi", dm:12, cd:.38, R:3.9, arc:2.8, kb:3.2, fx:"quet_dao", rot:-1.5708, tint:0xfff0a0, len:2.6, d:"Quét chổi thật rộng, đẩy lùi cả đám."},
  m_thuan_thien:{n:"Kiếm Thuận Thiên", ic:"🗡️", img:"thuan_thien", dm:42, cd:.42, R:3.8, arc:2.4, kb:2, fx:"chem_kiem", tint:0xb0ffc0, qi:1, hi:1, len:2.8, d:"Thần kiếm Hồ Gươm: mỗi nhát chém phóng thêm một luồng kiếm khí xanh."}
};
const PX_START = {lop:"m_kiem_thuoc", ban:"m_quat", hot:"m_con", gym:"m_bua_ta", bo:"m_gay", me:"m_choi", anh:"m_kiem_tre"}; // vũ khí cận chiến khởi đầu ở tay thứ hai
for (const [id, c] of Object.entries(MW)) {
  c.t = "melee"; c.img = "px_" + c.img; NW[id] = c; PXHELD[id] = c.img;
  WP[id] = {n:c.n, ic:c.ic, d:c.d + " Cận chiến, không tốn năng lượng.", evo:c.n + " ★", need:"dmg"}; WF[id] = (w, dt) => pxMelee(id, c, w, dt);
}
// Ống phóng pháo hoa: ném vòng cầu, nổ tung thành pháo hoa
NW.phaohoa = {n:"Ống Phóng Pháo Hoa", ic:"🎆", img:"px_phao_hoa", fx:"phao", t:"lob", dm:26, cd:2.2, rad:2.8, col:0xffd25e, d:"Bắn pháo hoa Tết, nổ tung thành mưa sao.", evo:"Đêm Giao Thừa", need:"dmg"};
WP.phaohoa = {n:NW.phaohoa.n, ic:"🎆", d:NW.phaohoa.d, evo:NW.phaohoa.evo, need:"dmg"}; EVOK.phaohoa = "phao"; ELM.phao = "fire"; WF.phaohoa = (w, dt) => NWF.lob("phaohoa", NW.phaohoa, w, dt);
DG_COST.phaohoa = 3;
Object.assign(DG_SKILL, {lop:"Lốp Lăn Thần Tốc + Vòng Lốp Hộ Thể", ban:"Mưa Tim + Lá Chắn Tình Bạn", hot:"Thiên Lôi + Ảo Ảnh Điển Trai", gym:"Đấm Đất Chấn Động + Siêu Cơ Bắp",
  bo:"Tiếng Quát Của Bố + Mưa Dép", me:"Chảo Xoáy + Cả Nhà Xông Lên", anh:"Quá Tải Máy Chủ + Sạc Đầy"});
function pxStart() { const m = PX_START[SV.sel]; if (m && WP[m] && !P.ws[m]) addWeapon(m); return m || null; }
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const pxAim = () => { const tg = nearest(), dd = tg ? Math.hypot(tg.x - P.x, tg.z - P.z) : 1e9; return {tg, dd, a:tg && dd < 14 ? Math.atan2(tg.z - P.z, tg.x - P.x) : Math.atan2(P.fz || 0, P.fx || 1)}; };

// ===================== v18: VŨ KHÍ VUNG VẼ TAY TỪNG KHUNG + VA CHẠM + KỸ NĂNG VẼ TAY =====================
const PXSW = {"m_kiem_thuoc":{"fr":[IP[1095],IP[1096],IP[1097],IP[1098],IP[1099],IP[1100]],"r":1.246},"m_kiem_tre":{"fr":[IP[1101],IP[1102],IP[1103],IP[1104],IP[1105],IP[1106]],"r":1.293},"m_ma_tau":{"fr":[IP[1107],IP[1108],IP[1109],IP[1110],IP[1111],IP[1112]],"r":1.331},"m_song_dao":{"fr":[IP[1113],IP[1114],IP[1115],IP[1116],IP[1117],IP[1118]],"r":1.095},"m_yen_nguyet":{"fr":[IP[1119],IP[1120],IP[1121],IP[1122],IP[1123],IP[1124]],"r":1.138},"m_thuong_tre":{"fr":[IP[1125],IP[1126],IP[1127],IP[1128],IP[1129],IP[1130]],"r":1.16},"m_bua_dinh":{"fr":[IP[1131],IP[1132],IP[1133],IP[1134],IP[1135],IP[1136]],"r":1.204},"m_bua_ta":{"fr":[IP[1137],IP[1138],IP[1139],IP[1140],IP[1141],IP[1142]],"r":1.022},"m_bua_sam":{"fr":[IP[1143],IP[1144],IP[1145],IP[1146],IP[1147],IP[1148]],"r":1.294},"m_gay":{"fr":[IP[1149],IP[1150],IP[1151],IP[1152],IP[1153],IP[1154]],"r":1.48},"m_con":{"fr":[IP[1155],IP[1156],IP[1157],IP[1158],IP[1159],IP[1160]],"r":1.197},"m_quat":{"fr":[IP[1161],IP[1162],IP[1163],IP[1164],IP[1165],IP[1166]],"r":1.076},"m_choi":{"fr":[IP[1167],IP[1168],IP[1169],IP[1170],IP[1171],IP[1172]],"r":1.252},"m_thuan_thien":{"fr":[IP[1173],IP[1174],IP[1175],IP[1176],IP[1177],IP[1178]],"r":0.968}};
Object.assign(FXI, {"px_hit_chem":[{"uri":IP[1179],"a":1.1712},{"uri":IP[1180],"a":1.1712},{"uri":IP[1181],"a":1.1712},{"uri":IP[1182],"a":1.1712},{"uri":IP[1183],"a":1.1712},{"uri":IP[1184],"a":1.1712}],"px_hit_nen":[{"uri":IP[1185],"a":1.4846},{"uri":IP[1186],"a":1.4846},{"uri":IP[1187],"a":1.4846},{"uri":IP[1188],"a":1.4846},{"uri":IP[1189],"a":1.4846},{"uri":IP[1190],"a":1.4846}],"px_hit_dam":[{"uri":IP[1191],"a":1.5739},{"uri":IP[1192],"a":1.5739},{"uri":IP[1193],"a":1.5739},{"uri":IP[1194],"a":1.5739},{"uri":IP[1195],"a":1.5739},{"uri":IP[1196],"a":1.5739}],"px_hit_xoay":[{"uri":IP[1197],"a":1.2868},{"uri":IP[1198],"a":1.2868},{"uri":IP[1199],"a":1.2868},{"uri":IP[1200],"a":1.2868},{"uri":IP[1201],"a":1.2868},{"uri":IP[1202],"a":1.2868}],"px_hit_manh":[{"uri":IP[1203],"a":1.3852},{"uri":IP[1204],"a":1.3852},{"uri":IP[1205],"a":1.3852},{"uri":IP[1206],"a":1.3852},{"uri":IP[1207],"a":1.3852},{"uri":IP[1208],"a":1.3852}],"px_hit_chimang":[{"uri":IP[1209],"a":1.2057},{"uri":IP[1210],"a":1.2057},{"uri":IP[1211],"a":1.2057},{"uri":IP[1212],"a":1.2057},{"uri":IP[1213],"a":1.2057},{"uri":IP[1214],"a":1.2057}],"px_kn1_lop_chinh":[{"uri":IP[1215],"a":0.9257},{"uri":IP[1216],"a":0.9257},{"uri":IP[1217],"a":0.9257},{"uri":IP[1218],"a":0.9257},{"uri":IP[1219],"a":0.9257},{"uri":IP[1220],"a":0.9257}],"px_kn1_lop_du":[{"uri":IP[1221],"a":1.8},{"uri":IP[1222],"a":1.8},{"uri":IP[1223],"a":1.8},{"uri":IP[1224],"a":1.8},{"uri":IP[1225],"a":1.8},{"uri":IP[1226],"a":1.8}],"px_kn2_lop_chinh":[{"uri":IP[1227],"a":2.8889},{"uri":IP[1228],"a":2.8889},{"uri":IP[1229],"a":2.8889},{"uri":IP[1230],"a":2.8889},{"uri":IP[1231],"a":2.8889},{"uri":IP[1232],"a":2.8889}],"px_kn2_lop_du":[{"uri":IP[1233],"a":1.6735},{"uri":IP[1234],"a":1.6735},{"uri":IP[1235],"a":1.6735},{"uri":IP[1236],"a":1.6735},{"uri":IP[1237],"a":1.6735},{"uri":IP[1238],"a":1.6735}],"px_kn1_ban_chinh":[{"uri":IP[1239],"a":0.9916},{"uri":IP[1240],"a":0.9916},{"uri":IP[1241],"a":0.9916},{"uri":IP[1242],"a":0.9916},{"uri":IP[1243],"a":0.9916},{"uri":IP[1244],"a":0.9916}],"px_kn1_ban_du":[{"uri":IP[1245],"a":1.487},{"uri":IP[1246],"a":1.487},{"uri":IP[1247],"a":1.487},{"uri":IP[1248],"a":1.487},{"uri":IP[1249],"a":1.487},{"uri":IP[1250],"a":1.487}],"px_kn2_ban_chinh":[{"uri":IP[1251],"a":1.0106},{"uri":IP[1252],"a":1.0106},{"uri":IP[1253],"a":1.0106},{"uri":IP[1254],"a":1.0106},{"uri":IP[1255],"a":1.0106},{"uri":IP[1256],"a":1.0106}],"px_kn2_ban_du":[{"uri":IP[1257],"a":1.3026},{"uri":IP[1258],"a":1.3026},{"uri":IP[1259],"a":1.3026},{"uri":IP[1260],"a":1.3026},{"uri":IP[1261],"a":1.3026},{"uri":IP[1262],"a":1.3026}],"px_kn1_hot_chinh":[{"uri":IP[1263],"a":0.9685},{"uri":IP[1264],"a":0.9685},{"uri":IP[1265],"a":0.9685},{"uri":IP[1266],"a":0.9685},{"uri":IP[1267],"a":0.9685},{"uri":IP[1268],"a":0.9685}],"px_kn1_hot_du":[{"uri":IP[1269],"a":1.1988},{"uri":IP[1270],"a":1.1988},{"uri":IP[1271],"a":1.1988},{"uri":IP[1272],"a":1.1988},{"uri":IP[1273],"a":1.1988},{"uri":IP[1274],"a":1.1988}],"px_kn_ban_canh":[{"uri":IP[1275],"a":1.3472},{"uri":IP[1276],"a":1.3472},{"uri":IP[1277],"a":1.3472},{"uri":IP[1278],"a":1.3472},{"uri":IP[1279],"a":1.3472},{"uri":IP[1280],"a":1.3472}]});
for (const k in FXI) if (k.startsWith("px_hit_") || k.startsWith("px_kn")) FXI[k].px = 1;
FXI.px_lop_kn1 = FXI.px_kn1_lop_chinh; FXI.px_lop_kn2 = FXI.px_kn2_lop_chinh; FXI.px_ban_kn1 = FXI.px_kn1_ban_chinh; FXI.px_ban_kn2 = FXI.px_kn2_ban_chinh; FXI.px_hot_kn1 = FXI.px_kn1_hot_chinh;
Object.assign(FXI, {"px_kn2_hot_chinh":[{"uri":IP[1281],"a":0.9847},{"uri":IP[1282],"a":0.9847},{"uri":IP[1283],"a":0.9847},{"uri":IP[1284],"a":0.9847},{"uri":IP[1285],"a":0.9847},{"uri":IP[1286],"a":0.9847}],"px_kn2_hot_du":[{"uri":IP[1287],"a":1.5856},{"uri":IP[1288],"a":1.5856},{"uri":IP[1289],"a":1.5856},{"uri":IP[1290],"a":1.5856},{"uri":IP[1291],"a":1.5856},{"uri":IP[1292],"a":1.5856}],"px_kn1_gym_chinh":[{"uri":IP[1293],"a":2.6809},{"uri":IP[1294],"a":2.6809},{"uri":IP[1295],"a":2.6809},{"uri":IP[1296],"a":2.6809},{"uri":IP[1297],"a":2.6809},{"uri":IP[1298],"a":2.6809}],"px_kn1_gym_du":[{"uri":IP[1299],"a":1.3444},{"uri":IP[1300],"a":1.3444},{"uri":IP[1301],"a":1.3444},{"uri":IP[1302],"a":1.3444},{"uri":IP[1303],"a":1.3444},{"uri":IP[1304],"a":1.3444}],"px_kn2_gym_chinh":[{"uri":IP[1305],"a":1.0169},{"uri":IP[1306],"a":1.0169},{"uri":IP[1307],"a":1.0169},{"uri":IP[1308],"a":1.0169},{"uri":IP[1309],"a":1.0169},{"uri":IP[1310],"a":1.0169}],"px_kn2_gym_du":[{"uri":IP[1311],"a":1.2848},{"uri":IP[1312],"a":1.2848},{"uri":IP[1313],"a":1.2848},{"uri":IP[1314],"a":1.2848},{"uri":IP[1315],"a":1.2848},{"uri":IP[1316],"a":1.2848}],"px_kn1_bo_chinh":[{"uri":IP[1317],"a":1.1351},{"uri":IP[1318],"a":1.1351},{"uri":IP[1319],"a":1.1351},{"uri":IP[1320],"a":1.1351},{"uri":IP[1321],"a":1.1351},{"uri":IP[1322],"a":1.1351}],"px_kn1_bo_du":[{"uri":IP[1323],"a":1.4062},{"uri":IP[1324],"a":1.4062},{"uri":IP[1325],"a":1.4062},{"uri":IP[1326],"a":1.4062},{"uri":IP[1327],"a":1.4062},{"uri":IP[1328],"a":1.4062}],"px_kn2_bo_chinh":[{"uri":IP[1329],"a":0.8859},{"uri":IP[1330],"a":0.8859},{"uri":IP[1331],"a":0.8859},{"uri":IP[1332],"a":0.8859},{"uri":IP[1333],"a":0.8859},{"uri":IP[1334],"a":0.8859}],"px_kn2_bo_du":[{"uri":IP[1335],"a":1.2381},{"uri":IP[1336],"a":1.2381},{"uri":IP[1337],"a":1.2381},{"uri":IP[1338],"a":1.2381},{"uri":IP[1339],"a":1.2381},{"uri":IP[1340],"a":1.2381}],"px_kn1_me_chinh":[{"uri":IP[1341],"a":0.9357},{"uri":IP[1342],"a":0.9357},{"uri":IP[1343],"a":0.9357},{"uri":IP[1344],"a":0.9357},{"uri":IP[1345],"a":0.9357},{"uri":IP[1346],"a":0.9357}]});
for (const k in FXI) if (k.startsWith("px_kn")) FXI[k].px = 1;
FXI.px_hot_kn2 = FXI.px_kn2_hot_chinh; FXI.px_gym_kn1 = FXI.px_kn1_gym_chinh; FXI.px_gym_kn2 = FXI.px_kn2_gym_chinh; FXI.px_bo_kn1 = FXI.px_kn1_bo_chinh; FXI.px_bo_kn2 = FXI.px_kn2_bo_chinh; FXI.px_me_kn1 = FXI.px_kn1_me_chinh;
Object.assign(FXI, {"px_kn1_me_du":[{"uri":IP[1347],"a":1.2028},{"uri":IP[1348],"a":1.2028},{"uri":IP[1349],"a":1.2028},{"uri":IP[1350],"a":1.2028},{"uri":IP[1351],"a":1.2028},{"uri":IP[1352],"a":1.2028}],"px_kn2_me_chinh":[{"uri":IP[1353],"a":1.0156},{"uri":IP[1354],"a":1.0156},{"uri":IP[1355],"a":1.0156},{"uri":IP[1356],"a":1.0156},{"uri":IP[1357],"a":1.0156},{"uri":IP[1358],"a":1.0156}],"px_kn2_me_du":[{"uri":IP[1359],"a":1.3248},{"uri":IP[1360],"a":1.3248},{"uri":IP[1361],"a":1.3248},{"uri":IP[1362],"a":1.3248},{"uri":IP[1363],"a":1.3248},{"uri":IP[1364],"a":1.3248}],"px_kn2_bo_du":[{"uri":IP[1365],"a":1.2452},{"uri":IP[1366],"a":1.2452},{"uri":IP[1367],"a":1.2452},{"uri":IP[1368],"a":1.2452},{"uri":IP[1369],"a":1.2452},{"uri":IP[1370],"a":1.2452}],"px_kn1_anh_chinh":[{"uri":IP[1371],"a":1.1214},{"uri":IP[1372],"a":1.1214},{"uri":IP[1373],"a":1.1214},{"uri":IP[1374],"a":1.1214},{"uri":IP[1375],"a":1.1214},{"uri":IP[1376],"a":1.1214}],"px_kn1_anh_du":[{"uri":IP[1377],"a":1.2089},{"uri":IP[1378],"a":1.2089},{"uri":IP[1379],"a":1.2089},{"uri":IP[1380],"a":1.2089},{"uri":IP[1381],"a":1.2089},{"uri":IP[1382],"a":1.2089}],"px_kn2_anh_chinh":[{"uri":IP[1383],"a":0.956},{"uri":IP[1384],"a":0.956},{"uri":IP[1385],"a":0.956},{"uri":IP[1386],"a":0.956},{"uri":IP[1387],"a":0.956},{"uri":IP[1388],"a":0.956}],"px_kn2_anh_du":[{"uri":IP[1389],"a":1.3237},{"uri":IP[1390],"a":1.3237},{"uri":IP[1391],"a":1.3237},{"uri":IP[1392],"a":1.3237},{"uri":IP[1393],"a":1.3237},{"uri":IP[1394],"a":1.3237}]});
for (const k in FXI) if (k.startsWith("px_kn")) FXI[k].px = 1;
FXI.px_me_kn2 = FXI.px_kn2_me_chinh; FXI.px_anh_kn1 = FXI.px_kn1_anh_chinh; FXI.px_anh_kn2 = FXI.px_kn2_anh_chinh;
const SWT = {}; function swTex(id, i, fl) { const k = id + i + (fl ? "f" : ""); if (!SWT[k]) { const t = SWT[k] = new THREE.TextureLoader().load(PXSW[id].fr[i]); t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; if (fl) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; } } return SWT[k]; }
// mốc khung theo kiểu đòn: [ranh giới 6 khung], khoảnh khắc trúng = đầu khung ra đòn
const SWB = {slash:[0, .07, .3, .46, .64, .84, 1], heavy:[0, .06, .24, .46, .6, .82, 1], thrust:[0, .08, .28, .44, .62, .82, 1], spin:[0, .1, .28, .46, .64, .82, 1]};
const swFrame = (type, k) => { const b = SWB[type]; for (let i = 0; i < 6; i++) if (k < b[i + 1]) return i; return 5; };
const DU = (k, x, z, w, dur = 2.6) => fxAnim("px_" + k, x, .02, z, w, 0, dur, .5, 0xffffff, .35);
// ===================== v17: CẢM GIÁC ĐÁNH (hit-stop, giật camera, vung vũ khí thật, kỹ năng có cut-in) =====================
let PXW = null, pxSw = null, HS = 0, SLOW = 0, ZOOM = 0; const PXQ = [];
function juiceDt(d) { ZOOM = Math.max(0, ZOOM - d * 2.4); if (HS > 0) { HS -= d; return d * .03; } if (SLOW > 0) { SLOW -= d; return d * .3; } return d; }
const hitStop = s => { HS = Math.max(HS, s); }, punch = z => { ZOOM = Math.max(ZOOM, z); };
function flashScreen(col = "#fff", a = .5, ms = 200) {
  const el = h("div", {cls:"jflash"}); el.style.background = col; el.style.opacity = a; box.parentElement.append(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = `opacity ${ms}ms ease-out`; el.style.opacity = 0; })); setTimeout(() => el.remove(), ms + 80);
}
// hiệu ứng chồng 2 lớp: lớp thường + lớp cộng sáng to hơn -> rực, có quầng
function FXG(k, x, y, z, w, rot = 0, dur = .7, cy = .5, tint = 0xffffff) {
  fxAnim(k, x, y, z, w, rot, dur, .5, tint, cy); fxAnim(k, x, y, z, w * 1.22, rot, dur * .85, .5, tint, cy);
  const g = FM[FM.length - 1]; g.mesh.material.blending = THREE.AdditiveBlending; g.o2 = .6;
}
const ez = k => k * k * (3 - 2 * k), eOut = k => 1 - Math.pow(1 - k, 3), eIn = k => k * k * k;
// quỹ đạo vung: góc lệch so với hướng ngắm (dương = giơ lên/ra sau), đẩy tới (đâm), khoảnh khắc trúng
const SW = {
  slash:{d:.3, imp:.3, f:k => k < .3 ? .9 + 1.4 * ez(k / .3) : k < .48 ? 2.3 - 3.9 * eOut((k - .3) / .18) : -1.6 + 2.5 * ez((k - .48) / .52), lg:k => k > .3 && k < .6 ? Math.sin((k - .3) / .3 * Math.PI) * .45 : 0},
  heavy:{d:.56, imp:.46, f:k => k < .46 ? .9 + 2 * ez(k / .46) : k < .62 ? 2.9 - 3.9 * eIn((k - .46) / .16) : -1 + 1.9 * ez((k - .62) / .38), lg:k => k > .46 && k < .8 ? Math.sin((k - .46) / .34 * Math.PI) * .55 : k < .46 ? -.2 * ez(k / .46) : 0},
  thrust:{d:.26, imp:.28, f:() => .12, p:k => k < .35 ? -.7 * ez(k / .35) : k < .55 ? -.7 + 2.5 * eOut((k - .35) / .2) : 1.8 * (1 - ez((k - .55) / .45)), lg:k => k > .35 && k < .7 ? .5 * Math.sin((k - .35) / .35 * Math.PI) : 0},
  spin:{d:.34, imp:.28, f:k => .9 - 6.283 * eOut(k), lg:() => 0}
};
function pxMelee(id, c, w, dt) {
  w.cd -= dt; if (w.cd > 0 || pxSw) return; const {tg, dd} = pxAim(), Rr = c.R * (1 + .04 * (w.lv - 1)) * (w.evo ? 1.25 : 1);
  if (!DG.on && (!tg || dd > Rr + tg.r + .6)) { w.cd = .1; return; }
  w.cd = lvCd(c, w); const a = tg && dd < Rr * 2.6 ? Math.atan2(tg.z - P.z, tg.x - P.x) : Math.atan2(P.fz || 0, P.fx || 1), d0 = lvD(c, w);
  const type = c.spin ? "spin" : c.thrust ? "thrust" : c.ground ? "heavy" : "slash", S = SW[type];
  pxSw = {t:0, type, c, a, d:Math.max(type === "heavy" ? .42 : .17, Math.min(S.d, w.cd * 1.1)), fired:false, gt:0, hit:() => pxMeleeHit(c, a, Rr, d0, type)};
  P.fx = Math.cos(a); P.fz = Math.sin(a); if (R.anim) R.anim.faceL = Math.cos(a) < 0;
  snd(type === "heavy" ? 120 : 300, .07, "triangle", .025, type === "heavy" ? 80 : 200); // tiếng lấy đà
}
function pxMeleeHit(c, a, Rr, d0, type) {
  const ca = Math.cos(a), sa = Math.sin(a); let n = 0, crit = false;
  const HX = {slash:"px_hit_chem", heavy:"px_hit_manh", thrust:"px_hit_dam", spin:"px_hit_manh"}[type];
  for (const e of E) { if (e.dead) continue; const dx = e.x - P.x, dz = e.z - P.z, L = Math.hypot(dx, dz); if (L > Rr + e.r) continue;
    if (c.arc < 6 && Math.abs(wrapA(Math.atan2(dz, dx) - a)) > c.arc / 2 + e.r / Math.max(L, .5)) continue;
    const cr = Math.random() < .15; crit = crit || cr; const hp0 = e.hp;
    for (let i = 0; i < (c.hits || 1); i++) dmg(e, d0 * (cr ? 2 : 1), c.kb * (type === "heavy" ? 1.4 : 1) * (cr ? 1.5 : 1), P.x, P.z); if (c.slow) e.slow = 1.2; n++;
    const dealt = Math.round(hp0 - Math.max(0, e.hp)); if (dealt > 0) floatText(e.x + (Math.random() - .5), 3.3, e.z, cr ? dealt + "!!" : String(dealt), cr ? "#ff4040" : type === "heavy" ? "#ffb347" : "#fff");
    if (FM.length < 170) { const ex = e.x - ca * .4, ez = e.z - sa * .4;
      if (cr) FXG("px_hit_chimang", ex, 1.4, ez, 4.2, Math.random() * .6, .36);
      else FXG(HX, ex, 1.4, ez, type === "slash" ? 3.6 : 3, type === "slash" || type === "thrust" ? scrAng(e.x, 1.4, e.z, ca, sa) : 0, .3);
      burst(e.x, e.z, 0xffffff, 4, 6); } }
  if (type === "spin") FXG("px_hit_xoay", P.x, 1.3, P.z, Rr * 2.3, 0, .34);
  else if (type === "heavy") { const x = P.x + ca * Rr * .55, z = P.z + sa * Rr * .55; FXG("px_hit_nen", x, 0, z, Rr * 2.2, 0, .55, .3); ring(x, z, Rr * 1.1, 0xffe0a0, .35); burst(x, z, 0xb59a78, 12, 8);
    shake = Math.max(shake, 12); punch(.32); hitStop(.09); snd(70, .3, "sawtooth", .08, -30); }
  if (n && type !== "heavy") { hitStop(crit ? .09 : type === "spin" ? .025 : .055); shake = Math.max(shake, crit ? 9 : 5); punch(crit ? .2 : .08); }
  if (crit) { flashScreen("#ff5030", .22, 120); snd(1500, .12, "square", .05, -1200); }
  snd(type === "heavy" ? 90 : 700 + Math.random() * 200, .09, n ? "square" : "triangle", n ? .05 : .03, -400);
  if (c.bolt) E.filter(e => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 8).sort(() => Math.random() - .5).slice(0, c.bolt).forEach(e => strike(e.x, e.z, 1.6, Math.round(d0 * .6), false));
  if (c.qi) { const m = fxSprite("px_thuan_thien", 3, 3.4, 0); m.material.blending = THREE.AdditiveBlending; m.position.set(P.x, 1.5, P.z); scene.add(m); PXQ.push({x:P.x, z:P.z, vx:ca * 20, vz:sa * 20, life:.6, d:Math.round(d0 * .8), hit:new Set(), m, k:"px_thuan_thien", w:3.4, R:1.5}); }
}
// vật bay của kỹ năng / kiếm khí: bay thẳng, xuyên, để lại vệt
function pxQTick(dt) {
  for (let i = PXQ.length - 1; i >= 0; i--) { const q = PXQ[i]; q.life -= dt; q.x += q.vx * dt; q.z += q.vz * dt;
    const fr = FXI[q.k], fi = q.loop ? (t * 14 | 0) % fr.length : Math.min(fr.length - 1, 2 + ((.6 - q.life) * 8 | 0)); q.m.material.map = fxTex(q.k, fi);
    const sx = scrAng(q.x, 1.5, q.z, q.vx, q.vz); q.m.material.rotation = q.mirror ? 0 : sx; q.m.scale.set(q.w * (q.mirror && Math.cos(sx) > 0 ? -1 : 1), q.w / fr[fi].a, 1); q.m.position.set(q.x, q.y || 1.5, q.z);
    if ((q.tr = (q.tr || 0) - dt) <= 0 && FM.length < 170) { q.tr = .04; const g = q.m.clone(); g.material = q.m.material.clone(); g.material.blending = THREE.AdditiveBlending; scene.add(g); FM.push({mesh:g, t:0, dur:.18, op:.45}); }
    for (const e of E) if (!e.dead && !q.hit.has(e) && Math.hypot(e.x - q.x, e.z - q.z) < q.R + e.r) { q.hit.add(e); dmg(e, q.d, 2.5, q.x, q.z); hitStop(.03); shake = Math.max(shake, 5); if (FM.length < 170) FXG("px_trung_don", e.x, 1.4, e.z, 3, 0, .3); }
    if (q.life <= 0 || (DG.on && !canStand(q.x, q.z, .2))) { if (q.boom) q.boom(q.x, q.z); scene.remove(q.m); PXQ.splice(i, 1); } }
}
// vũ khí trên tay: gắn ở bàn tay, xoay theo hướng ngắm; khi chém có lấy đà – chém – theo đà, có bóng mờ theo lưỡi
const _hu = new THREE.Vector3(), _hr = new THREE.Vector3();
function pxHeldTick(dt) {
  if (!PXW) { PXW = new THREE.Sprite(new THREE.SpriteMaterial({transparent:true, depthWrite:false, alphaTest:.05})); PXW.renderOrder = 6; scene.add(PXW); }
  if (state === "run") pxQTick(dt);
  let ofs = null, push = 0, lunge = 0, strikeNow = false;
  if (pxSw) { const S = SW[pxSw.type]; pxSw.t += dt; const k = Math.min(1, pxSw.t / pxSw.d); ofs = S.f(k); push = S.p ? S.p(k) : 0; lunge = S.lg(k);
    strikeNow = k > S.imp - .2 && k < S.imp + .08; if (!pxSw.fired && k >= S.imp) { pxSw.fired = true; pxSw.hit(); } if (k >= 1) pxSw = null; }
  const sp = R.anim && R.anim.sp, show = R.anim && R.anim.A.px;
  const run = state === "run" || state === "lv", id = run ? (DG.on ? P.hand[P.cur] : (Object.keys(P.ws).find(k => MW[k]) || CH[SV.sel].w)) : (PX_START[SV.sel] || CH[SV.sel].w);
  const key = id && (PXHELD[id] || (NW[id] && NW[id].img)), c = MW[id]; pxCurId = run ? id : null;
  if (!show || !key || pxHoldOn || !SPR[key] || P.empty > 0 || (P.casting && PXG[SV.sel]) || R.anim.dieT !== undefined) { PXW.visible = false; if (sp) { sp.position.x = sp.position.z = 0; } return; }
  const pos = playerMesh.position, a = pxSw ? pxSw.a : run ? pxAim().a : (P.fx < 0 ? Math.PI : 0), ca = Math.cos(a), sa = Math.sin(a);
  const r = scrAng(pos.x, 1.2, pos.z, ca, sa), left = Math.cos(r) < 0, side = left ? -1 : 1;
  if (ofs === null) ofs = c ? (c.thrust ? .12 : .9) + Math.sin(t * 3) * .05 : 0; // tư thế cầm: vũ khí cận chiến dựng chếch lên, thở nhẹ
  // thân người nhào theo nhát chém
  if (sp) { sp.position.x = ca * lunge; sp.position.z = sa * lunge; sp.material.rotation = pxSw ? -side * (pxSw.type === "heavy" ? .18 : .1) * Math.sin(Math.min(1, pxSw.t / pxSw.d) * Math.PI) : sp.material.rotation; }
  _hu.set(0, 1, 0).applyQuaternion(cam.quaternion); _hr.set(1, 0, 0).applyQuaternion(cam.quaternion);
  const L = (c && c.len ? c.len * .78 : (id === "gun" ? 1.9 : 1.5)), S = SPR[key], g = .16, tip = left ? r - ofs : r + ofs, hy = 1.05 + (sp ? sp.position.y : 0), FR = PXSW[id];
  const hx = pos.x + _hr.x * .42 * side + _hu.x * hy + ca * (lunge + push * .6), hz = pos.z + _hr.z * .42 * side + _hu.z * hy + sa * (lunge + push * .6);
  PXW.visible = true;
  if (FR) { const fi = pxSw ? swFrame(pxSw.type, Math.min(1, pxSw.t / pxSw.d)) : 0, Z = L * FR.r * 1.1; // khung vẽ tay: tâm ô = bàn tay, xoay cả khung theo hướng ngắm
    PXW.material.map = swTex(id, fi, left); PXW.material.rotation = left ? r - Math.PI : r; PXW.center.set(.5, .5); PXW.scale.set(Z, Z, 1); PXW.position.set(hx, _hu.y * hy, hz + .05); return; }
  PXW.material.map = sprMap(key, left); PXW.material.rotation = left ? tip - Math.PI : tip; PXW.center.set(left ? 1 - g : g, .5);
  PXW.scale.set(L, L / S.a, 1); PXW.position.set(hx, _hu.y * hy, hz + .05);
  if (strikeNow && FM.length < 170) { const gh = new THREE.Sprite(PXW.material.clone()); gh.center.copy(PXW.center); gh.scale.copy(PXW.scale); gh.position.copy(PXW.position);
    gh.material.blending = THREE.AdditiveBlending; gh.material.color.setHex(c && c.tint || 0xcfefff); gh.renderOrder = 5; scene.add(gh); FM.push({mesh:gh, t:0, dur:.13, op:.55}); }
}
// ===================== v21: tư thế cầm vũ khí vẽ tay (mỗi vũ khí một dáng cầm) =====================
const PXH = {"lop":{"uri":IP[1395],"cw":125,"ch":106,"cols":7,"rows":6,"fh":91.0,"ax":0.4133,"m":{"m_kiem_thuoc":0,"m_kiem_tre":1,"m_ma_tau":2,"m_song_dao":3,"m_yen_nguyet":4,"m_thuong_tre":5,"m_bua_dinh":6,"m_bua_ta":7,"m_bua_sam":8,"m_gay":9,"m_con":10,"m_quat":11,"m_choi":12,"m_thuan_thien":13,"fist":14,"win":15,"throw":16,"slipper":17,"pan":18,"laptop":19,"gun":20,"bow":21,"thermos":22,"pen":23,"ruler":24,"umb":25,"mic":26,"badge":27,"nonla":28,"quat":29,"am":30,"lau":31,"caplong":32,"sach":33,"den":34,"mu":35,"ao":36,"loa":37,"guitar":38,"butmuc":39,"sen":40,"drone":41}},"ban":{"uri":IP[1396],"cw":119,"ch":106,"cols":7,"rows":6,"fh":97.7,"ax":0.4328,"m":{"m_kiem_thuoc":0,"m_kiem_tre":1,"m_ma_tau":2,"m_song_dao":3,"m_yen_nguyet":4,"m_thuong_tre":5,"m_bua_dinh":6,"m_bua_ta":7,"m_bua_sam":8,"m_gay":9,"m_con":10,"m_quat":11,"m_choi":12,"m_thuan_thien":13,"fist":14,"win":15,"throw":16,"slipper":17,"pan":18,"laptop":19,"gun":20,"bow":21,"thermos":22,"pen":23,"ruler":24,"umb":25,"mic":26,"badge":27,"nonla":28,"quat":29,"am":30,"lau":31,"caplong":32,"sach":33,"den":34,"mu":35,"ao":36,"loa":37,"guitar":38,"butmuc":39,"sen":40,"drone":41}},"hot":{"uri":IP[1397],"cw":116,"ch":106,"cols":7,"rows":6,"fh":98.3,"ax":0.398,"m":{"m_kiem_thuoc":0,"m_kiem_tre":1,"m_ma_tau":2,"m_song_dao":3,"m_yen_nguyet":4,"m_thuong_tre":5,"m_bua_dinh":6,"m_bua_ta":7,"m_bua_sam":8,"m_gay":9,"m_con":10,"m_quat":11,"m_choi":12,"m_thuan_thien":13,"fist":14,"win":15,"throw":16,"slipper":17,"pan":18,"laptop":19,"gun":20,"bow":21,"thermos":22,"pen":23,"ruler":24,"umb":25,"mic":26,"badge":27,"nonla":28,"quat":29,"am":30,"lau":31,"caplong":32,"sach":33,"den":34,"mu":35,"ao":36,"loa":37,"guitar":38,"butmuc":39,"sen":40,"drone":41}},"gym":{"uri":IP[1398],"cw":127,"ch":105,"cols":7,"rows":6,"fh":96.0,"ax":0.4278,"m":{"m_kiem_thuoc":0,"m_kiem_tre":1,"m_ma_tau":2,"m_song_dao":3,"m_yen_nguyet":4,"m_thuong_tre":5,"m_bua_dinh":6,"m_bua_ta":7,"m_bua_sam":8,"m_gay":9,"m_con":10,"m_quat":11,"m_choi":12,"m_thuan_thien":13,"fist":14,"win":15,"throw":16,"slipper":17,"pan":18,"laptop":19,"gun":20,"bow":21,"thermos":22,"pen":23,"ruler":24,"umb":25,"mic":26,"badge":27,"nonla":28,"quat":29,"am":30,"lau":31,"caplong":32,"sach":33,"den":34,"mu":35,"ao":36,"loa":37,"guitar":38,"butmuc":39,"sen":40,"drone":41}},"bo":{"uri":IP[1399],"cw":128,"ch":106,"cols":7,"rows":6,"fh":87.0,"ax":0.4206,"m":{"m_kiem_thuoc":0,"m_kiem_tre":1,"m_ma_tau":2,"m_song_dao":3,"m_yen_nguyet":4,"m_thuong_tre":5,"m_bua_dinh":6,"m_bua_ta":7,"m_bua_sam":8,"m_gay":9,"m_con":10,"m_quat":11,"m_choi":12,"m_thuan_thien":13,"fist":14,"win":15,"throw":16,"slipper":17,"pan":18,"laptop":19,"gun":20,"bow":21,"thermos":22,"pen":23,"ruler":24,"umb":25,"mic":26,"badge":27,"nonla":28,"quat":29,"am":30,"lau":31,"caplong":32,"sach":33,"den":34,"mu":35,"ao":36,"loa":37,"guitar":38,"butmuc":39,"sen":40,"drone":41}},"me":{"uri":IP[1400],"cw":126,"ch":106,"cols":7,"rows":6,"fh":97.0,"ax":0.4431,"m":{"m_kiem_thuoc":0,"m_kiem_tre":1,"m_ma_tau":2,"m_song_dao":3,"m_yen_nguyet":4,"m_thuong_tre":5,"m_bua_dinh":6,"m_bua_ta":7,"m_bua_sam":8,"m_gay":9,"m_con":10,"m_quat":11,"m_choi":12,"m_thuan_thien":13,"fist":14,"win":15,"throw":16,"slipper":17,"pan":18,"laptop":19,"gun":20,"bow":21,"thermos":22,"pen":23,"ruler":24,"umb":25,"mic":26,"badge":27,"nonla":28,"quat":29,"am":30,"lau":31,"caplong":32,"sach":33,"den":34,"mu":35,"ao":36,"loa":37,"guitar":38,"butmuc":39,"sen":40,"drone":41}},"anh":{"uri":IP[1401],"cw":119,"ch":103,"cols":7,"rows":5,"fh":89.3,"ax":0.3936,"m":{"m_kiem_thuoc":0,"m_kiem_tre":1,"m_ma_tau":2,"m_song_dao":3,"m_yen_nguyet":4,"m_thuong_tre":5,"m_bua_dinh":6,"m_bua_ta":7,"m_bua_sam":8,"m_gay":9,"m_con":10,"m_quat":11,"m_choi":12,"m_thuan_thien":13,"fist":14,"win":15,"throw":16,"slipper":17,"pan":18,"laptop":19,"gun":20,"bow":21,"thermos":22,"pen":23,"ruler":24,"umb":25,"mic":26,"badge":27,"nonla":28,"quat":29,"am":30,"lau":31}}};
const HOLD_TX = {}; let pxHoldOn = false, pxCurId = null;
// ===================== v20: động tác vẽ tay toàn thân + gồng chiêu + cut-in =====================
const PXA = {"gym":{"uri":IP[1402],"cw":52,"ch":52,"fh":44},"ban":{"uri":IP[1403],"cw":52,"ch":52,"fh":43},"lop":{"uri":IP[1404],"cw":52,"ch":52,"fh":42},"hot":{"uri":IP[1405],"cw":52,"ch":52,"fh":44},"bo":{"uri":IP[1406],"cw":52,"ch":52,"fh":42},"me":{"uri":IP[1407],"cw":52,"ch":52,"fh":48},"anh":{"uri":IP[1408],"cw":52,"ch":52,"fh":43}};
const PXG = {"gym":{"fr":[{"uri":IP[1409],"a":1.7566},{"uri":IP[1410],"a":1.7566},{"uri":IP[1411],"a":1.7566},{"uri":IP[1412],"a":1.7566},{"uri":IP[1413],"a":1.7566},{"uri":IP[1414],"a":1.7566}],"r":0.628,"cy":0.044},"ban":{"fr":[{"uri":IP[1415],"a":1.7611},{"uri":IP[1416],"a":1.7611},{"uri":IP[1417],"a":1.7611},{"uri":IP[1418],"a":1.7611},{"uri":IP[1419],"a":1.7611},{"uri":IP[1420],"a":1.7611}],"r":0.624,"cy":0.053},"lop":{"fr":[{"uri":IP[1421],"a":0.708},{"uri":IP[1422],"a":0.708},{"uri":IP[1423],"a":0.708},{"uri":IP[1424],"a":0.708},{"uri":IP[1425],"a":0.708},{"uri":IP[1426],"a":0.708}],"r":0.611,"cy":0.044},"hot":{"fr":[{"uri":IP[1427],"a":0.7124},{"uri":IP[1428],"a":0.7124},{"uri":IP[1429],"a":0.7124},{"uri":IP[1430],"a":0.7124},{"uri":IP[1431],"a":0.7124},{"uri":IP[1432],"a":0.7124}],"r":0.648,"cy":0.077},"bo":{"fr":[{"uri":IP[1433],"a":0.6953},{"uri":IP[1434],"a":0.6953},{"uri":IP[1435],"a":0.6953},{"uri":IP[1436],"a":0.6953},{"uri":IP[1437],"a":0.6953},{"uri":IP[1438],"a":0.6953}],"r":0.597,"cy":0.06},"me":{"fr":[{"uri":IP[1439],"a":0.5584},{"uri":IP[1440],"a":0.5584},{"uri":IP[1441],"a":0.5584},{"uri":IP[1442],"a":0.5584},{"uri":IP[1443],"a":0.5584},{"uri":IP[1444],"a":0.5584}],"r":0.645,"cy":0.117},"anh":{"fr":[{"uri":IP[1445],"a":0.6494},{"uri":IP[1446],"a":0.6494},{"uri":IP[1447],"a":0.6494},{"uri":IP[1448],"a":0.6494},{"uri":IP[1449],"a":0.6494},{"uri":IP[1450],"a":0.6494}],"r":0.662,"cy":0.074}};
const PXCI = {"gym":IP[1451],"ban":IP[1452],"lop":IP[1453],"hot":IP[1454],"bo":IP[1455],"me":IP[1456],"anh":IP[1457]};
const ACT_TX = {}, GONG_TX = {}, SW_ROW = {slash:0, heavy:1, thrust:2, spin:3}; let PXB = null; const _pxws = new THREE.Vector3();
function pxLd(u) { const t = new THREE.TextureLoader().load(u); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.magFilter = t.minFilter = THREE.NearestFilter; return t; }
function pxBodyTick(dt) { // thay thân nhân vật bằng khung vẽ tay khi chém / lăn / bắn / gồng chiêu
  const a = R.anim; if (!a || !a.A.px || a.d || !P) { if (PXB) PXB.visible = false; pxHoldOn = false; return; }
  const sp = a.sp, id = SV.sel, ck = CH[id] && CH[id].anim, def = !((SV.skin || {})[ck]);
  if (PXA[id] && !ACT_TX[id]) ACT_TX[id] = pxLd(PXA[id].uri); if (PXG[id] && !GONG_TX[id + 0]) PXG[id].fr.forEach((f, i) => { GONG_TX[id + i] = pxLd(f.uri); }); // nạp sẵn để khung đầu không trống
  if (!PXB) { PXB = new THREE.Sprite(new THREE.SpriteMaterial({transparent:true, alphaTest:.05, depthWrite:false})); PXB.renderOrder = 5.5; }
  if (PXB.parent !== scene) scene.add(PXB);
  let mode = null, row = 0, col = 0, left = false;
  if (a.dieT === undefined && a.winT === undefined && (state === "run" || state === "lv")) {
    if (P.casting && PXG[id]) mode = "g";
    else if (def && PXA[id]) {
      if (pxSw) { const p = playerMesh.position, r = scrAng(p.x, 1.2, p.z, Math.cos(pxSw.a), Math.sin(pxSw.a)); row = SW_ROW[pxSw.type] || 0; col = swFrame(pxSw.type, Math.min(1, pxSw.t / pxSw.d)); left = Math.cos(r) < 0; mode = "a"; }
      else if (P.roll > 0) { row = 5; col = Math.min(5, Math.floor((1 - P.roll / .45) * 6)); left = P.rfx < 0; mode = "a"; }
      else if (a.atk >= 0 && (a.row === "gun" || a.row === "bow" || a.row === "throw2")) { row = 4; col = Math.min(5, Math.floor(a.atk / (ACT_T[a.row] || .4) * 6)); left = a.faceL; mode = "a"; }
    }
  }
  let hc = -1;
  if (!mode && def && PXH[id] && pxCurId && (state === "run" || state === "lv") && a.dieT === undefined && a.winT === undefined && !(P.roll > 0) && !(a.atk >= 0) && !(P.empty > 0)) {
    const M = PXH[id].m; hc = M[pxCurId] !== undefined ? M[pxCurId] : -1;
    if (hc >= 0) { const p = playerMesh.position, ag = pxAim().a, rr = scrAng(p.x, 1.2, p.z, Math.cos(ag), Math.sin(ag)); left = Math.cos(rr) < 0; mode = "h"; }
  }
  if (!HOLD_TX[id] && PXH[id]) HOLD_TX[id] = pxLd(PXH[id].uri);
  if (mode === "h" && !(HOLD_TX[id] && HOLD_TX[id].image)) mode = null;
  pxHoldOn = mode === "h";
  if (mode === "a" && !(ACT_TX[id] && ACT_TX[id].image)) mode = null; if (mode === "g" && !(GONG_TX[id + 0] && GONG_TX[id + 0].image)) mode = null;
  if (!mode) { PXB.visible = false; sp.visible = true; pxHoldOn = false; return; }
  const m = PXB.material, red = P.inv > 0 && P.hurtFlash ? 0xff9a9a : 0xffffff; m.color.setHex(red); m.rotation = 0;
  if (mode === "h") {
    const X = PXH[id], tx = HOLD_TX[id], cu = 1 / X.cols, rv = 1 / X.rows, col2 = hc % X.cols, row2 = (hc / X.cols) | 0, k = 3 / X.fh;
    tx.repeat.set(left ? -cu : cu, rv); tx.offset.set((left ? col2 + 1 : col2) * cu, 1 - (row2 + 1) * rv);
    if (m.map !== tx) { m.map = tx; m.needsUpdate = true; }
    const mv = P.mv ? Math.abs(Math.sin(a.wt * 12 * Math.PI / 6)) : 0, br = P.mv ? 0 : Math.sin(t * 3) * .015;
    PXB.center.set(left ? 1 - X.ax : X.ax, 3 / X.ch); PXB.scale.set(X.cw * k * (1 + mv * .04), X.ch * k * (1 - mv * .05 + br), 1);
    sp.getWorldPosition(PXB.position); sp.getWorldScale(_pxws); PXB.scale.multiply(_pxws.divide(sp.scale)); PXB.position.y += mv * .22;
    PXB.renderOrder = 5.5; PXB.visible = true; sp.visible = false; return;
  }
  if (mode === "a") {
    const X = PXA[id], tx = ACT_TX[id] || (ACT_TX[id] = pxLd(X.uri)), u = 1 / 6, k = 3 / X.fh; col = Math.max(0, Math.min(5, col | 0));
    tx.repeat.set(left ? -u : u, u); tx.offset.set((left ? col + 1 : col) * u, 1 - (row + 1) * u);
    if (m.map !== tx) { m.map = tx; m.needsUpdate = true; }
    PXB.center.set(.5, 3 / X.ch); PXB.scale.set(X.cw * k, X.ch * k, 1);
  } else {
    const G = PXG[id], ct = (performance.now() - (P.castS || 0)) / 1000, i = Math.min(5, Math.floor(ct / .5 * 6)), kk = id + i, f = G.fr[i], tx = GONG_TX[kk] || (GONG_TX[kk] = pxLd(f.uri));
    if (m.map !== tx) { m.map = tx; m.needsUpdate = true; }
    const H = 3 / G.r * (1 + .04 * Math.sin(ct * 40)), gl = P.fx < 0; tx.repeat.set(gl ? -1 : 1, 1); tx.offset.set(gl ? 1 : 0, 0); PXB.center.set(.5, G.cy); PXB.scale.set(H * f.a, H, 1);
  }
  sp.getWorldPosition(PXB.position); sp.getWorldScale(_pxws); PXB.scale.multiply(_pxws.divide(sp.scale)); PXB.renderOrder = mode === "g" ? 8 : 5.5; PXB.visible = true; sp.visible = false;
}
// ---------- Kỹ năng: gồng chiêu (chậm thời gian + cut-in chân dung) rồi bung chiêu nhiều nhịp ----------
const SKC = {lop:"#ff8a2a", ban:"#ff5fa8", hot:"#b05cff", gym:"#7dff5a", bo:"#ffd23f", me:"#ff5a3a", anh:"#3fe8ff"};
function skillCutIn(id) {
  const nm = (DG_SKILL[id] || "Kỹ năng").split(" + ");
  const big = PXCI[id], el = h("div", {cls:"cutin" + (big ? " big" : "")}, h("div", {cls:"cb"}), h("img", {src:big || PXD.face[id] || "", alt:""}), h("div", {cls:"cn"}, h("small", {}, CH[id].n), h("b", {}, nm[0]), nm[1] ? h("i", {}, "+ " + nm[1]) : ""));
  el.style.setProperty("--sc", SKC[id] || "#ffd25e"); box.parentElement.append(el); setTimeout(() => el.remove(), big ? 1300 : 1150);
}
function dgSkill() {
  if (state !== "run" || !P || P.sk > 0 || P.casting) return; P.sk = P.skMax; const id = SV.sel, col = SKC[id] || "#ffd25e", hex = parseInt(col.slice(1), 16);
  P.casting = true; P.castS = performance.now(); P.inv = Math.max(P.inv, 1.6); skillCutIn(id); SLOW = .55; punch(.35); hitStop(.05);
  P.act = {k:"atk", t:0, d:.7, w:CH[id].w, ax:P.fx}; if (R.anim) { R.anim.row = "atk"; R.anim.atk = 0; }
  ring(P.x, P.z, 4, hex, .5); ring(P.x, P.z, 2.2, 0xffffff, .3); burst(P.x, P.z, hex, 18, 3); FXG("px_nhat_vat", P.x, 0, P.z, 4.5, 0, .7, .08);
  snd(140, .5, "sawtooth", .06, 500);
  setTimeout(() => { P.casting = false; if (state === "run") skillRelease(id, col, hex); }, 520);
}
function skillRelease(id, col, hex) {
  const d0 = 34 + 13 * DG.floor, {tg, a} = pxAim(), ca = Math.cos(a), sa = Math.sin(a), tx = tg ? tg.x : P.x + ca * 6, tz = tg ? tg.z : P.z + sa * 6;
  const area = (x, z, R, d, kb = 2, f) => { let n = 0; for (const e of E) if (!e.dead && Math.hypot(e.x - x, e.z - z) < R + e.r) { const hp0 = e.hp; dmg(e, Math.round(d), kb, x, z); n++; if (f) f(e);
      const dl = Math.round(hp0 - Math.max(0, e.hp)); if (dl > 0) floatText(e.x + (Math.random() - .5) * 1.2, 3.4, e.z, dl + "!", col); } return n; };
  const pulses = (x, z, R, d, n = 3, gap = 110, kb = 1.5, f) => { for (let i = 0; i < n; i++) setTimeout(() => { if (state !== "run") return; area(x, z, R, d / n * (i === n - 1 ? 1.6 : 1), i === n - 1 ? kb * 2 : .4, f);
      if (i === n - 1) { hitStop(.08); shake = Math.max(shake, 10); } else shake = Math.max(shake, 4); }, i * gap); };
  flashScreen(col, .45, 260); shake = Math.max(shake, 16); punch(.55); snd(60, .5, "sawtooth", .09, -20); snd(880, .25, "square", .04, -600);
  if (id === "lop") { [-.32, -.11, .11, .32].forEach(o => { const b = a + o, m = fxSprite("px_lop_kn1", 0, 4.2, 0); scene.add(m);
      PXQ.push({x:P.x, z:P.z, vx:Math.cos(b) * 17, vz:Math.sin(b) * 17, life:1.1, d:d0 * 1.2, hit:new Set(), m, k:"px_lop_kn1", w:4.2, R:1.6, loop:1, mirror:1, y:1.3,
        boom:(x, z) => { FXG("px_dan_lua", x, 1, z, 3.6, 0, .4); DU("kn1_lop_du", x, z, 4.5); area(x, z, 2.4, d0 * .5); }}); });
    FXG("px_lop_kn2", P.x, 0, P.z, 9, 0, 1.2, .12); DU("kn2_lop_du", P.x, P.z, 8); pulses(P.x, P.z, 4.5, d0, 3, 120, 3); P.inv = Math.max(P.inv, 2.2); P.shield = 1; }
  else if (id === "ban") { FXG("px_ban_kn1", tx, 0, tz, 10, 0, 1.2, .08); setTimeout(() => { DU("kn1_ban_du", tx, tz, 8); DU("kn_ban_canh", tx, tz, 6, 2); }, 500); pulses(tx, tz, 4.4, d0 * 1.4, 4, 140, 1.2);
    FXG("px_ban_kn2", P.x, 0, P.z, 7, 0, 1.2, .1); DU("kn2_ban_du", P.x, P.z, 6); P.hp = Math.min(P.max, P.hp + 2); P.arm = P.armMax; P.inv = Math.max(P.inv, 2); }
  else if (id === "hot") { E.filter(e => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 15).sort((p, q) => Math.hypot(p.x - P.x, p.z - P.z) - Math.hypot(q.x - P.x, q.z - P.z)).slice(0, 8)
      .forEach((e, i) => setTimeout(() => { if (e.dead || state !== "run") return; FXG("px_hot_kn1", e.x, 0, e.z, 6, 0, .7, .06); DU("kn1_hot_du", e.x, e.z, 4.2, 2); area(e.x, e.z, 2, d0 * 1.3, 1, o => o.slow = 1.2); flashScreen("#d9b3ff", .18, 90); shake = Math.max(shake, 7); hitStop(.035); snd(1200, .08, "square", .04, -900); }, i * 85));
    FXG("px_hot_kn2", P.x, 0, P.z, 8, 0, 1.2, .08); DU("kn2_hot_du", P.x, P.z, 6); P.inv = Math.max(P.inv, 2.8); P.buff = 4; }
  else if (id === "gym") { FXG("px_gym_kn1", P.x, 0, P.z, 12, 0, .9, .25); DU("kn1_gym_du", P.x, P.z, 10); ring(P.x, P.z, 7, 0xfff0a0, .45); ring(P.x, P.z, 4, 0xffffff, .3); burst(P.x, P.z, 0xb59a78, 30, 12);
    pulses(P.x, P.z, 7, d0 * 1.6, 3, 100, 5); FXG("px_gym_kn2", P.x, 0, P.z, 6.5, 0, 1.3, .08); DU("kn2_gym_du", P.x, P.z, 5); P.arm = P.armMax; P.buff = 5; }
  else if (id === "bo") { FXG("px_bo_kn1", P.x, 1, P.z, 12, 0, .9, .5); DU("kn1_bo_du", P.x, P.z, 8); ring(P.x, P.z, 8, 0xffd23f, .5); area(P.x, P.z, 8, d0 * .4, 5, e => e.slow = 3);
    setTimeout(() => { if (state !== "run") return; FXG("px_bo_kn2", tx, 0, tz, 9, 0, 1.1, .08); setTimeout(() => DU("kn2_bo_du", tx, tz, 7), 450); pulses(tx, tz, 4.4, d0 * 1.5, 4, 120, 1.5); }, 220); }
  else if (id === "me") { FXG("px_me_kn1", tx, 0, tz, 8.5, 0, 1.2, .08); setTimeout(() => DU("kn1_me_du", tx, tz, 7), 500); pulses(tx, tz, 4.6, d0 * 1.1, 4, 120, 0, e => { e.x += (tx - e.x) * .35; e.z += (tz - e.z) * .35; });
    setTimeout(() => { if (state !== "run") return; FXG("px_me_kn2", P.x + ca * 4, 0, P.z + sa * 4, 10, 0, 1.1, .1); DU("kn2_me_du", P.x + ca * 7, P.z + sa * 7, 7); for (const e of E) if (!e.dead && segDist(e.x, e.z, P.x, P.z, P.x + ca * 11, P.z + sa * 11) < 3 + e.r) dmg(e, Math.round(d0 * 1.5), 4, P.x, P.z); hitStop(.08); shake = Math.max(shake, 12); }, 300); P.buff = 6; }
  else if (id === "anh") { FXG("px_anh_kn1", tx, 0, tz, 9, 0, 1.1, .12); setTimeout(() => DU("kn1_anh_du", tx, tz, 7.5), 450); pulses(tx, tz, 4.8, d0 * 1.5, 5, 90, 1, e => e.slow = 2.5); FXG("px_anh_kn2", P.x, 0, P.z, 6, 0, 1.2, .1); DU("kn2_anh_du", P.x, P.z, 6); P.en = P.enMax; }
}

// ---------- Chọn skin trong menu nhân vật ----------
function skinRow(id) {
  const k = CH[id].anim, cur = (SV.skin || {})[k] || 0;
  return h("div", {cls:"skins"}, ...PXC[k].map((A, i) => h("button", {cls:"skin t" + i + (i === cur ? " on" : ""), title:PX_SKIN[k][i], onclick:() => { SV.skin = Object.assign({}, SV.skin, {[k]:i}); save(); setChar(SV.sel); renderMenu(); }},
    h("span", {cls:"skp", style:`background-image:url(${A.uri})`}), h("small", {}, PX_SKIN[k][i]), h("i", {}, PX_TIER[i]))));
}

// ---------- Cập nhật ----------
let mouseGo = null; // giữ chuột trái trên sân: nhân vật đi về phía con trỏ
function inputDir() {
  let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), z = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (jo) { x += jo.dx; z += jo.dz; }
  if (mouseGo && P) { const r = box.getBoundingClientRect(), v = _p1.set(P.x, 1.5, P.z).project(cam), dx = mouseGo.x - (r.left + (v.x + 1) / 2 * r.width), dy = mouseGo.y - (r.top + (1 - v.y) / 2 * r.height), l = Math.hypot(dx, dy);
    if (l > 16) { x += dx / l * Math.min(1, l / 60); z += dy / l * Math.min(1, l / 60); } } const m = Math.hypot(x, z); return m > 1 ? {x:x / m, z:z / m} : {x, z};
}
function update(dt) {
  t += dt; const d = inputDir(); P.mv = Math.hypot(d.x, d.z) > .05; P.t += P.mv ? dt : dt * .2; if (P.mv) { P.fx = d.x; P.fz = d.z; }
  const sp = 8.2 * (CH[SV.sel].spd || 1) * (1 + SV.up.spd * .04 + P.pl.spd * .08) * (P.buff > 0 ? 1.35 : 1);
  if (P.rollCd > 0) P.rollCd -= dt;
  const mvP = (nx, nz) => { if (DG.on) dgMove(P, nx, nz, .6); else { P.x = clamp(nx, -MAXX, MAXX); P.z = clamp(nz, -MAXZ, MAXZ); } };
  if (P.roll > 0) { P.roll -= dt; P.inv = Math.max(P.inv, .05); mvP(P.x + P.rfx * 17 * dt, P.z + P.rfz * 17 * dt); }
  mvP(P.x + d.x * sp * dt, P.z + d.z * sp * dt); { const ox = P.x, oz = P.z; pushOut(P, .6); if (DG.on && !canStand(P.x, P.z, .58)) { P.x = ox; P.z = oz; } }
  P.inv = Math.max(0, P.inv - dt); if (P.act && (P.act.t += dt) >= P.act.d) P.act = null; if (DG.on) dgTick(dt); else { P.hp = Math.min(P.max, P.hp + dt * .4); spawnTick(dt); }
  if (state !== "run") return;
  if (DG.on) dgWeapons(dt); else for (const [id, w] of Object.entries(P.ws)) { const n0 = PJ.length; WF[id](w, dt); if (EVOK[id] && tierOf(id)) for (let i = n0; i < PJ.length; i++) PJ[i].efx = EVOK[id]; }
  extrasTick(dt);
  if (state !== "run") return;
  for (const e of E) {
    if (e.dead) continue; e.h = Math.max(0, e.h - dt); e.w += dt * 9;
    if (e.dash && (e.boss || e.type === "vosi") && e.dt2 < .6 && !e.warn) { e.warn = 1; ring(e.x, e.z, e.r * 2.4, 0xff3030, .55); }
    if (e.dash && (e.dt2 -= dt) <= 0) { e.warn = 0; e.boost = .4; e.atkT = .55; e.dt2 = (e.boss ? 3 : 2.2) + Math.random() * 1.5; }
    e.boost = Math.max(0, e.boost - dt); const dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz) || 1; let s = e.sp * (e.boost > 0 ? 3.5 : 1) * (DG.on ? 1 : 1 + t / 400), mx = dx / dist, mz = dz / dist;
    if (e.keep && dist < e.keep) { mx *= -.6; mz *= -.6; } // yêu quái đánh xa giữ khoảng cách
    if (e.weave) { const a = Math.sin(e.w * .45) * .9, c = Math.cos(a), sn = Math.sin(a); [mx, mz] = [mx * c - mz * sn, mx * sn + mz * c]; } // quạ bay lượn
    if (e.slow > 0) { e.slow -= dt; s *= .45; }
    e.vx = mx * s; e.vz = mz * s; e.x += e.vx * dt; e.z += e.vz * dt;
    if ((e.shoot || e.lob) && dist < 16 && (e.sc = (e.sc === undefined ? 1 + Math.random() * 2 : e.sc) - dt) <= 0) { e.sc = (e.shoot || e.lob).cd; if (e.shoot) foeShot(e); else foeLob(e); }
    if (e.summon && (e.st = (e.st === undefined ? 4 : e.st) - dt) <= 0) { e.st = 7; for (let i = 0; i < 5; i++) spawnE(e.summon, {at:[e.x + Math.cos(i * 1.256) * 2.5, e.z + Math.sin(i * 1.256) * 2.5]}); banner("Đàn quạ lửa xuất hiện!"); }
    for (const o of E) { if (o === e || o.dead) continue; const ax = e.x - o.x, az = e.z - o.z, ad = Math.hypot(ax, az), mn = (e.r + o.r) * .8; if (ad < mn && ad > .001) { e.x += ax / ad * (mn - ad) * .5; e.z += az / ad * (mn - ad) * .5; } }
    pushOut(e, e.r * .8);
    if (DG.on && DG.lock) { const L = DG.lock, m = Math.min(e.r * .6 + .3, 3); e.x = clamp(e.x, L.x - L.w / 2 + m, L.x + L.w / 2 - m); e.z = clamp(e.z, L.z - L.d / 2 + m, L.z + L.d / 2 - m); }
    if (dist < e.r + 1.8 && !(e.atkT > 0) && Math.random() < dt * 2) e.atkT = .55;
    if (dist < e.r + .6 && P.inv <= 0 && hurtP(e.dmg)) return;
  }
  for (const p of PJ) {
    if (p.wait > 0) { p.wait -= dt; if (p.wait > 0) continue; p.mesh.visible = true; if (p.hand) { const hp = handPt(p.hand[0], p.hand[1], p.vx < 0); p.x = hp.x; p.z = hp.z; p.mesh.position.set(hp.x, hp.y, hp.z); } }
    p.life -= dt;
    if (p.k === "heart") { if (!p.tgt || p.tgt.dead) { let b = null, bd = 1e9; for (const e of E) if (!e.dead) { const dd = Math.hypot(e.x - p.x, e.z - p.z); if (dd < bd) { bd = dd; b = e; } } p.tgt = b; }
      if (p.tgt) { const a = Math.atan2(p.tgt.z - p.z, p.tgt.x - p.x); p.vx += (Math.cos(a) * 11 - p.vx) * Math.min(1, dt * 5); p.vz += (Math.sin(a) * 11 - p.vz) * Math.min(1, dt * 5); } }
    if (p.k === "spin" && p.boom) { // boomerang: hết thời gian bay ra thì quay về người chơi
      p.age = (p.age || 0) + dt;
      if (p.age > p.boom) { if (!p.back) { p.back = true; p.hit.clear(); } const dx = P.x - p.x, dz = P.z - p.z, dd = Math.hypot(dx, dz) || 1; p.vx = dx / dd * p.spd * 1.15; p.vz = dz / dd * p.spd * 1.15; if (dd < 1) p.life = 0; }
    }
    homing(p, dt); // đạn, mũi tên, vật ném tự bẻ hướng về kẻ địch phía trước
    if (p.k === "heart") { p.mesh.material.rotation = scrAng(p.x, 1.4, p.z, p.vx, p.vz); p.mesh.material.map = fxTex("heart", (t * 8 | 0) % 2); // tim quay theo hướng bay, nhấp nháy
      if ((p.tr = (p.tr || 0) - dt) <= 0) { p.tr = .09; part(HEART_TEX, p.x, 1.4, p.z, .38, .4, [0, .6, 0]); } }
    const ox = p.x, oz = p.z; p.x += p.vx * dt; p.z += p.vz * dt; p.mesh.position.x = p.x; p.mesh.position.z = p.z;
    if (p.k === "lob") p.mesh.position.y = 1 + Math.sin(Math.min(1, 1 - p.life / p.T) * Math.PI) * 3;
    if (p.efx) elemFx(p, dt);
    if (p.k === "tire" || p.k === "arrow" || p.k === "bullet" || p.k === "spin") {
      if (p.k === "tire" || p.k === "spin") p.mesh.userData.sp.rotation.z += dt * (p.heavy ? 11 : 16);
      for (const e of E) if (!e.dead && !p.hit.has(e) && segDist(e.x, e.z, ox, oz, p.x, p.z) < e.r + p.r) { // kiểm tra theo cả đoạn đường bay, đạn nhanh không xuyên qua địch
        p.hit.add(e); dmg(e, p.d, p.kb || (p.k === "bullet" ? .3 : 1.2), p.x, p.z); if (p.efx) elemHit(p, e);
        if (p.k === "bullet") fxAnim("hit", e.x, 1.6 * e.mesh.scale.y, e.z, 1.5, Math.random() * 6.28, .2); // tia lửa khi trúng đạn
        else if (p.k === "arrow") fxAnim("feather", e.x, 1.6 * e.mesh.scale.y, e.z, 1.7, 0, .34); // lông vũ tung ra
        else if (p.heavy) { shake = Math.max(shake, 2); snd(140, .08, "triangle", .04, -50); }
        if (--p.pierce <= 0) { p.life = 0; break; } } }
    else { if (p.mesh.userData.sp) p.mesh.userData.sp.rotation.z += dt * 10; else p.mesh.rotation.y += dt * 6; if (p.life > 0) for (const e of E) if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) < e.r + .6) { explode(p); break; } }
    if (DG.on ? p.k !== "lob" && !canStand(p.x, p.z, 0) : Math.abs(p.x) > 40 || Math.abs(p.z) > 32) p.life = 0;
  }
  PJ = PJ.filter(p => { if (p.life > 0) return true; if (p.exp) explodeAt(p); dropFx(p.mesh); if (p.esp) dropFx(p.esp); return false; });
  const pr = 3.2 * (1 + SV.up.mag * .15 + P.pl.mag * .3);
  for (const g of G) { const dx = P.x - g.x, dz = P.z - g.z, dd = Math.hypot(dx, dz); if (dd < pr) g.mag = true; if (g.mag) { const s = 17 * dt; g.x += dx / (dd || 1) * s; g.z += dz / (dd || 1) * s; }
    g.mesh.position.set(g.x, .7 + Math.sin(t * 4 + g.v) * .1, g.z); g.mesh.rotation.y += dt * 2; if (dd < .7) { g.dead = true; scene.remove(g.mesh); if (DG.on) P.en = Math.min(P.enMax, P.en + 3); else P.xp += g.v * (1 + SV.up.xp * .08); if (Math.random() < .5) part(fxTex("gem", 0), g.x, 1, g.z, .8, .3, [0, 1.6, 0]); } }
  G = G.filter(g => !g.dead);
  for (const c of C) { c.mesh.rotation.y += dt; if (Math.hypot(P.x - c.x, P.z - c.z) < 1.6) { c.dead = true; if (c.mesh.isSprite) pxChestOpen(c); scene.remove(c.mesh); chestFx(c.x, c.z); if (DG.on) dgChest(); else lvq++; banner("Rương kho báu!"); snd(660, .3, "triangle", .06, 500); } }
  C = C.filter(c => !c.dead);
  PT.forEach(p => { p.t -= dt; p.mesh.position.x += p.vx * dt; p.mesh.position.z += p.vz * dt; p.vy -= 18 * dt; p.mesh.position.y = Math.max(.1, p.mesh.position.y + p.vy * dt); if (p.t <= 0) scene.remove(p.mesh); }); PT = PT.filter(p => p.t > 0);
  FM.forEach(f => { f.t += dt; const k = Math.min(1, f.t / f.dur);
    if (f.seq) { f.mesh.material.map = f.seq[Math.min(f.seq.length - 1, Math.floor(k * 1.7 * f.seq.length))]; f.mesh.material.opacity = k < .7 ? 1 : (1 - k) / .3; if (k >= 1) dropFx(f.mesh); return; }
    if (f.fr) { const fr = FXI[f.fr], i = Math.min(fr.length - 1, Math.floor(k * fr.length)); f.mesh.material.map = fxTex(f.fr, i); f.mesh.scale.set(f.w, f.w / fr[i].a, 1); f.mesh.material.opacity = (k < .8 ? 1 : (1 - k) / .2) * (f.o2 || 1); if (k >= 1) dropFx(f.mesh); return; } if (f.v) { f.mesh.position.x += f.v[0] * dt; f.mesh.position.y += f.v[1] * dt; f.mesh.position.z += f.v[2] * dt; f.v[1] -= (f.g || 0) * dt; }
    if (f.r1) f.mesh.scale.setScalar(Math.max(.1, f.r1 * (1 - (1 - k) * (1 - k)))); if (f.shrink) f.mesh.scale.setScalar(f.shrink * (1 - k * .7));
    const op = (1 - k) * (f.op || .85) * (f.flick ? .55 + Math.random() * .45 : 1); if (f.mats) f.mats.forEach(m => m.opacity = op); else f.mesh.material.opacity = op; if (k >= 1) dropFx(f.mesh); }); FM = FM.filter(f => f.t < f.dur);
  FX.forEach(f => { f.t -= dt; f.p.y += 1.5 * dt; if (f.t <= 0) f.el.remove(); }); FX = FX.filter(f => f.t > 0);
  E = E.filter(e => !e.dead); bannerT -= dt; hurtT = Math.max(0, hurtT - dt);
  while (P.xp >= P.need) { P.xp -= P.need; P.lvl++; P.need = Math.floor(5 + P.lvl * 4.4); lvq++; levelUpFx(); }
  if (lvq > 0 && state === "run") openLevelUp(); if (!DG.on && t >= 360 && !won && bi >= 2 && !E.some(e => e.boss)) { won = true; endRun(true); }
}
function hurtP(base) { // trả về true nếu người chơi gục
  if (P.inv > 0 || state !== "run") return false;
  if (P.shield) { P.shield = 0; P.inv = .6; ring(P.x, P.z, 2.6, 0xffd25e, .4); fxAnim("ethe_i", P.x, 0, P.z, 4, 0, .45, .5, 0xffffff, .12); floatText(P.x, 4, P.z, "CHẶN!", "#ffd25e"); return false; }
  if (DG.on) return dgHurt(base);
  if (R.anim) R.anim.hurtT = .45;
  const dm = Math.max(1, Math.round(base * (1 - P.pl.arm * .07))); P.hp -= dm; P.inv = .45; hurtT = .3; shake = Math.max(shake, 6); snd(90, .2, "sawtooth", .06, -40); burst(P.x, P.z, 0xe8453c, 8); floatText(P.x, 4, P.z, "-" + dm, "#ff8a8a");
  if (P.hp <= 0) { playerDown(); return true; } return false;
}
function playerDown() {
  if (P.rev > 0) { P.rev--; revive(.6, "Hồi sinh miễn phí!"); }
  else if (R.anim && R.anim.A.n.dead && state === "run") { state = "dying"; keysClear(); R.anim.dieT = 0; P.dieT = 1.4; } else endRun(false);
}
function revive(f, msg) { if (R.anim) { R.anim.dieT = undefined; R.anim.hurtT = 0; R.anim.winT = 0; } P.hp = Math.round(P.max * f); P.inv = 2.5; ring(P.x, P.z, 10, 0xffffff, .5); E.forEach(e => { if (!e.boss) { e.dead = true; dropFoe(e); } }); E = E.filter(e => !e.dead); banner(msg); snd(500, .4, "triangle", .07, 500); }

// ---------- Lên cấp, chọn kỹ năng ----------
function options() {
  const o = [], ev = [];
  for (const [id, w] of Object.entries(P.ws)) { if (w.lv < 5) o.push({k:"w", id, ic:wIc(id), t:`${WP[id].n} Lv${w.lv} → Lv${w.lv + 1}`, d:WP[id].d}); else if (!w.evo && P.pl[WP[id].need] > 0) ev.push({k:"e", id, ic:"⭐", t:`TIẾN HÓA: ${WP[id].evo}`, d:`${WP[id].n} đạt sức mạnh tối đa`}); }
  if (Object.keys(P.ws).length < 4) for (const id in WP) if (!P.ws[id] && (!WP[id].rare || rareOwn(id))) o.push({k:"w", id, ic:wIc(id), t:`Mới: ${WP[id].n}`, d:WP[id].d});
  for (const id in PS) if (P.pl[id] < 5) o.push({k:"p", id, ic:PS[id].ic, t:`${PS[id].n} Lv${P.pl[id]} → Lv${P.pl[id] + 1}`, d:PS[id].d});
  return [...ev, ...o.sort(() => Math.random() - .5)].slice(0, 3);
}
function openLevelUp() {
  const op = options(); if (!op.length) { lvq = 0; P.hp = Math.min(P.max, P.hp + P.max * .3); return; }
  state = "lv"; $("lvt").textContent = `Lên cấp ${P.lvl}! Chọn 1 kỹ năng (phím 1–3)`;
  $("lvc").replaceChildren(...op.map(o => h("button", {cls:"card", onclick:() => choose(o)}, h("i", {}, o.ic), h("b", {}, o.t), h("small", {}, o.d)))); $("lv").hidden = false; snd(600, .25, "triangle", .06, 500);
}
function choose(o) {
  if (o.k === "w") { if (P.ws[o.id]) P.ws[o.id].lv++; else addWeapon(o.id); } else if (o.k === "e") { P.ws[o.id].evo = true; P.ws[o.id].lv = 5; banner("TIẾN HÓA: " + WP[o.id].evo + "!"); shake = 8; }
  else { P.pl[o.id]++; if (o.id === "hp") { P.max += 20; P.hp = Math.min(P.max, P.hp + 20); } applyGear(); }
  updateHeld(SV.sel, true); renderSlots(); lvq--; $("lv").hidden = true; state = "run"; if (lvq > 0) openLevelUp();
}

// ---------- Kết thúc ván ----------
function endRun(win) {
  if (state === "end") return; // tránh cộng thưởng 2 lần khi thắng và thua trong cùng một khung hình
  state = "end"; keysClear(); $("hud").hidden = true; $("bossbar").hidden = true;
  // Chỉ cộng phần chênh lệch so với lần kết thúc trước (nếu người chơi đã trả xu để hồi sinh)
  const B = P.bank || (P.bank = {coins:0, kills:0, boss:0}), total = projCoins(), gain = total - B.coins; P.gain = gain;
  score = Math.min(99999, kills * 10 + Math.floor(t) * 5 + bossKills * 500 + (win ? 3000 : 0));
  SV.coins += gain; SV.best = Math.max(SV.best, Math.floor(t)); SV.mis.k += kills - B.kills; SV.mis.t = Math.max(SV.mis.t, t); SV.mis.b += bossKills - B.boss; SV.kt += kills - B.kills; let unl = ""; if (win && SV.cl < SV.chap + 1) { SV.cl = SV.chap + 1; if (SV.cl < CHAP.length) unl = ` Đã mở khóa Chương ${SV.cl + 1}: ${CHAP[SV.cl].n}!`; } save();
  Object.assign(B, {coins:total, kills, boss:bossKills});
  $("msg").textContent = win ? "CHIẾN THẮNG! Bạn đã giành được danh phận!" + unl : (DG.on ? `Gục ở Tầng ${SV.chap + 1}-${DG.floor} sau ${fmt(t)}` : `Thất bại sau ${fmt(t)}`);
  $("rew").textContent = `☠ ${kills} kẻ địch   ⏱ ${fmt(t)}   Điểm ${score}   💰 +${gain} xu (tổng ${SV.coins})`; $("saveForm").hidden = score === 0;
  const b = [];
  if (!win && !P.paid && SV.coins >= 100) b.push(h("button", {onclick:() => { SV.coins -= 100; P.paid = true; save(); $("end").hidden = true; $("hud").hidden = false; state = "run"; revive(.5, "Hồi sinh!"); }}, "Hồi sinh (💰100)"));
  b.push(h("button", {cls:"play", onclick:startRun}, "Chơi lại"), h("button", {onclick:() => { renderMenu(); $("end").hidden = true; $("menu").hidden = false; state = "menu"; }}, "Trang chủ"));
  $("endBtns").replaceChildren(...b); $("end").hidden = false; loadBoard();
}

// ---------- Trang chủ ----------
function renderMenu() {
  menuBg();
  const m = $("menu"), tabs = [["char", "Nhân vật"], ["shop", "Nâng cấp"], ["rare", "Vũ khí hiếm"], ["mis", "Nhiệm vụ" + (SV.gift !== today() ? " 🎁" : "")], ["rank", "🏆 Xếp hạng"]];
  m.replaceChildren(h("div", {cls:"top"}, h("b", {}, "💰 " + SV.coins), h("span", {}, "Kỷ lục sống sót: " + fmt(SV.best)), APP ? "" : h("button", {cls:"fsb", title:"Toàn màn hình", onclick:() => { const de = document.documentElement; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else if (de.requestFullscreen) de.requestFullscreen({navigationUI:"hide"}).catch(() => {}); }}, "⛶")), h("h2", {}, "Lốp Trưởng Đại Chiến"), h("p", {cls:"sub"}, `Chương ${SV.chap + 1} – ${CHAP[SV.chap].n}: vượt 3 tầng và hạ trùm cuối`),
    h("div", {cls:"chaps"}, ...CHAP.map((c, i) => h("button", {cls:(SV.chap === i ? "on" : "") + (i > SV.cl ? " lock" : ""), title:c.n, onclick:() => { if (i > SV.cl) return; SV.chap = i; save(); menuBg(); renderMenu(); }}, (i > SV.cl ? "🔒 " : "") + (i + 1) + ". " + c.n))),
    h("div", {cls:"tabs"}, ...tabs.map(([k, n]) => h("button", {cls:tab === k ? "on" : "", onclick:() => { tab = k; renderMenu(); }}, n))), h("div", {cls:"tabc"}, ...tabBody()), h("button", {cls:"play", onclick:startRun}, "▶ CHƠI"));
}
function tabBody() {
  if (tab === "rank") { const L = document.getElementById("list"), st = document.getElementById("status"), hn = document.querySelector(".hint"); setTimeout(() => { Promise.resolve(loadBoard()).then(() => { const o = document.querySelector("#menu .rkl"), L2 = document.getElementById("list"); if (o && L2) o.replaceChildren(...[...L2.children].map(li => li.cloneNode(true))); }).catch(() => {}); }, 0);
    return [h("ol", {cls:"rkl"}, ...(L ? [...L.children].map(li => li.cloneNode(true)) : [])), st && st.textContent ? h("p", {cls:"sub"}, st.textContent) : "", hn ? h("p", {cls:"hint2"}, hn.textContent) : ""]; }
  if (tab === "char") return [].concat(...Object.entries(CH).map(([id, c]) => { const own = SV.chars.includes(id), sel = SV.sel === id;
    const row = h("div", {cls:"row" + (sel ? " sel" : "")}, (c.anim ? h("span", {cls:"sw", style:`background:#fff url(${ANIM[c.anim].face}) center/cover`}) : h("span", {cls:"sw", style:`background:#${c.shirt.toString(16).padStart(6, "0")}`}, c.letter)), h("div", {cls:"tx"}, h("b", {}, c.n), h("small", {}, c.d)),
      h("button", {onclick:() => { if (own) SV.sel = id; else if (SV.coins >= c.cost) { SV.coins -= c.cost; SV.chars.push(id); SV.sel = id; } else return; save(); setChar(SV.sel); renderMenu(); }}, sel ? "Đang chọn" : own ? "Chọn" : "💰 " + c.cost)); return sel && c.anim && PXC[c.anim] ? [row, skinRow(id)] : [row]; }));
  if (tab === "rare") return Object.entries(RARE).map(([id, r]) => { const own = rareOwn(id);
    return h("div", {cls:"row"}, h("span", {cls:"sw", style:`background:#fff url(${SPR[r.img].uri}) center/80% no-repeat`}), h("div", {cls:"tx"}, h("b", {}, WP[id].ic + " " + WP[id].n), h("small", {}, WP[id].d + (own ? " Đã mở: xuất hiện khi lên cấp." : ` Mở khóa: ${r.c} hoặc mua.`))),
      h("button", {onclick:() => { if (own || SV.coins < r.cost) return; SV.coins -= r.cost; SV.rare.push(id); save(); renderMenu(); }}, own ? "Đã mở" : "💰 " + r.cost)); });
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
  battleTick();
  ambTick(dt); pauseBtn.style.display = rollBtn.style.display = fireBtn.style.display = skillBtn.style.display = swapBtn.style.display = TOUCH && state === "run" ? "block" : "none"; swapBtn.style.opacity = P && P.hand && P.hand[1] ? 1 : .35; rollBtn.style.opacity = P && P.rollCd > 0 ? .45 : 1;
  if (!P) return; const bob = P.mv ? Math.sin(P.t * 16) * .07 : Math.sin(P.t * 3) * .03, lg = P.mv ? Math.sin(P.t * 16) * .7 : 0;
  playerMesh.position.set(P.x, 0, P.z); playerMesh.visible = !(P.inv > 0 && Math.floor(P.inv * 14) % 2);
  let dA = Math.atan2(P.fz, P.fx) - faceA; dA = Math.atan2(Math.sin(dA), Math.cos(dA)); faceA += dA * Math.min(1, dt * 12);
  R.turnRate = dA * Math.min(1, dt * 12) / Math.max(dt, 1e-4); R.lean = (R.lean || 0) + (clamp(-R.turnRate * .02, -.12, .12) - (R.lean || 0)) * Math.min(1, dt * 8);
  R.body.rotation.y = Math.PI / 2 - faceA; R.body.position.y = bob;
  if (R.spr) { R.spr.position.y = bob; R.spr.userData.face(P.fx < 0); R.spr.children.forEach(c => c.material.rotation = P.mv ? .05 * Math.sin(P.t * 9) : 0); const ak = P.act ? Math.sin(Math.min(1, P.act.t / P.act.d) * Math.PI) : 0; R.spr.scale.set(1 + .03 * ak, 1 + .07 * ak, 1); }
  if (R.anim) animateAnim(dt); pxHeldTick(dt); pxBodyTick(dt);
  if (R.rig) animateRig(dt);
  if (R.model) animateModel(dt);
  if (R.held && R.held.userData.face) R.held.userData.face(P.fx < 0);
  // cầm vũ khí trên tay; ẩn khi vừa ném đi hoặc khi khung tấn công đã vẽ sẵn vũ khí
  P.empty = Math.max(0, (P.empty || 0) - dt); R.recoil = Math.max(0, (R.recoil || 0) - dt * 2.5);
  if (R.held) { R.held.visible = !R.anim && !!HELD[R.heldKind] && P.empty <= 0; /* nhân vật hoạt hình đã vẽ sẵn vũ khí trong từng khung */ if (R.anim) R.held.position.z = 1.2 - R.recoil; } R.legs[0].rotation.x = lg; R.legs[1].rotation.x = -lg; R.arms.forEach((a, i) => a.rotation.x = (i ? -lg : lg) * .5); R.weapon.rotation.y = Math.PI / 2 - faceA;
  R.cape.rotation.x = .15 + Math.sin(P.t * 10) * .1; R.tails.rotation.y = Math.sin(P.t * 12) * .25;
  for (const e of E) { const ud = e.mesh.userData;
    if (ud.dir) { const T = DIR_TEX[ud.key], V = DIR3[ud.key], ax = Math.abs(e.vx || 0), az = Math.abs(e.vz || 0); let v = 0, tx = T.front;
      if (ax > az * .9) { v = 1; tx = e.vx < 0 ? T.left : T.right; } else if ((e.vz || 0) < 0) { v = 2; tx = T.back; }
      ud.dir.material.map = tx; ud.dir.scale.set(ud.H * V[v].a, ud.H, 1); ud.dir.material.rotation = Math.sin(e.w * 1.1) * .05;
      const col = e.h > 0 ? 0xff8080 : e.boost > 0 ? 0xffb38a : e.elite ? 0xff9d9d : 0xffffff; if (e.em !== col) { e.em = col; ud.dir.material.color.setHex(col); }
      const sqE = e.h > 0 ? Math.min(1, e.h / .08) : 0, bsE = e.bs || (e.bs = e.mesh.scale.x); e.mesh.scale.set(bsE * (1 + .08 * sqE), bsE * (1 - .12 * sqE), bsE);
      e.mesh.position.set(e.x, FLOAT.has(ud.key) ? .35 + Math.sin(e.w * .7) * .25 : Math.abs(Math.sin(e.w * .9)) * .18, e.z); ud.dir.material.rotation = FLOAT.has(ud.key) ? Math.sin(e.w * .5) * .07 : Math.sin(e.w * 1.1) * .06 + clamp((e.vx || 0) * -.012, -.08, .08); continue; }
    if (ud.spr) { // yêu quái ảnh động: chọn khung đi/trúng đòn, quay mặt về phía người chơi (ảnh gốc nhìn sang trái)
      const F = FOE_TEX[ud.key], fl = P.x > e.x ? 1 : 0; e.atkT = Math.max(0, (e.atkT || 0) - dt);
      ud.spr.material.map = (e.h > 0 ? F.hit : e.atkT > 0 && F.atk ? F.atk[Math.min(5, Math.floor((1 - e.atkT / .55) * 6))] : F.walk[Math.floor(e.w * .9) % F.walk.length])[fl];
      const col = e.boost > 0 ? 0xffb38a : e.elite ? 0xff9d9d : 0xffffff, wf = e.h > .03; if (e.em !== col || e.wf !== wf) { e.em = col; e.wf = wf; ud.spr.material.color.setHex(col); if (wf) ud.spr.material.color.multiplyScalar(6); }
      const sqE = e.h > 0 ? Math.min(1, e.h / .08) : 0, bsE = e.bs || (e.bs = e.mesh.scale.x); e.mesh.scale.set(bsE * (1 + .1 * sqE), bsE * (1 - .15 * sqE), bsE);
      e.mesh.position.set(e.x, FLOAT.has(ud.key) ? .25 + Math.sin(e.w * .7) * .2 : 0, e.z); continue; }
    e.mesh.position.set(e.x, Math.abs(Math.sin(e.w)) * .14, e.z); e.mesh.rotation.y = Math.atan2(P.x - e.x, P.z - e.z); e.mesh.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(e.w * 1.2) * (i ? -.6 : .6));
    e.mesh.rotation.z = Math.sin(e.w * 1.2) * .08; const sqE = e.h > 0 ? Math.min(1, e.h / .08) : 0, bsE = e.bs || (e.bs = e.mesh.scale.x); e.mesh.scale.set(bsE * (1 + .12 * sqE), bsE * (1 - .22 * sqE), bsE * (1 + .12 * sqE));
    const want = e.h > 0 ? 0xffffff : e.boost > 0 ? 0xff5a00 : e.elite ? 0x661010 : 0; if (e.em !== want) { e.em = want; e.mats.forEach(m => { m.emissive.set(want); m.emissiveIntensity = .7; }); } }
  FX.forEach(f => { const v = f.p.clone().project(cam); f.el.style.left = (v.x * .5 + .5) * 100 + "%"; f.el.style.top = (-v.y * .5 + .5) * 100 + "%"; f.el.style.opacity = Math.min(1, f.t * 2); });
  const tgt = state === "run" || state === "pause" ? nearest() : null; reticle.visible = !!tgt; // vòng đánh dấu mục tiêu vũ khí đang nhắm
  if (tgt) { reticle.position.set(tgt.x, .08, tgt.z); reticle.scale.setScalar(tgt.r * 1.25 + .2); reticle.rotation.z += dt * 3; }
  flashT = Math.max(0, flashT - dt); flashEl.style.opacity = flashT * 2;
  const bs = E.find(e => e.boss); $("bossbar").hidden = !bs; if (bs) $("bossbar").firstElementChild.style.width = Math.max(0, bs.hp / bs.mhp * 100) + "%";
  $("banner").style.opacity = bannerT > 0 && state !== "menu" ? Math.min(1, bannerT) : 0; $("hurt").style.opacity = hurtT * 1.8;
  document.body.classList.toggle("dgmode", DG.on);
  if (DG.on) dgHud(); else { $("hpf").style.width = Math.max(0, P.hp / P.max * 100) + "%"; $("hpt").textContent = Math.max(0, Math.ceil(P.hp)) + "/" + P.max; $("xpf").style.width = Math.min(100, P.xp / P.need * 100) + "%";
  $("lvl").textContent = "Lv " + P.lvl; $("tm").textContent = fmt(t); $("kl").textContent = "☠ " + kills; $("cn").textContent = "💰 +" + projCoins(); }
}
function frame(tt) {
  const dt = juiceDt(Math.min(.05, (tt - last) / 1000)); last = tt; if (state === "run") update(dt); if (state === "dying" && (P.dieT -= dt) <= 0) endRun(false); if (P) syncVisuals(dt);
  shake = Math.max(0, shake - dt * 40); const px = P ? P.x : 0, pz = P ? P.z : 7, k = Math.min(1, dt * 6);
  camT.x += ((DG.on ? px : clamp(px, -MAXX + 11, MAXX - 11)) - camT.x) * k; camT.z += ((DG.on ? pz + 1 : clamp(pz, -MAXZ + 7, MAXZ - 7)) - camT.z) * k;
  if (FLAG) FLAG.rotation.y = Math.sin(tt / 600) * .25; // cờ bay nhẹ
  sun.position.set(px + 8, 18, pz + 8); sun.target.position.set(px, 0, pz); sun.target.updateMatrixWorld();
  const zk = 1 - ZOOM * .2; cam.position.set(camT.x + (Math.random() - .5) * shake * .04, 19 * zk + (Math.random() - .5) * shake * .04, camT.z + 14.5 * zk); cam.lookAt(camT.x, 0, camT.z - 1);
  composer.render(); drawMini(); requestAnimationFrame(frame);
}
function keysClear() { for (const k in keys) keys[k] = false; jo = null; mouseGo = null; mouseFire = false; touchFire = false; joyBase.style.display = "none"; }
const pauseEl = h("div", {cls:"overlay", id:"pause", hidden:""}, h("p", {cls:"big"}, "Tạm dừng"), h("p", {cls:"sub"}, "Nhấn Esc hoặc P để chơi tiếp"),
  h("div", {cls:"btns"}, h("button", {cls:"play", onclick:() => setPause(false)}, "▶ Tiếp tục"), h("button", {onclick:() => { setPause(false); endRun(false); }}, "Bỏ cuộc")));
$("lv").after(pauseEl);
function doRoll() { if (state !== "run" || !P || P.roll > 0 || P.rollCd > 0) return; const d = inputDir(), l = Math.hypot(d.x, d.z); P.rfx = l > .1 ? d.x / l : P.fx; P.rfz = l > .1 ? d.z / l : P.fz; const m = Math.hypot(P.rfx, P.rfz) || 1; P.rfx /= m; P.rfz /= m; P.roll = .45; P.rollCd = 1.6; snd(240, .08, "triangle", .03, -100); }
const rollBtn = h("button", {cls:"pbtn rbtn", "aria-label":"Lăn né"}, "⤳"); rollBtn.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); doRoll(); }); box.parentElement.append(rollBtn);
const pauseBtn = h("button", {cls:"pbtn", "aria-label":"Tạm dừng", onclick:() => setPause(true)}, "II"); box.parentElement.append(pauseBtn);
document.addEventListener("visibilitychange", () => { if (document.hidden) setPause(true); });
function setPause(on) {
  if (on && state === "run") { state = "pause"; keysClear(); pauseEl.hidden = false; }
  else if (!on && state === "pause") { state = "run"; pauseEl.hidden = true; last = performance.now(); }
}
addEventListener("blur", () => { keysClear(); setPause(true); });
document.addEventListener("visibilitychange", () => { if (document.hidden) { keysClear(); setPause(true); } });
addEventListener("keydown", e => { if (e.target.tagName === "INPUT") return; const k = e.key.toLowerCase(); if (k === "enter" && (state === "menu" || state === "end")) return startRun();
  if (k === "escape" || k === "p") { e.preventDefault(); return setPause(state === "run"); }
  if (state === "lv" && /^[1-3]$/.test(k)) { const c = $("lvc").children[+k - 1]; if (c) c.click(); return; } if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault(); if ((k === " " || k === "shift") && !e.repeat) doRoll(); if (k === "q" && !e.repeat) dgSwap(); if ((k === "e" || k === "k") && !e.repeat) dgSkill(); keys[k] = true; });
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
// cần điều khiển ảo hiện ở chỗ đặt ngón tay (điện thoại)
const joyBase = h("div", {cls:"joy"}), joyKnob = h("div", {cls:"joyk"}); joyBase.append(joyKnob); box.parentElement.append(joyBase);
const joyShow = (q, dx = 0, dy = 0) => { const r = box.getBoundingClientRect(); joyBase.style.display = "block"; joyBase.style.left = (jo.x - r.left) + "px"; joyBase.style.top = (jo.y - r.top) + "px"; const l = Math.hypot(dx, dy), k = l > 46 ? 46 / l : 1; joyKnob.style.transform = `translate(${dx * k}px,${dy * k}px)`; };
box.addEventListener("touchstart", e => { if (jo) return; const q = e.changedTouches[0]; jo = {id:q.identifier, x:q.clientX, y:q.clientY, dx:0, dz:0}; joyShow(q); }, {passive:true});
box.addEventListener("touchmove", e => { if (!jo) return; const q = [...e.touches].find(o => o.identifier === jo.id); if (!q) return; const dx = q.clientX - jo.x, dy = q.clientY - jo.y, l = Math.hypot(dx, dy); jo.dx = l > 8 ? dx / Math.max(l, 46) : 0; jo.dz = l > 8 ? dy / Math.max(l, 46) : 0; joyShow(q, dx, dy); }, {passive:true});
const joyEnd = e => { if (jo && [...e.changedTouches].some(o => o.identifier === jo.id)) { jo = null; joyBase.style.display = "none"; } };
box.addEventListener("touchend", joyEnd); box.addEventListener("touchcancel", joyEnd);
box.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && e.button === 0) { if (DG.on) mouseFire = true; else mouseGo = {x:e.clientX, y:e.clientY}; } });
addEventListener("pointermove", e => { if (mouseGo && e.pointerType === "mouse") mouseGo = {x:e.clientX, y:e.clientY}; });
addEventListener("pointerup", e => { if (e.pointerType === "mouse") { mouseGo = null; mouseFire = false; } });

// ---------- Bảng xếp hạng ----------
const LB_KEY = "lopRows"; // trước đây dùng nhầm khóa "chefRows" của game khác -> chuyển dữ liệu cũ sang
if (!localStorage.getItem(LB_KEY) && localStorage.getItem("chefRows")) localStorage.setItem(LB_KEY, localStorage.getItem("chefRows"));
const localRows = () => { try { return JSON.parse(localStorage.getItem(LB_KEY) || "[]"); } catch { return []; } };
async function loadBoard() {
  let rows = [];
  try {
    const fb = await FB;
    if (fb) { const snap = await fb.getDocs(fb.query(fb.collection(fb.db, COL), fb.orderBy("score", "desc"), fb.limit(5))); rows = snap.docs.map(d => d.data()); $("status").textContent = "Dữ liệu từ Firebase Firestore."; }
    else { rows = localRows(); $("status").textContent = "Chưa nối Firebase: đang lưu tạm trên máy."; }
  } catch (err) { $("status").textContent = "Không tải được bảng xếp hạng: " + errText(err); }
  const ol = $("list"); ol.replaceChildren();
  if (!rows.length) ol.append(Object.assign(document.createElement("li"), {textContent:"Chưa có ai có danh phận. Hãy là người đầu tiên!"}));
  rows.forEach(r => { const li = document.createElement("li"), sp = document.createElement("span"); li.textContent = r.name; sp.textContent = r.score; li.append(sp); ol.append(li); });
}
$("saveForm").addEventListener("submit", async e => {
  e.preventDefault(); const name = $("name").value.trim().slice(0, 12); if (!name) return; $("saveForm").hidden = true;
  try {
    const fb = await FB;
    if (fb) await fb.addDoc(fb.collection(fb.db, COL), {name, score, createdAt:fb.serverTimestamp()});
    else { const r = localRows(); r.push({name, score}); r.sort((a, b) => b.score - a.score); localStorage.setItem(LB_KEY, JSON.stringify(r.slice(0, 5))); }
  } catch (err) { $("status").textContent = "Lưu thất bại: " + errText(err); }
  loadBoard();
});

if (/[?&]debug\b/.test(location.search)) window.__d = {get P() { return P; }, get E() { return E; }, get state() { return state; }, get SV() { return SV; }, spawnE, startRun, lvUp: () => { P.xp = P.need; }, addWeapon, renderSlots, setT: v => { t = v; }, get PJ() { return PJ; }, get EB() { return EB; }, get CANS() { return CANS; }, dropCan, setChar, renderMenu, DG, dgFloor, dgSkill, dgSwap, dgChest, dgCleared, canStand, get C() { return C; }, fire: v => { touchFire = v; }, get pxSw() { return pxSw; }, hs: v => { HS = v; }, get pxb() { return PXB; }, get anim() { return R.anim; }, killAll: () => { DG.pend.forEach(q => q.t = 0); E.forEach(e => { if (!e.dead) die(e); }); }};
composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, cam));
bloom = new UnrealBloomPass(new THREE.Vector2(box.clientWidth || 2, box.clientHeight || 2), .08, .4, .97); composer.addPass(bloom); composer.addPass(new OutputPass());
resize();
// nền: tranh toàn cảnh trường sau menu và màn kết thúc, dãy núi đá vôi dưới chân trang
if (SV.chap > SV.cl) SV.chap = 0; menuBg();
document.body.style.background = `url(${IMG.mount.uri}) center bottom / 100% auto no-repeat fixed, var(--sun)`;
setChar(SV.sel); renderMenu(); loadBoard(); requestAnimationFrame(frame);
