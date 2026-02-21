// ========================
// GAME STATE
// ========================
let G = {
  token: null, playerId: null,
  playerName: 'Игрок', avatar: '🦛',
  level: 1, xp: 0, xpNeeded: 100,
  coins: 500, gems: 50, wins: 0, losses: 0, elo: 1000, theme: 'default',
  hippos: [], inventory: [], expeditions: [], clan: null,
  quests: [], questsDate: null,
  activeHippo: 0,
  totalOpens: 0, legendaryOpens: 0, mythicOpens: 0,
  upgradePity: 0, selectedUpgradeItem: null, bossCD: 0,
  pinnedHippos: [],       // array of hippo IDs that are pinned
  protectedHippos: [],    // hippo IDs protected from sell-all
  colosseumCD: 0,         // next allowed colosseum time
  colosseumToday: 0,      // runs today
  bountyCD: {},           // { targetName: timestamp }
  bountyDaily: 0,         // hunts used today
  bountyDate: null,       // date of bounty reset
  clansData: null,        // server clans cache
  clanMembers: [],        // my clan members
  regions: JSON.parse(JSON.stringify(REGIONS)),
};

let selectedHippo = null;
let battleState = null;
let battleTimer = null;
let currentArenaMode = null;

// ========================
// SAVE / LOAD
// ========================
function saveGame() {
  localStorage.setItem('hippowars_save', JSON.stringify(G));
  if (G.token) debounceServerSync();
}

let syncTimeout = null;
function debounceServerSync() {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => syncToServer(), 3000);
}

async function syncToServer() {
  if (!G.token) return;
  try {
    await fetch('/api/players/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + G.token },
      body: JSON.stringify({
        player: { level:G.level, xp:G.xp, xp_needed:G.xpNeeded, coins:G.coins, gems:G.gems,
                  elo:G.elo, wins:G.wins, losses:G.losses, avatar:G.avatar, theme:G.theme },
        hippos: G.hippos,
      })
    });
  } catch {}
}

function loadGame() {
  const s = localStorage.getItem('hippowars_save');
  if (s) {
    try {
      const loaded = JSON.parse(s);
      G = { ...G, ...loaded };
      if (!G.regions || !G.regions.length) G.regions = JSON.parse(JSON.stringify(REGIONS));
      if (!G.pinnedHippos) G.pinnedHippos = [];
      if (!G.protectedHippos) G.protectedHippos = [];
      if (!G.bountyCD) G.bountyCD = {};
    } catch {}
  }
  G.token = localStorage.getItem('hw_token');
  const session = localStorage.getItem('hw_session');
  if (session) {
    try { const s = JSON.parse(session); G.playerName = s.username || G.playerName; G.playerId = s.id || null; } catch {}
  }
}

// ========================
// AUTH
// ========================
async function loginPlayer(username, password) {
  const res = await fetch('/api/auth/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  G.token = data.token; G.playerName = data.player.username; G.playerId = data.player.id;
  localStorage.setItem('hw_token', data.token);
  localStorage.setItem('hw_session', JSON.stringify({ id: data.player.id, username: data.player.username }));
  await loadFromServer();
  return data.player;
}

async function registerPlayer(username, password, email) {
  const res = await fetch('/api/auth/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ username, password, email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  G.token = data.token; G.playerName = data.player.username; G.playerId = data.player.id;
  localStorage.setItem('hw_token', data.token);
  localStorage.setItem('hw_session', JSON.stringify({ id: data.player.id, username: data.player.username }));
  return data.player;
}

async function loadFromServer() {
  if (!G.token) return;
  try {
    const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + G.token } });
    if (!res.ok) return;
    const data = await res.json();
    const p = data.player;
    G.level=p.level; G.xp=p.xp; G.xpNeeded=p.xp_needed;
    G.coins=p.coins; G.gems=p.gems; G.elo=p.elo;
    G.wins=p.wins; G.losses=p.losses; G.avatar=p.avatar; G.theme=p.theme||'default';
    if (data.hippos?.length) {
      G.hippos = data.hippos.map(h => ({
        ...h,
        stats: typeof h.stats==='string' ? JSON.parse(h.stats) : h.stats,
        mutations: typeof h.mutations==='string' ? JSON.parse(h.mutations) : (h.mutations||[]),
        equipped: typeof h.equipped==='string' ? JSON.parse(h.equipped) : (h.equipped||{}),
        inValhalla: h.in_valhalla===1,
      }));
    }
    applyTheme(G.theme);
    saveGame();
  } catch (err) { console.log('Load from server failed:', err.message); }
}

function logoutPlayer() {
  G.token = null;
  localStorage.removeItem('hw_token'); localStorage.removeItem('hw_session');
  window.location.href = '/';
}

// ========================
// THEME
// ========================
function applyTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
  if (theme && theme !== 'default') document.body.classList.add('theme-' + theme);
  G.theme = theme;
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme || (btn.dataset.theme === 'default' && !theme));
  });
  saveGame();
}

// ========================
// UI HELPERS
// ========================
function setTab(name, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name)?.classList.add('active');
  if (el) el.classList.add('active');
  renderTab(name);
}

function setTabByName(name) {
  const btns = document.querySelectorAll('.nav-btn');
  let target;
  btns.forEach(b => { if (b.getAttribute('onclick')?.includes("'"+name+"'")) target = b; });
  setTab(name, target);
}

function renderTab(name) {
  const renders = {
    home: renderHome, cases: renderCases, inventory: renderInventory,
    hippos: renderHippos, arena: renderArena, world: renderWorld,
    clans: renderClans, leaderboard: () => loadLeaderboard('elo'),
    shop: renderShop, valhalla: renderValhalla, profile: renderProfile,
    search: renderSearch, bossfight: renderBossFightTab,
  };
  renders[name]?.();
}

function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }

function toast(msg, type='', duration=3000) {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${type==='success'?'✓':type==='error'?'✕':type==='legendary'?'🌟':'ℹ'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => { t.style.animation = 'toastIn 0.3s ease reverse'; setTimeout(() => t.remove(), 300); }, duration);
}

function updateHeader() {
  document.getElementById('hdr-coins').textContent = G.coins.toLocaleString();
  document.getElementById('hdr-gems').textContent = G.gems;
  document.getElementById('hdr-level').textContent = G.level;
  document.getElementById('hdr-name').textContent = G.playerName;
}

function addXP(amount) {
  G.xp += amount;
  while (G.xp >= G.xpNeeded) {
    G.xp -= G.xpNeeded; G.level++;
    G.xpNeeded = Math.floor(100 * Math.pow(1.3, G.level - 1));
    toast(`🎉 Уровень ${G.level}! +100 монет`, 'success');
    G.coins += 100;
  }
  updateHeader(); saveGame();
}

// ========================
// HIPPO HELPERS
// ========================
function rollRarity(rarityList) {
  const entries = rarityList
    ? Object.entries(rarityList).filter(([,v]) => v > 0)
    : Object.entries(RARITIES).map(([k,v]) => [k, v.chance]);
  const total = entries.reduce((a,[,v]) => a+v, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return entries[entries.length-1][0];
}

function generateHippo(rarity) {
  const r = rarity || rollRarity();
  const mult = { common:1, uncommon:1.3, rare:1.7, epic:2.2, legendary:3, mythic:5 }[r] || 1;
  const base = 20 + Math.floor(Math.random() * 20);
  const hippo = {
    id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
    name: HIPPO_NAMES[Math.floor(Math.random() * HIPPO_NAMES.length)],
    emoji: HIPPO_EMOJIS[Math.floor(Math.random() * HIPPO_EMOJIS.length)],
    rarity: r, level: 1, xp: 0, deaths: 0, wins: 0, losses: 0,
    upgradeCount: 0,
    stats: {
      str: Math.floor(base * mult * (0.8 + Math.random() * 0.4)),
      agi: Math.floor(base * mult * (0.8 + Math.random() * 0.4)),
      int: Math.floor(base * mult * (0.8 + Math.random() * 0.4)),
      vit: Math.floor(base * mult * (0.8 + Math.random() * 0.4)),
      lck: Math.floor(base * mult * (0.8 + Math.random() * 0.4)),
    },
    mutations: [],
    equipped: { weapon:null, armor:null, accessory:null, artifact:null },
    inValhalla: false,
  };
  const mutChance = { common:0, uncommon:0.1, rare:0.3, epic:0.6, legendary:0.85, mythic:1 }[r] || 0;
  if (Math.random() < mutChance) hippo.mutations.push(MUTATIONS[Math.floor(Math.random()*MUTATIONS.length)].id);
  if (['epic','legendary','mythic'].includes(r) && Math.random() < 0.4) {
    const m2 = MUTATIONS[Math.floor(Math.random()*MUTATIONS.length)].id;
    if (!hippo.mutations.includes(m2)) hippo.mutations.push(m2);
  }
  if (r === 'mythic' && Math.random() < 0.5) {
    const m3 = MUTATIONS[Math.floor(Math.random()*MUTATIONS.length)].id;
    if (!hippo.mutations.includes(m3)) hippo.mutations.push(m3);
  }
  return hippo;
}

function getHippoHP(hippo) {
  if (!hippo) return 100;
  const base = 100 + (hippo.stats?.vit || 10) * 5;
  const eqBonus = getEquipBonus(hippo);
  const mutBonus = (hippo.mutations||[]).includes('giant') ? 80 : 0;
  return Math.floor(base + (eqBonus.vit||0)*5 + mutBonus);
}

function getEquipBonus(hippo) {
  const bonus = { str:0, agi:0, int:0, vit:0, lck:0 };
  Object.values(hippo.equipped||{}).forEach(itemId => {
    if (!itemId) return;
    const item = G.inventory.find(i=>i.id===itemId) || ALL_ITEMS.find(i=>i.id===itemId);
    if (!item) return;
    const lvMult = 1 + (item.upgradeLevel||0) * 0.15;
    Object.entries(item.bonus||{}).forEach(([k,v]) => { bonus[k] = (bonus[k]||0) + Math.floor(v*lvMult); });
  });
  return bonus;
}

function getHippoATK(hippo) {
  if (!hippo) return 10;
  const eqBonus = getEquipBonus(hippo);
  let atk = (hippo.stats?.str||10) + (eqBonus.str||0);
  if ((hippo.mutations||[]).includes('fire')) atk = Math.floor(atk * 1.15);
  return atk;
}

function isHippoInExpedition(hippo) {
  return G.expeditions.some(e => !e.claimed && e.hippoId === hippo.id && Date.now() < e.endTime);
}

function getRarityName(r) { return RARITIES[r]?.name || r; }
function getRarityColor(r) {
  return { common:'#9ca3af', uncommon:'#10b981', rare:'#a855f7', epic:'#f59e0b', legendary:'#ff6b00', mythic:'#ff0080' }[r] || '#fff';
}
function fmtTime(ms) {
  const m = Math.floor(ms/60000), s = Math.floor((ms%60000)/1000);
  return m > 0 ? `${m}м ${s}с` : `${s}с`;
}
