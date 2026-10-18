/* ============================================================
   ТВОИ КАРТИНКИ (без папки images)
   ============================================================ */
const IMAGES = {
  bedrock: 'bedrock.png',
  weapons: [
    'wood.png',      // 0: Деревянный
    'stone.png',     // 1: Каменный
    'iron.png',      // 2: Железный
    'gold.png',      // 3: Золотой
    'diamond.png',   // 4: Алмазный
    'netherite.png', // 5: Незеритовый
    '',              // 6: Кирка богов (будет эмодзи)
    '',              // 7: Разрушитель миров (будет эмодзи)
    '',              // 8: Абсолют (будет эмодзи)
  ],
  upgrades: { dmg: '', auto: '', crit: '', coin: '' },
  donation: { blessing: '', thor: '', ender: '', midas: '', dragon: '', infinity: '' },
};

/* ============================================================
   ДАННЫЕ
   ============================================================ */
const WEAPONS = [
  { name:'Деревянный меч',    dmg:1,    cost:0,       icon:'🪵' },
  { name:'Каменный меч',      dmg:3,    cost:30,      icon:'🗡️' },
  { name:'Железный меч',      dmg:8,    cost:200,     icon:'⚔️' },
  { name:'Золотой меч',       dmg:22,   cost:900,     icon:'🏅' },
  { name:'Алмазный меч',      dmg:60,   cost:4000,    icon:'💠' },
  { name:'Незеритовый меч',   dmg:170,  cost:20000,   icon:'🔥' },
  { name:'Кирка богов',       dmg:500,  cost:100000,  icon:'⛏️' },
  { name:'Разрушитель миров', dmg:1600, cost:500000,  icon:'🌌' },
  { name:'Абсолют',           dmg:5000, cost:2500000, icon:'☄️' },
];

const UPGRADES = [
  { key:'dmg',  name:'Заточка',    desc:'+20% урона за уровень',  base:100, mult:1.8, max:60, icon:'🔪' },
  { key:'auto', name:'Автокликер', desc:'+1 удар/сек за уровень', base:250, mult:2.0, max:60, icon:'🤖' },
  { key:'crit', name:'Крит. удар', desc:'+3% шанс крита (x3)',    base:150, mult:1.9, max:25, icon:'💥' },
  { key:'coin', name:'Жадность',   desc:'+25% монет за уровень',  base:300, mult:2.1, max:50, icon:'🪙' },
];

const DONATION = [
  { key:'blessing', name:'Благословение Незера', desc:'Урон <span class="r">×2</span>',             cost:150,  icon:'🔥' },
  { key:'thor',     name:'Перчатка Тора',        desc:'<span class="gr">+10</span> авто-ударов/сек', cost:200,  icon:'⚡' },
  { key:'ender',    name:'Око Эндера',           desc:'<span class="r">+20%</span> шанс крита',      cost:250,  icon:'👁️' },
  { key:'midas',    name:'Прикосновение Мидаса', desc:'Монеты <span class="g">×2</span>',           cost:300,  icon:'👑' },
  { key:'dragon',   name:'Кирка Дракона',        desc:'Монеты <span class="g">×3</span>',           cost:600,  icon:'🐉' },
  { key:'infinity', name:'Ядро Бесконечности',   desc:'Урон <span class="r">×3</span>',             cost:1000, icon:'🌠' },
];

/* ============================================================
   ХЕЛПЕРЫ
   ============================================================ */
function iconHTML(imgSrc, emoji){
  if (imgSrc){
    return `<img src="${imgSrc}" alt=""
              onerror="this.outerHTML='<span class=\\'emoji\\'>${emoji}</span>'">`;
  }
  return `<span class="emoji">${emoji}</span>`;
}

let adminDamageMult = 1;

/* ============================================================
   СОСТОЯНИЕ
   ============================================================ */
const SAVE_KEY = 'bedrockBreaker_v1';

function freshState(){
  return {
    coins: 0, gems: 0, weapon: 0,
    level: 1, hp: hpFor(1), maxHp: hpFor(1),
    upg: { dmg:0, auto:0, crit:0, coin:0 },
    don: {}, broken: 0, clicks: 0,
  };
}
let state = freshState();
let currentTab = 'weapons';

/* ============================================================
   ФОРМУЛЫ
   ============================================================ */
function hpFor(l){ return Math.ceil(12 * Math.pow(1.5, l - 1)); }
function rewardFor(l){ return Math.ceil(10 * Math.pow(1.5, l - 1)); }
function upgCost(u){ return Math.ceil(u.base * Math.pow(u.mult, state.upg[u.key])); }

function baseDamage(){
  let d = WEAPONS[state.weapon].dmg;
  d *= 1 + 0.20 * state.upg.dmg;
  if (state.don.blessing) d *= 2;
  if (state.don.infinity) d *= 3;
  return d * adminDamageMult;
}
function critChance(){
  return Math.min(0.95, 0.03 * state.upg.crit + (state.don.ender ? 0.20 : 0));
}
function coinMult(){
  let m = 1 + 0.25 * state.upg.coin;
  if (state.don.midas)  m *= 2;
  if (state.don.dragon) m *= 3;
  return m;
}
function autoRate(){
  let r = state.upg.auto;
  if (state.don.thor) r += 10;
  return r;
}
function rollDamage(){
  const base = baseDamage();
  const crit = Math.random() < critChance();
  return { dmg: crit ? base * 3 : base, crit };
}

/* ============================================================
   ЧИСЛА
   ============================================================ */
const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
function fmt(n){
  if (!isFinite(n)) return '∞';
  if (n < 1000) return Math.floor(n).toString();
  let i = 0;
  while (n >= 1000 && i < UNITS.length - 1){ n /= 1000; i++; }
  return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0)) + UNITS[i];
}

/* ============================================================
   DOM
   ============================================================ */
const $ = s => document.querySelector(s);
const elBedrock = $('#bedrock');
const elBedrockImg = $('#bedrockImg');
const elCracks  = $('#cracks');
const elFx      = $('#fx');
const elHpFill  = $('#hpfill');
const elHpText  = $('#hptext');
const elShop    = $('#shopItems');

(function applyBedrockImage(){
  if (IMAGES.bedrock){
    elBedrockImg.src = IMAGES.bedrock;
    elBedrockImg.onload  = () => elBedrock.classList.add('has-img');
    elBedrockImg.onerror = () => elBedrock.classList.remove('has-img');
  }
})();

/* ============================================================
   ЭФФЕКТЫ
   ============================================================ */
function spawnParticles(x, y, count, hue){
  for (let i = 0; i < count; i++){
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = x + 'px';
    p.style.top  = y + 'px';
    const a = Math.random() * Math.PI * 2;
    const d = 30 + Math.random() * 80;
    p.style.setProperty('--tx', Math.cos(a) * d + 'px');
    p.style.setProperty('--ty', Math.sin(a) * d + 'px');
    p.style.background = `hsl(${hue + Math.random()*40 - 20}, ${40+Math.random()*40}%, ${35+Math.random()*35}%)`;
    elFx.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}
function spawnDamageNumber(x, y, value, crit){
  const d = document.createElement('div');
  d.className = 'dmg-num' + (crit ? ' crit' : '');
  d.textContent = (crit ? '✦ ' : '') + fmt(value);
  d.style.left = x + 'px';
  d.style.top  = y + 'px';
  elFx.appendChild(d);
  setTimeout(() => d.remove(), 900);
}
function spawnCoinPop(x, y, amount){
  const d = document.createElement('div');
  d.className = 'dmg-num';
  d.style.color = '#fbbf24';
  d.style.textShadow = '0 2px 0 #000, 0 0 14px rgba(251,191,36,.9)';
  d.textContent = '+' + fmt(amount) + ' 🪙';
  d.style.left = x + 'px';
  d.style.top  = y + 'px';
  elFx.appendChild(d);
  setTimeout(() => d.remove(), 900);
}

let toastTimer;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ============================================================
   БОЙ
   ============================================================ */
function applyHit(roll){
  state.hp -= roll.dmg;
  if (state.hp <= 0) breakBedrock();
}

function breakBedrock(){
  const reward = Math.ceil(rewardFor(state.level) * coinMult());
  state.coins += reward;
  state.broken++;

  let gemDrop = false;
  if (Math.random() < 0.03){
    state.gems += 1;
    gemDrop = true;
  }

  const rect = elBedrock.getBoundingClientRect();
  const arenaRect = elFx.getBoundingClientRect();
  const cx = rect.left - arenaRect.left + rect.width / 2;
  const cy = rect.top  - arenaRect.top  + rect.height / 2;

  spawnParticles(cx, cy, 22, 20);
  spawnCoinPop(cx, cy, reward);
  if (gemDrop) toast('💎 Выпал гем! +1');

  elBedrock.classList.add('hit');
  setTimeout(() => elBedrock.classList.remove('hit'), 160);

  state.level++;
  state.maxHp = hpFor(state.level);
  state.hp = state.maxHp;

  save();
  renderShop();
}

elBedrock.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  state.clicks++;

  const roll = rollDamage();
  applyHit(roll);

  const arenaRect = elFx.getBoundingClientRect();
  const x = e.clientX - arenaRect.left;
  const y = e.clientY - arenaRect.top;

  spawnParticles(x, y, roll.crit ? 14 : 8, roll.crit ? 45 : 15);
  spawnDamageNumber(x, y, roll.dmg, roll.crit);

  elBedrock.classList.add('hit');
  setTimeout(() => elBedrock.classList.remove('hit'), 160);
});

/* ============================================================
   МАГАЗИН
   ============================================================ */
function renderShop(){
  elShop.innerHTML = '';

  if (currentTab === 'weapons'){
    WEAPONS.forEach((w, i) => {
      const isCurrent = i === state.weapon;
      const isWeak    = i < state.weapon;
      const canBuy    = i > state.weapon && state.coins >= w.cost;
      const img = IMAGES.weapons[i] || '';

      let action;
      if (isCurrent){
        action = `<div class="owned-tag">В руках</div>`;
      } else if (isWeak){
        action = `<div class="owned-tag" style="color:#555;border-color:#333">Слабее</div>`;
      } else {
        action = `<button class="btn buy ${canBuy ? '' : 'disabled'}"
                    data-cost="${w.cost}" data-cur="coins"
                    onclick="buyWeapon(${i})">🪙 ${fmt(w.cost)}</button>`;
      }

      const el = document.createElement('div');
      el.className = 'item' + (isCurrent ? ' owned' : '');
      el.innerHTML = `
        <div class="icon">${iconHTML(img, w.icon)}</div>
        <div class="body">
          <div class="name">${w.name}</div>
          <div class="desc">Урон: <span class="r">${fmt(w.dmg)}</span></div>
        </div>
        ${action}
      `;
      elShop.appendChild(el);
    });
  }

  if (currentTab === 'upgrades'){
    UPGRADES.forEach(u => {
      const lvl  = state.upg[u.key];
      const maxed = lvl >= u.max;
      const cost = maxed ? 0 : upgCost(u);
      const canBuy = !maxed && state.coins >= cost;
      const img = IMAGES.upgrades[u.key] || '';

      const el = document.createElement('div');
      el.className = 'item' + (maxed ? ' owned' : '');
      el.innerHTML = `
        <div class="icon">${iconHTML(img, u.icon)}</div>
        <div class="body">
          <div class="name">${u.name} <span style="color:var(--green)">ур. ${lvl}</span></div>
          <div class="desc">${u.desc}</div>
        </div>
        ${maxed
          ? `<div class="owned-tag">МАКС</div>`
          : `<button class="btn buy ${canBuy ? '' : 'disabled'}"
               data-cost="${cost}" data-cur="coins"
               onclick="buyUpgrade('${u.key}')">🪙 ${fmt(cost)}</button>`}
      `;
      elShop.appendChild(el);
    });
  }

  if (currentTab === 'donate'){
    DONATION.forEach(d => {
      const owned  = !!state.don[d.key];
      const canBuy = !owned && state.gems >= d.cost;
      const img = IMAGES.donation[d.key] || '';

      const el = document.createElement('div');
      el.className = 'item' + (owned ? ' owned-gem' : '');
      el.innerHTML = `
        <div class="icon">${iconHTML(img, d.icon)}</div>
        <div class="body">
          <div class="name">${d.name}</div>
          <div class="desc">${d.desc}</div>
        </div>
        ${owned
          ? `<div class="owned-tag gem">КУПЛЕНО</div>`
          : `<button class="btn buy gem ${canBuy ? '' : 'disabled'}"
               data-cost="${d.cost}" data-cur="gems"
               onclick="buyDonation('${d.key}')">💎 ${fmt(d.cost)}</button>`}
      `;
      elShop.appendChild(el);
    });
  }

  updateAffordability();
}

function updateAffordability(){
  document.querySelectorAll('[data-cost]').forEach(btn => {
    const cost = Number(btn.dataset.cost);
    const cur  = btn.dataset.cur === 'gems' ? state.gems : state.coins;
    btn.classList.toggle('disabled', cur < cost);
  });
}

/* ============================================================
   ПОКУПКИ
   ============================================================ */
function buyWeapon(i){
  const w = WEAPONS[i];
  if (i <= state.weapon || state.coins < w.cost) return;
  state.coins -= w.cost;
  state.weapon = i;
  toast('⚔️ Экипировано: ' + w.name);
  save(); renderShop();
}
function buyUpgrade(key){
  const u = UPGRADES.find(x => x.key === key);
  if (!u || state.upg[key] >= u.max) return;
  const cost = upgCost(u);
  if (state.coins < cost) return;
  state.coins -= cost;
  state.upg[key]++;
  save(); renderShop();
}
function buyDonation(key){
  const d = DONATION.find(x => x.key === key);
  if (!d || state.don[key] || state.gems < d.cost) return;
  state.gems -= d.cost;
  state.don[key] = true;
  toast('💎 ' + d.name + ' активирован!');
  save(); renderShop();
}
window.buyWeapon = buyWeapon;
window.buyUpgrade = buyUpgrade;
window.buyDonation = buyDonation;

/* ============================================================
   АДМИН-ПАНЕЛЬ И АБЬЮЗ
   ============================================================ */
window.toggleAdmin = function() {
  $('#adminOverlay').classList.toggle('show');
};

window.adminAddCoins = function(amt) {
  state.coins += amt;
  save(); updateUI(); renderShop();
  toast('👑 Админ: +' + fmt(amt) + ' монет');
};

window.adminAddGems = function(amt) {
  state.gems += amt;
  save(); updateUI(); renderShop();
  toast('👑 Админ: +' + fmt(amt) + ' гемов');
};

window.adminKillBedrock = function() {
  state.hp = 0;
  breakBedrock();
  toast('👑 Админ: Бедрок уничтожен');
};

window.adminSetLevel = function(lvl) {
  state.level = lvl;
  state.maxHp = hpFor(lvl);
  state.hp = state.maxHp;
  save(); updateUI();
  toast('👑 Админ: Уровень ' + lvl);
};

window.adminMaxAll = function() {
  state.coins = 999999999999;
  state.gems = 999999;
  state.weapon = WEAPONS.length - 1;
  state.upg.dmg = 60;
  state.upg.auto = 60;
  state.upg.crit = 25;
  state.upg.coin = 50;
  DONATION.forEach(d => state.don[d.key] = true);
  save(); renderShop(); updateUI();
  toast('👑 Админ: Всё прокачано на МАКС!');
};

window.adminSetDmgMult = function(mult) {
  adminDamageMult = mult;
  toast('👑 Админ: Множитель урона x' + (mult > 1000 ? '∞' : mult));
  updateUI();
};

$('#adminBtn').addEventListener('click', () => window.toggleAdmin());

/* ============================================================
   ТАБЫ / ДОНАТ / СБРОС
   ============================================================ */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.tab;
    renderShop();
  });
});

$('#donateBtn').addEventListener('click', () => {
  state.gems += 100;
  toast('💎 +100 гемов (симуляция)');
  save(); renderShop();
});

$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Сбросить весь прогресс? Это нельзя отменить.')) return;
  state = freshState();
  adminDamageMult = 1;
  localStorage.removeItem(SAVE_KEY);
  renderShop(); toast('Прогресс сброшен');
});

/* ============================================================
   UI
   ============================================================ */
let uiCoins=-1, uiGems=-1, uiDmg=-1, uiLevel=-1, uiBroken=-1, uiWeapon=-1;

function updateUI(){
  if (state.coins !== uiCoins){ uiCoins = state.coins; $('#uiCoins').textContent = fmt(state.coins); }
  if (state.gems  !== uiGems ){ uiGems  = state.gems;  $('#uiGems').textContent  = fmt(state.gems);  }

  const dmgRounded = Math.round(baseDamage());
  if (dmgRounded !== uiDmg){ uiDmg = dmgRounded; $('#uiDmg').textContent = fmt(dmgRounded); }

  if (state.level !== uiLevel){ uiLevel = state.level; $('#uiLevel').textContent = state.level; }
  if (state.broken !== uiBroken){ uiBroken = state.broken; $('#uiBroken').textContent = fmt(state.broken); }

  if (state.weapon !== uiWeapon){
    uiWeapon = state.weapon;
    $('#uiWeapon').textContent = WEAPONS[state.weapon].name;
  }

  const ratio = Math.max(0, Math.min(1, state.hp / state.maxHp));
  elHpFill.style.width = (ratio * 100) + '%';
  elHpFill.classList.toggle('low', ratio < 0.3);
  elHpText.textContent = fmt(Math.max(0, state.hp)) + ' / ' + fmt(state.maxHp);

  elCracks.style.opacity = (1 - ratio) * 0.9;
  
  if (elBedrock.classList.contains('has-img')) {
    elBedrockImg.style.filter = `brightness(${0.55 + ratio * 0.45}) drop-shadow(0 12px 0 #0a0a0e) drop-shadow(0 16px 20px rgba(0,0,0,.7))`;
  } else {
    elBedrock.style.filter = `brightness(${0.55 + ratio * 0.45})`;
  }
}

/* ============================================================
   ЦИКЛ
   ============================================================ */
let lastTime = performance.now();
let autoAcc = 0;

function loop(now){
  const dt = Math.min(0.25, (now - lastTime) / 1000);
  lastTime = now;

  const rate = autoRate();
  if (rate > 0){
    autoAcc += rate * dt;
    let guard = 0;
    while (autoAcc >= 1 && guard < 300){
      autoAcc -= 1; guard++;
      applyHit(rollDamage());
    }
    if (autoAcc > 300) autoAcc = 0;
  }

  updateUI();
  updateAffordability();
  requestAnimationFrame(loop);
}

/* ============================================================
   СОХРАНЕНИЕ
   ============================================================ */
function save(){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e){}
}
function load(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    const f = freshState();
    state = { ...f, ...s, upg:{...f.upg, ...(s.upg||{})}, don:{...(s.don||{})} };
    if (!state.hp || state.hp <= 0 || !state.maxHp){
      state.maxHp = hpFor(state.level);
      state.hp = state.maxHp;
    }
  } catch(e){ state = freshState(); }
}
setInterval(save, 5000);
window.addEventListener('beforeunload', save);

/* ============================================================
   СТАРТ
   ============================================================ */
load();
renderShop();
updateUI();
requestAnimationFrame(loop);
