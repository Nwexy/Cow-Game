// ================== SETTINGS & LEVELS ==================
const LEVELS = [
  { level: 1,  name: 'BABY CALF',        req: 150,             click: 1 },
  { level: 2,  name: 'PASTURE GRAZER',    req: 400,             click: 2 },
  { level: 3,  name: 'BELL RINGER',       req: 1000,            click: 4 },
  { level: 4,  name: 'MILK PRODUCER',     req: 2500,            click: 7 },
  { level: 5,  name: 'BUTTER BOSS',       req: 6500,            click: 12 },
  { level: 6,  name: 'FARM CHAMPION',     req: 16000,           click: 22 },
  { level: 7,  name: 'HORNED HERO',       req: 40000,           click: 40 },
  { level: 8,  name: 'GOLDEN UDDER',      req: 100000,          click: 75 },
  { level: 9,  name: 'MEADOW KING',       req: 250000,          click: 140 },
  { level: 10, name: 'HOLY COW',          req: 650000,          click: 260 },
  { level: 11, name: 'CYBER BOVINE',      req: 1600000,         click: 500 },
  { level: 12, name: 'SUPER MOO',         req: 4000000,         click: 950 },
  { level: 13, name: 'STAR GRAZER',       req: 10000000,        click: 1800 },
  { level: 14, name: 'QUANTUM COW',       req: 25000000,        click: 3500 },
  { level: 15, name: 'NEBULA BEAST',      req: 65000000,        click: 7000 },
  { level: 16, name: 'GALACTIC UDDER',    req: 160000000,       click: 14000 },
  { level: 17, name: 'COSMIC OVERLORD',   req: 400000000,       click: 28000 },
  { level: 18, name: 'CELESTIAL COW',     req: 1000000000,      click: 55000 },
  { level: 19, name: 'TIME TRAVELER',     req: 2500000000,      click: 110000 },
  { level: 20, name: 'REALITY WARPER',    req: 6500000000,      click: 230000 },
  { level: 21, name: 'ETERNAL MOO',       req: 16000000000,     click: 480000 },
  { level: 22, name: 'MOO SINGULARITY',   req: 40000000000,     click: 1000000 },
  { level: 23, name: 'UNIVERSE GRAZER',   req: 100000000000,    click: 2200000 },
  { level: 24, name: 'ASCENDED BOVINE',   req: 250000000000,    click: 5000000 },
  { level: 25, name: 'GOD OF COWS',       req: 0,               click: 12000000 },
];
const MAX_LEVEL = LEVELS.length;
const SAVE_KEY = 'cowClickerSave_v1';

// Shop: passive income (cows per second) - rebalanced & tempered
const SHOP_ITEMS = [
  { id: 'calf',     icon: '🐮', name: 'CALF',           base: 60,         cps: 0.25 },
  { id: 'farmer',   icon: '👨‍🌾', name: 'FARMER',         base: 200,        cps: 1.0 },
  { id: 'barn',     icon: '🛖', name: 'BARN',           base: 750,        cps: 4.0 },
  { id: 'windmill', icon: '🌾', name: 'WINDMILL',       base: 3000,       cps: 15.0 },
  { id: 'silo',     icon: '🏭', name: 'SILO',           base: 14000,      cps: 60.0 },
  { id: 'dairy',    icon: '🥛', name: 'DAIRY FACTORY',  base: 70000,      cps: 260.0 },
  { id: 'tractor',  icon: '🚜', name: 'ROBO TRACTOR',   base: 350000,     cps: 1100.0 },
  { id: 'ufo',      icon: '🛸', name: 'COW BEAM UFO',   base: 1800000,    cps: 5000.0 },
  { id: 'cosmic',   icon: '🌌', name: 'COSMIC MEADOW',  base: 10000000,   cps: 25000.0 },
  { id: 'matrix',   icon: '🧬', name: 'COW MATRIX',     base: 60000000,   cps: 120000.0 },
];
const COST_GROWTH = 1.15;

// ================== STATE ==================
let state = {
  score: 0,
  totalEarned: 0,
  level: 1,
  levelProgress: 0,
  owned: {},
};

// ================== DOM ELEMENTS ==================
const $ = (id) => document.getElementById(id);
const el = {
  game: $('game'),
  score: $('score'),
  cps: $('cps'),
  perClick: $('per-click'),
  levelLabel: $('level-label'),
  levelFill: $('level-fill'),
  levelMult: $('level-mult'),
  cowBtn: $('cow-btn'),
  cow: $('cow'),
  cowGlasses: $('cow-glasses'),
  shopList: $('shop-list'),
  banner: $('levelup-banner'),
  bannerTitle: $('levelup-title'),
  bannerRank: $('levelup-rank'),
  bannerSub: $('levelup-sub'),
  reset: $('reset-btn'),
};

// ================== CALCULATIONS ==================
const currentLevelData = (lvl = state.level) => LEVELS[Math.min(Math.max(1, lvl), MAX_LEVEL) - 1];
const currentLevelReq = (lvl = state.level) => currentLevelData(lvl).req || 1;
const perClick = () => currentLevelData().click;
const owned = (id) => state.owned[id] || 0;
const itemCost = (item) => Math.ceil(item.base * Math.pow(COST_GROWTH, owned(item.id)));
const totalCps = () => SHOP_ITEMS.reduce((s, it) => s + it.cps * owned(it.id), 0);

function fmt(n, decimals = 0) {
  if (!isFinite(n) || isNaN(n)) return '0';
  if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  if (decimals === 0) return Math.floor(n).toString();
  return (Math.round(n * 100) / 100).toString();
}

// ================== POINTS & LEVEL ==================
function addPoints(amount) {
  if (!isFinite(amount) || isNaN(amount) || amount <= 0) return;
  state.score += amount;
  state.totalEarned += amount;

  if (state.level >= MAX_LEVEL) {
    state.level = MAX_LEVEL;
    state.levelProgress = 0;
    return;
  }

  state.levelProgress += amount;
  let leveled = false;
  let guard = 0;

  while (state.level < MAX_LEVEL && guard < 50) {
    const req = currentLevelReq(state.level);
    if (state.levelProgress >= req) {
      state.levelProgress -= req;
      state.level++;
      leveled = true;
      guard++;
    } else {
      break;
    }
  }

  if (state.level >= MAX_LEVEL) {
    state.level = MAX_LEVEL;
    state.levelProgress = 0;
  }

  if (leveled) {
    showLevelUp();
    triggerSunglasses();
  }
}

let sunglassesTimer = null;
function triggerSunglasses() {
  const g = el.cowGlasses;
  if (!g) return;

  clearTimeout(sunglassesTimer);
  g.classList.remove('active', 'fade-out');
  void g.offsetWidth; // Force reflow to replay drop animation
  g.classList.add('active');

  // Sparkle chime right after glasses land on the cow's face
  setTimeout(() => playGlintSound(), 620);

  // Keep sunglasses on cow for 4.2 seconds then fade out smoothly
  sunglassesTimer = setTimeout(() => {
    g.classList.add('fade-out');
    setTimeout(() => {
      g.classList.remove('active', 'fade-out');
    }, 450);
  }, 4200);
}

function showLevelUp() {
  const lvlData = currentLevelData();
  const isMax = state.level >= MAX_LEVEL;

  if (el.bannerTitle) el.bannerTitle.textContent = isMax ? 'MAX LEVEL!' : 'LEVEL UP!';
  if (el.bannerRank) el.bannerRank.textContent = `★ ${lvlData.name} ★`;
  if (el.bannerSub) el.bannerSub.textContent = `LV${state.level}  •  CLICK: +${fmt(perClick())}`;

  el.banner.classList.add('hidden');
  void el.banner.offsetWidth; // trigger reflow to restart animation
  el.banner.classList.remove('hidden');
  playLevelUpSound();
}

// ================== CLICKING ==================
function clickCow(x, y) {
  const gain = perClick();
  addPoints(gain);

  // cow squish effect
  el.cow.classList.add('squish');
  setTimeout(() => el.cow.classList.remove('squish'), 70);

  // score pop effect
  el.score.classList.add('pop');
  setTimeout(() => el.score.classList.remove('pop'), 80);

  spawnFloatText(`+${fmt(gain)}`, x, y);
  spawnParticles(x, y);
  playClickSound();
  render();
}

el.cowBtn.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const r = el.game.getBoundingClientRect();
  clickCow(e.clientX - r.left, e.clientY - r.top);
});

// Spacebar also triggers click
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault();
    const gr = el.game.getBoundingClientRect();
    const cr = el.cow.getBoundingClientRect();
    clickCow(cr.left - gr.left + cr.width / 2, cr.top - gr.top + cr.height / 3);
  }
});

function spawnFloatText(text, x, y) {
  const t = document.createElement('div');
  t.className = 'float-text';
  t.textContent = text;
  t.style.left = `${x - 20 + (Math.random() * 30 - 15)}px`;
  t.style.top = `${y - 30}px`;
  el.game.appendChild(t);
  setTimeout(() => t.remove(), 900);
}

const PARTICLE_COLORS = ['#ffffff', '#ffd85a', '#ff9fb2', '#7ee36b'];
function spawnParticles(x, y) {
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const ang = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    el.game.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

// ================== SHOP ==================
function buildShop() {
  el.shopList.innerHTML = '';
  for (const item of SHOP_ITEMS) {
    const btn = document.createElement('button');
    btn.className = 'shop-item';
    btn.id = `shop-${item.id}`;
    btn.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-info">
        <span class="item-name"></span>
        <span class="item-desc"></span>
      </div>
      <div>
        <div class="item-cost"></div>
        <div class="item-owned"></div>
      </div>`;
    btn.addEventListener('click', () => buy(item));
    el.shopList.appendChild(btn);
    item.el = btn;
  }
}

function buy(item) {
  const cost = itemCost(item);
  if (state.score < cost) return;
  state.score -= cost;
  state.owned[item.id] = owned(item.id) + 1;
  playBuySound();
  render();
  save();
}

function renderShop() {
  for (const item of SHOP_ITEMS) {
    const cost = itemCost(item);
    const unlocked = owned(item.id) > 0 || state.totalEarned >= item.base * 0.4;
    const canBuy = state.score >= cost;
    const b = item.el;
    if (!b) continue;

    b.classList.toggle('locked', !unlocked);
    b.classList.toggle('disabled', !canBuy);
    b.querySelector('.item-name').textContent = unlocked ? item.name : '???';
    b.querySelector('.item-desc').textContent = unlocked ? `+${fmt(item.cps, 2)}/SEC` : '';
    const costEl = b.querySelector('.item-cost');
    costEl.textContent = fmt(cost);
    costEl.classList.toggle('cant', !canBuy);
    b.querySelector('.item-owned').textContent = unlocked ? `x${owned(item.id)}` : '';
  }
}

// ================== RENDER ==================
function render() {
  el.score.textContent = fmt(state.score);
  el.cps.textContent = `${fmt(totalCps(), 2)} COWS PER SECOND`;
  el.perClick.textContent = `PER CLICK: ${fmt(perClick())}`;
  
  const isMax = state.level >= MAX_LEVEL;
  el.levelLabel.textContent = isMax ? 'MAX' : `LV${state.level}`;
  el.levelMult.textContent = `+${fmt(perClick())}`;

  if (isMax) {
    el.levelFill.style.height = '100%';
  } else {
    const req = currentLevelReq();
    const pct = Math.min(100, Math.max(0, (state.levelProgress / req) * 100));
    el.levelFill.style.height = `${pct}%`;
  }
  
  renderShop();
}

// ================== GAME LOOP ==================
let last = performance.now();
let uiTimer = 0;
function loop(now) {
  const dt = Math.min((now - last) / 1000, 1);
  last = now;

  const cps = totalCps();
  if (cps > 0) addPoints(cps * dt);

  uiTimer += dt;
  if (uiTimer >= 0.1) {
    uiTimer = 0;
    render();
  }
  requestAnimationFrame(loop);
}

// ================== AUDIO (WebAudio) ==================
let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function tone(freq, dur, type = 'square', vol = 0.06, slideTo = null, delay = 0) {
  try {
    const c = ctx();
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur);
  } catch (_) { /* audio context blocked or unavailable */ }
}

function playClickSound() {
  const f = 320 + Math.random() * 80;
  tone(f, 0.08, 'square', 0.05, f * 1.6);
}

function playBuySound() {
  tone(523, 0.08, 'square', 0.05);
  tone(784, 0.12, 'square', 0.05, null, 0.08);
}

function playLevelUpSound() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.05, null, i * 0.09));
}

function playGlintSound() {
  // High-pitch sparkling glint chime when sunglasses land
  [1175, 1397, 1760, 2349].forEach((f, i) => {
    tone(f, 0.10, 'sine', 0.04, f * 1.05, i * 0.05);
  });
}

// ================== SAVE & LOAD ==================
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (_) { /* ignore */ }
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data) {
      state = { ...state, ...data, owned: { ...(data.owned || {}) } };
      // Sanitize numbers
      if (!isFinite(state.score) || isNaN(state.score)) state.score = 0;
      if (!isFinite(state.totalEarned) || isNaN(state.totalEarned)) state.totalEarned = 0;
      if (!isFinite(state.levelProgress) || isNaN(state.levelProgress)) state.levelProgress = 0;
      state.level = Math.min(Math.max(1, parseInt(state.level, 10) || 1), MAX_LEVEL);
    }
  } catch (_) { /* ignore */ }
}

el.reset.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all game progress?')) {
    state = { score: 0, totalEarned: 0, level: 1, levelProgress: 0, owned: {} };
    save();
    render();
  }
});

setInterval(save, 5000);
window.addEventListener('beforeunload', save);

// ================== START ==================
load();
buildShop();
render();
requestAnimationFrame(loop);
