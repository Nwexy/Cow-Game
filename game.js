// ================== SETTINGS ==================
const LEVEL_STEP = 50;      // Points required for each level
const LEVEL_MULT = 1.25;    // Click multiplier per level
const SAVE_KEY = 'cowClickerSave_v1';

// Shop: passive income (cows per second)
const SHOP_ITEMS = [
  { id: 'calf',     icon: '🐮', name: 'CALF',     base: 50,   cps: 0.5 },
  { id: 'farmer',   icon: '👨‍🌾', name: 'FARMER',   base: 125,  cps: 2 },
  { id: 'barn',     icon: '🛖', name: 'BARN',     base: 400,  cps: 8 },
  { id: 'windmill', icon: '🌾', name: 'WINDMILL', base: 1500, cps: 30 },
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
  shopList: $('shop-list'),
  banner: $('levelup-banner'),
  bannerSub: $('levelup-sub'),
  reset: $('reset-btn'),
};

// ================== CALCULATIONS ==================
const perClick = () => Math.pow(LEVEL_MULT, state.level - 1);
const owned = (id) => state.owned[id] || 0;
const itemCost = (item) => Math.ceil(item.base * Math.pow(COST_GROWTH, owned(item.id)));
const totalCps = () => SHOP_ITEMS.reduce((s, it) => s + it.cps * owned(it.id), 0);

function fmt(n, decimals = 0) {
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  if (decimals === 0) return Math.floor(n).toString();
  return (Math.round(n * 100) / 100).toString();
}

// ================== POINTS & LEVEL ==================
function addPoints(amount) {
  state.score += amount;
  state.totalEarned += amount;
  state.levelProgress += amount;

  let leveled = false;
  while (state.levelProgress >= LEVEL_STEP) {
    state.levelProgress -= LEVEL_STEP;
    state.level++;
    leveled = true;
  }
  if (leveled) showLevelUp();
}

function showLevelUp() {
  el.bannerSub.textContent = `LV${state.level}  •  CLICK: +${fmt(perClick(), 2)}`;
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

  spawnFloatText(`+${fmt(gain, 2)}`, x, y);
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
    const unlocked = owned(item.id) > 0 || state.totalEarned >= item.base * 0.5;
    const canBuy = state.score >= cost;
    const b = item.el;

    b.classList.toggle('locked', !unlocked);
    b.classList.toggle('disabled', !canBuy);
    b.querySelector('.item-name').textContent = unlocked ? item.name : '???';
    b.querySelector('.item-desc').textContent = unlocked ? `+${item.cps}/SEC` : '';
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
  el.perClick.textContent = `PER CLICK: ${fmt(perClick(), 2)}`;
  el.levelLabel.textContent = `LV${state.level}`;
  el.levelMult.textContent = `x${fmt(perClick(), 2)}`;
  el.levelFill.style.height = `${(state.levelProgress / LEVEL_STEP) * 100}%`;
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

// ================== SAVE & LOAD ==================
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (_) { /* ignore */ }
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data) state = { ...state, ...data, owned: { ...(data.owned || {}) } };
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
