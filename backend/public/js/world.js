// ========================
// HOME
// ========================
function renderHome() {
  updateHeader();
  const h = G.hippos[G.activeHippo||0];
  document.getElementById('home-hippo-emoji').textContent = h ? h.emoji : '🦛';
  document.getElementById('home-player-name').textContent = G.playerName;
  document.getElementById('home-xp').textContent = G.xp + ' / ' + G.xpNeeded;
  document.getElementById('home-xp-bar').style.width = (G.xp / G.xpNeeded * 100) + '%';
  document.getElementById('home-wins').textContent = G.wins;
  document.getElementById('home-losses').textContent = G.losses;
  document.getElementById('home-elo').textContent = G.elo;
  document.getElementById('home-hippos').textContent = G.hippos.length;
  const titles = ['Новобранец','Воин','Ветеран','Чемпион','Легенда','Бог бегемотов'];
  document.getElementById('home-player-title').textContent = titles[Math.min(Math.floor(G.level/10), titles.length-1)];

  // Quests: 6 types, reset daily
  if (!G.quests.length || G.questsDate !== new Date().toDateString()) {
    G.quests = [
      { emoji:'⚔️', name:'Победить в 5 боях',    goal:5,  progress:0, reward:150, rewardGems:0, done:false },
      { emoji:'📦', name:'Открыть 3 кейса',       goal:3,  progress:0, reward:80,  rewardGems:0, done:false },
      { emoji:'🌍', name:'Отправить 2 экспедиции',goal:2,  progress:0, reward:100, rewardGems:0, done:false },
      { emoji:'💪', name:'Прокачать стат 3 раза', goal:3,  progress:0, reward:90,  rewardGems:5, done:false },
      { emoji:'🤝', name:'Войти в игру',          goal:1,  progress:1, reward:50,  rewardGems:0, done:false },
      { emoji:'🏆', name:'Достичь 5 побед ELO',   goal:5,  progress:0, reward:200, rewardGems:10, done:false },
    ];
    G.questsDate = new Date().toDateString();
    saveGame();
  }

  const questsHtml = G.quests.map((q,i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:8px;opacity:${q.done?0.6:1}">
      <div style="font-size:22px">${q.emoji}</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600">${q.name}</div>
        <div style="font-size:10px;color:var(--text2)">${q.progress}/${q.goal}</div>
        <div class="progress-bar" style="margin-top:3px"><div class="progress-fill xp" style="width:${Math.min(100,q.progress/q.goal*100)}%"></div></div>
      </div>
      <div style="text-align:right;font-size:11px;min-width:60px">
        <div style="color:var(--gold)">🪙${q.reward}${q.rewardGems?` 💎${q.rewardGems}`:''}</div>
        ${q.done ? '<div style="color:var(--success);font-weight:700;font-size:13px">✓</div>'
          : `<button class="btn btn-xs btn-primary" onclick="claimQuest(${i})" ${q.progress<q.goal?'disabled':''}>Взять</button>`}
      </div>
    </div>
  `).join('');

  document.getElementById('daily-quests').innerHTML = questsHtml + `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding:6px 4px">
      <div style="font-size:11px;color:var(--text3)">Обновляются каждый день</div>
      <button class="btn btn-xs btn-secondary" onclick="refreshQuests()">🔄 Обновить (💎10)</button>
    </div>
  `;

  // World events from WORLD_EVENTS
  const activeEvents = WORLD_EVENTS.filter(e => e.active);
  document.getElementById('world-events').innerHTML = activeEvents.length
    ? activeEvents.map(e => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:6px;border-left:3px solid ${e.color}">
          <span style="font-size:20px">${e.emoji}</span>
          <span style="font-size:12px">${e.text}</span>
        </div>
      `).join('')
    : '<div style="color:var(--text3);font-size:12px;padding:8px">Нет активных событий</div>';
}

function claimQuest(i) {
  const q = G.quests[i];
  if (!q || q.done || q.progress < q.goal) return;
  q.done = true;
  G.coins += q.reward;
  if (q.rewardGems) G.gems += q.rewardGems;
  toast(`🎉 Квест выполнен! +${q.reward}🪙${q.rewardGems?` +${q.rewardGems}💎`:''}`, 'success');
  saveGame(); updateHeader(); renderHome();
}

function refreshQuests() {
  if (G.gems < 10) { toast('Нужно 💎 10', 'error'); return; }
  G.gems -= 10;
  G.quests = [
    { emoji:'⚔️', name:'Победить в 5 боях',    goal:5,  progress:0, reward:150, rewardGems:0, done:false },
    { emoji:'📦', name:'Открыть 3 кейса',       goal:3,  progress:0, reward:80,  rewardGems:0, done:false },
    { emoji:'🌍', name:'Отправить 2 экспедиции',goal:2,  progress:0, reward:100, rewardGems:0, done:false },
    { emoji:'💪', name:'Прокачать стат 3 раза', goal:3,  progress:0, reward:90,  rewardGems:5, done:false },
    { emoji:'🏅', name:'Выиграть рейтинговый бой',goal:1,progress:0, reward:120, rewardGems:5, done:false },
    { emoji:'🏆', name:'Достичь 5 побед ELO',   goal:5,  progress:0, reward:200, rewardGems:10, done:false },
  ];
  toast('🔄 Квесты обновлены!', 'success');
  saveGame(); updateHeader(); renderHome();
}

// ========================
// CASES (CS2-style animation)
// ========================
function renderCases() {
  document.getElementById('cases-grid').innerHTML = CASES_DEF.map(c => `
    <div class="case-card" onclick="openCaseUI('${c.id}')">
      <span class="case-emoji">${c.emoji}</span>
      <div class="case-name">${c.name}</div>
      <div class="case-price">${c.currency==='coins'?'🪙':'💎'} ${c.price}</div>
      <div class="case-odds">${c.desc}</div>
      <button class="btn btn-xs btn-secondary" style="margin-top:6px" onclick="event.stopPropagation();showCaseOdds('${c.id}')">📊 Шансы</button>
    </div>
  `).join('');
  document.getElementById('total-opens').textContent = G.totalOpens;
  document.getElementById('legendary-opens').textContent = G.legendaryOpens;
  document.getElementById('mythic-opens').textContent = G.mythicOpens;
}

function showCaseOdds(caseId) {
  const def = CASES_DEF.find(c => c.id === caseId);
  if (!def) return;
  const rows = Object.entries(def.rarities).filter(([,v])=>v>0).map(([r,pct]) => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg3);border-radius:8px;margin-bottom:5px">
      <div style="width:12px;height:12px;border-radius:50%;background:${getRarityColor(r)}"></div>
      <div style="flex:1;font-size:13px;color:${getRarityColor(r)};font-weight:600">${getRarityName(r)}</div>
      <div style="font-size:13px;font-weight:700">${pct}%</div>
    </div>
  `).join('');
  openModal(`${def.emoji} ${def.name} — Шансы`, rows + `<button class="btn btn-primary btn-full" style="margin-top:12px" onclick="closeModal();openCaseUI('${caseId}')">Открыть кейс</button>`);
}

function openCaseUI(caseId) {
  const def = CASES_DEF.find(c => c.id === caseId);
  if (!def) return;
  const balance = def.currency === 'coins' ? G.coins : G.gems;
  if (balance < def.price) { toast(`Нужно ${def.price} ${def.currency==='coins'?'монет':'💎'}!`, 'error'); return; }

  // Roll outcome
  const rarity = rollRarity(def.rarities);
  const winner = generateHippo(rarity);
  if (caseId === 'mutant' && !winner.mutations.length)
    winner.mutations.push(MUTATIONS[Math.floor(Math.random()*MUTATIONS.length)].id);

  // Build reel: 30 slots, winner at slot 26
  const reelItems = [];
  for (let i = 0; i < 30; i++) {
    const r = i === 26 ? rarity : rollRarity(def.rarities);
    reelItems.push(i === 26 ? winner : generateHippo(r));
  }

  openModal(`${def.emoji} ${def.name}`, `
    <div style="overflow:hidden;border:2px solid var(--border);border-radius:12px;margin-bottom:16px;position:relative">
      <div style="position:absolute;top:0;bottom:0;left:50%;width:3px;background:var(--accent);z-index:2;transform:translateX(-50%)"></div>
      <div style="position:absolute;top:0;bottom:0;left:calc(50% - 60px);right:calc(50% - 60px);border:2px solid var(--accent);border-radius:6px;z-index:2;pointer-events:none"></div>
      <div id="reel-track" style="display:flex;gap:8px;padding:12px 8px;transition:transform 0s;will-change:transform">
        ${reelItems.map((h,i) => `
          <div style="flex-shrink:0;width:100px;text-align:center;background:var(--bg3);border-radius:10px;padding:10px;border:2px solid ${i===26?getRarityColor(h.rarity):'var(--border)'}">
            <div style="font-size:32px">${h.emoji}</div>
            <div style="font-size:10px;font-weight:700;color:${getRarityColor(h.rarity)}">${getRarityName(h.rarity)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div id="reel-result" style="text-align:center;min-height:60px"></div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-primary" style="flex:1" id="spin-btn" onclick="spinReel(${JSON.stringify(winner).replace(/"/g,'&quot;')}, '${def.id}', '${rarity}', false)">🎰 Открыть (5с)</button>
      <button class="btn btn-secondary" style="flex:1" onclick="spinReel(${JSON.stringify(winner).replace(/"/g,'&quot;')}, '${def.id}', '${rarity}', true)">⚡ Быстро (1с)</button>
    </div>
  `);
}

let _spinWinner = null;
function spinReel(winner, caseId, rarity, fast) {
  const def = CASES_DEF.find(c => c.id === caseId);
  if (!def) return;
  if (def.currency === 'coins') { if (G.coins < def.price) { toast('Не хватает монет!','error'); return; } G.coins -= def.price; }
  else { if (G.gems < def.price) { toast('Не хватает кристаллов!','error'); return; } G.gems -= def.price; }

  document.getElementById('spin-btn').disabled = true;
  document.querySelectorAll('#modal-body .btn').forEach(b => b.disabled = true);

  const track = document.getElementById('reel-track');
  const itemW = 108; // 100px + 8px gap
  const centerSlot = 26;
  // Target: center winner at middle of visible area (~50% of 480px modal = 240px)
  const offset = centerSlot * itemW - 240 + 50;
  const duration = fast ? 1000 : 5000;

  // Animate with ease-out
  track.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
  track.style.transform = `translateX(-${offset}px)`;

  updateHeader(); saveGame();

  setTimeout(() => {
    // Add hippo to collection
    G.hippos.push(winner);
    G.totalOpens++;
    if (rarity==='legendary') G.legendaryOpens++;
    if (rarity==='mythic') G.mythicOpens++;
    addXP(15); updateHeader(); saveGame();

    if (G.quests[1]) G.quests[1].progress = Math.min(G.quests[1].goal, (G.quests[1].progress||0)+1);

    const mutHtml = winner.mutations.map(mId => {
      const m = MUTATIONS.find(x=>x.id===mId);
      return m ? `<span title="${m.name}" style="font-size:16px">${m.emoji} ${m.name}</span>` : '';
    }).join(' ');

    document.getElementById('reel-result').innerHTML = `
      <div style="padding:14px;background:rgba(${rarity==='mythic'?'255,0,128':rarity==='legendary'?'255,107,0':'168,85,247'},0.1);border:2px solid ${getRarityColor(rarity)};border-radius:12px">
        <div style="font-size:48px">${winner.emoji}</div>
        <div style="font-family:var(--font-title);font-size:16px;font-weight:900;color:${getRarityColor(rarity)}">${winner.name}</div>
        <div style="font-size:12px;color:${getRarityColor(rarity)};margin:4px 0">✦ ${getRarityName(rarity)} ✦</div>
        ${mutHtml ? `<div style="margin-top:6px;font-size:12px;color:var(--text2)">${mutHtml}</div>` : ''}
        <div style="margin-top:8px;display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          <span class="stat-tag str">💪 ${winner.stats.str}</span>
          <span class="stat-tag agi">⚡ ${winner.stats.agi}</span>
          <span class="stat-tag vit">❤️ ${winner.stats.vit}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-full" style="margin-top:10px" onclick="closeModal();renderCases()">✓ Забрать</button>
    `;
    if (['legendary','mythic'].includes(rarity)) toast(`${rarity==='mythic'?'🌟🌟🌟':'🌟'} ${getRarityName(rarity)}! ${winner.name}!`, 'legendary', 6000);
    else toast(`📦 +${winner.emoji} ${winner.name} (${getRarityName(rarity)})`, 'success');
  }, duration + 100);
}

// ========================
// INVENTORY (fixed IDs to match game.html)
// ========================
let invFilter = 'all';
function renderInventory() {
  renderInventoryGrid();
  renderEquipHippoSelect();
  renderEquipSlotsDisplay();
  renderEquippedStats();
}
function filterInventory(t) { invFilter = t; renderInventory(); }

function renderInventoryGrid() {
  const div = document.getElementById('inventory-grid');
  if (!div) return;
  const items = invFilter === 'all' ? G.inventory : G.inventory.filter(i => i.type === invFilter);
  if (!items.length) {
    div.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:20px;grid-column:1/-1">Инвентарь пуст.<br>Открывай кейсы и побеждай в боях!</div>';
    // Reset upgrade UI
    const selDiv = document.getElementById('selected-upgrade-item');
    if (selDiv) selDiv.innerHTML = '';
    const btn = document.getElementById('upgrade-btn');
    if (btn) btn.disabled = true;
    return;
  }
  div.innerHTML = items.map(item => {
    const realIdx = G.inventory.indexOf(item);
    const isSelected = G.selectedUpgradeItem === realIdx;
    return `
      <div class="inv-item ${isSelected ? 'selected' : ''}" onclick="selectInventoryItem(${realIdx})"
           style="border-color:${getRarityColor(item.rarity||'common')}${isSelected?'':'40'};background:${isSelected?'rgba(124,58,237,0.1)':'var(--bg3)'}">
        <span style="font-size:24px;display:block">${item.emoji}</span>
        <div style="font-size:9px;font-weight:700;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</div>
        ${item.upgradeLevel > 0 ? `<div style="font-size:9px;color:var(--success)">+${item.upgradeLevel}</div>` : ''}
        <div style="font-size:8px;color:${getRarityColor(item.rarity||'common')}">${getRarityName(item.rarity||'common')}</div>
        ${item.equipped_to ? `<div style="font-size:8px;color:var(--accent)">📌</div>` : ''}
      </div>
    `;
  }).join('');

  // Update pity bar
  const pityBar = document.getElementById('upgrade-pity-bar');
  if (pityBar) pityBar.style.width = (G.upgradePity / 10 * 100) + '%';
  const pityVal = document.getElementById('upgrade-pity-val');
  if (pityVal) pityVal.textContent = G.upgradePity;
}

function selectInventoryItem(idx) {
  G.selectedUpgradeItem = idx;
  const item = G.inventory[idx];
  if (!item) return;

  const limit = { common:3, uncommon:5, rare:8, epic:12, legendary:18, mythic:25 }[item.rarity||'common'] || 5;
  const cost = 100 + (item.upgradeLevel||0) * 80;
  const atMax = (item.upgradeLevel||0) >= limit;
  const chanceVal = Math.min(100, Math.floor((0.6 + G.upgradePity * 0.04) * 100));

  const selDiv = document.getElementById('selected-upgrade-item');
  if (selDiv) {
    selDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border:1.5px solid ${getRarityColor(item.rarity||'common')}40;border-radius:10px">
        <span style="font-size:28px">${item.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:12px">${item.name}</div>
          <div style="font-size:10px;color:var(--text2)">+${item.upgradeLevel||0} / +${limit} макс | 🪙${cost}</div>
          <div style="font-size:10px;color:${getRarityColor(item.rarity||'common')}">${Object.entries(item.bonus||{}).map(([k,v])=>`+${v}${item.upgradeLevel?` (+${Math.floor(v*(item.upgradeLevel||0)*0.15)})`:''}  ${k.toUpperCase()}`).join(' · ')}</div>
        </div>
      </div>
      ${!atMax ? '' : `<div style="font-size:10px;color:var(--gold);text-align:center;margin-top:6px">✦ Максимальный уровень</div>`}
    `;
  }
  const chanceEl = document.getElementById('upgrade-chance-val');
  if (chanceEl) chanceEl.textContent = chanceVal + '%';
  const btn = document.getElementById('upgrade-btn');
  if (btn) { btn.disabled = atMax; btn.textContent = atMax ? '✦ Макс' : `⚡ Улучшить (🪙${cost})`; }

  renderInventoryGrid();
  // Also show equip button
  const equipBtn = document.getElementById('equip-item-btn');
  if (equipBtn) equipBtn.style.display = 'block';
}

function upgradeItem() {
  const item = G.inventory[G.selectedUpgradeItem];
  if (!item) return;
  const limit = { common:3, uncommon:5, rare:8, epic:12, legendary:18, mythic:25 }[item.rarity||'common'] || 5;
  if ((item.upgradeLevel||0) >= limit) { toast('Максимальный уровень!', 'error'); return; }
  const cost = 100 + (item.upgradeLevel||0) * 80;
  if (G.coins < cost) { toast(`Нужно 🪙${cost}`, 'error'); return; }
  G.coins -= cost;
  const chance = 0.6 + G.upgradePity * 0.04;
  if (Math.random() < chance) {
    item.upgradeLevel = (item.upgradeLevel||0) + 1;
    G.upgradePity = 0;
    toast(`✅ ${item.emoji} ${item.name} → +${item.upgradeLevel}!`, 'success');
    if (G.quests[3]) G.quests[3].progress = Math.min(G.quests[3].goal, (G.quests[3].progress||0)+1);
  } else {
    G.upgradePity++;
    toast(`❌ Провал (шанс ${Math.round(chance*100)}% | pity: ${G.upgradePity}/10)`, 'error');
  }
  if (G.upgradePity >= 10) {
    item.upgradeLevel = (item.upgradeLevel||0) + 1;
    G.upgradePity = 0;
    toast(`🌟 Гарантия сработала! +${item.upgradeLevel}`, 'legendary');
  }
  saveGame(); updateHeader();
  selectInventoryItem(G.selectedUpgradeItem);
}

function renderEquipHippoSelect() {
  const div = document.getElementById('equip-hippo-select');
  if (!div) return;
  if (!G.hippos.length) { div.innerHTML = '<div style="color:var(--text3);font-size:11px">Нет бегемотов</div>'; return; }
  div.innerHTML = `<div style="font-size:11px;color:var(--text2);margin-bottom:6px">Экипировать на:</div>` +
    G.hippos.map((h,i) => `
      <button class="btn btn-xs ${(G.equippedHippo||0)===i?'btn-primary':'btn-secondary'}" onclick="G.equippedHippo=${i};renderInventory()" style="margin:2px">
        ${h.emoji} ${h.name}
      </button>
    `).join('');
}

function renderEquipSlotsDisplay() {
  const hippo = G.hippos[G.equippedHippo||0];
  const slotDefs = { weapon:{ emoji:'⚔️', label:'Оружие' }, armor:{ emoji:'🛡️', label:'Броня' },
                      accessory:{ emoji:'💍', label:'Аксессуар' }, artifact:{ emoji:'🔮', label:'Артефакт' } };
  for (const [slot, def] of Object.entries(slotDefs)) {
    const el = document.getElementById(`slot-${slot}`);
    if (!el) continue;
    if (!hippo) { el.textContent = 'Нет бегемота'; continue; }
    const itemId = hippo.equipped?.[slot];
    const item = itemId ? G.inventory.find(i=>i.id===itemId)||ALL_ITEMS.find(i=>i.id===itemId) : null;
    if (item) {
      el.innerHTML = `${item.emoji} ${item.name}${item.upgradeLevel?` +${item.upgradeLevel}`:''} <button class="btn btn-xs btn-danger" onclick="unequipSlot('${slot}')" style="margin-left:4px;padding:1px 5px">✕</button>`;
    } else {
      el.textContent = 'Пусто';
    }
  }

  // Equip selected item button
  const equipBtn = document.getElementById('equip-item-btn');
  if (equipBtn && G.selectedUpgradeItem !== null && G.inventory[G.selectedUpgradeItem]) {
    equipBtn.style.display = 'block';
    equipBtn.onclick = () => equipItemToHippo(G.selectedUpgradeItem);
    equipBtn.textContent = `🎯 Надеть на ${hippo?.name||'бегемота'}`;
  } else if (equipBtn) {
    equipBtn.style.display = 'none';
  }
}

function renderEquippedStats() {
  const hippo = G.hippos[G.equippedHippo||0];
  const div = document.getElementById('equipped-stats');
  if (!div || !hippo) return;
  const bonus = getEquipBonus(hippo);
  const hasBonus = Object.values(bonus).some(v => v > 0);
  if (!hasBonus) { div.innerHTML = '<div style="font-size:11px;color:var(--text3)">Нет экипировки</div>'; return; }
  div.innerHTML = Object.entries(bonus).filter(([,v])=>v>0).map(([k,v]) => `
    <div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <span>${{str:'💪 STR',agi:'⚡ AGI',int:'🧠 INT',vit:'❤️ VIT',lck:'🍀 LCK'}[k]||k}</span>
      <span style="color:var(--success);font-weight:700">+${v}</span>
    </div>
  `).join('');
}

function equipItemToHippo(idx) {
  const item = G.inventory[idx];
  const hippo = G.hippos[G.equippedHippo||0];
  if (!item || !hippo) return;
  hippo.equipped = hippo.equipped || {};
  const slot = item.type;
  if (!slot || !['weapon','armor','accessory','artifact'].includes(slot)) { toast('Неизвестный тип предмета', 'error'); return; }
  if (hippo.equipped[slot]) {
    const old = G.inventory.find(i=>i.id===hippo.equipped[slot]);
    if (old) old.equipped_to = null;
  }
  hippo.equipped[slot] = item.id;
  item.equipped_to = hippo.id;
  toast(`✅ ${item.emoji} надет на ${hippo.name}`, 'success');
  saveGame(); renderInventory();
}

function unequipSlot(slot) {
  const hippo = G.hippos[G.equippedHippo||0];
  if (!hippo) return;
  const itemId = hippo.equipped?.[slot];
  if (itemId) {
    const item = G.inventory.find(i=>i.id===itemId);
    if (item) item.equipped_to = null;
  }
  if (hippo.equipped) hippo.equipped[slot] = null;
  saveGame(); renderInventory();
}

function renderInventoryGrid() {
  const div = document.getElementById('inv-items-grid');
  const items = invFilter==='all' ? G.inventory : G.inventory.filter(i=>i.type===invFilter);
  if (!items.length) { div.innerHTML='<div class="empty-state"><span class="empty-icon">🎒</span><div class="empty-text">Пусто</div></div>'; return; }
  div.innerHTML = items.map((item,i) => `
    <div class="inv-item ${G.selectedUpgradeItem===i?'selected':''}" onclick="selectUpgradeItem(${G.inventory.indexOf(item)})" style="border-color:${getRarityColor(item.rarity||'common')}">
      <span style="font-size:22px">${item.emoji}</span>
      <div style="font-size:11px;font-weight:700;margin-top:2px">${item.name}</div>
      ${item.upgradeLevel>0?`<div style="font-size:10px;color:var(--success)">+${item.upgradeLevel}</div>`:''}
      <div style="font-size:9px;color:${getRarityColor(item.rarity||'common')}">${getRarityName(item.rarity||'common')}</div>
      ${item.equipped_to?`<div style="font-size:9px;color:var(--accent)">📌 Надет</div>`:''}
    </div>
  `).join('');
}

function renderEquipHippoSelect() {
  const div = document.getElementById('equip-hippo-select');
  if (!div) return;
  div.innerHTML = G.hippos.map((h,i) => `
    <button class="btn btn-xs ${G.equippedHippo===i?'btn-primary':'btn-secondary'}" onclick="G.equippedHippo=${i};G.activeHippo=${i};renderInventory()" style="margin:3px">${h.emoji} ${h.name}</button>
  `).join('');
}

function renderEquipSlots() {
  const hippo = G.hippos[G.equippedHippo||0];
  if (!hippo) return;
  const slotNames = { weapon:'⚔️ Оружие', armor:'🛡️ Броня', accessory:'💍 Аксессуар', artifact:'🔮 Артефакт' };
  const slotsDiv = document.getElementById('equip-slots');
  if (!slotsDiv) return;
  slotsDiv.innerHTML = Object.entries(slotNames).map(([slot, label]) => {
    const itemId = hippo.equipped?.[slot];
    const item = itemId ? G.inventory.find(i=>i.id===itemId)||ALL_ITEMS.find(i=>i.id===itemId) : null;
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg3);border-radius:10px;margin-bottom:6px">
        <div style="font-size:18px">${label.split(' ')[0]}</div>
        <div style="flex:1">
          <div style="font-size:11px;color:var(--text2)">${label.split(' ').slice(1).join(' ')}</div>
          ${item ? `<div style="font-size:12px;font-weight:600">${item.emoji} ${item.name}${item.upgradeLevel?` +${item.upgradeLevel}`:''}</div>` : '<div style="font-size:11px;color:var(--text3)">Пусто</div>'}
        </div>
        ${item ? `<button class="btn btn-xs btn-danger" onclick="unequipSlot('${slot}')">✕</button>` : ''}
      </div>
    `;
  }).join('');

  // Upgrade section
  const upgradeDiv = document.getElementById('upgrade-section');
  if (!upgradeDiv) return;
  if (G.selectedUpgradeItem !== null && G.inventory[G.selectedUpgradeItem]) {
    const item = G.inventory[G.selectedUpgradeItem];
    const cost = 100 + (item.upgradeLevel||0) * 80;
    const limit = { common:3, uncommon:5, rare:8, epic:12, legendary:18, mythic:25 }[item.rarity||'common'] || 5;
    upgradeDiv.innerHTML = `
      <div class="card-title" style="font-size:12px">⬆️ Улучшение</div>
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:10px">
        <span style="font-size:24px">${item.emoji}</span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700">${item.name} +${item.upgradeLevel||0}</div>
          <div style="font-size:10px;color:var(--text2)">Макс. уровень: +${limit} | Стоимость: 🪙${cost}</div>
        </div>
      </div>
      ${(item.upgradeLevel||0) < limit
        ? `<button class="btn btn-primary btn-full" onclick="upgradeItem()">⬆️ Улучшить (🪙${cost})</button>`
        : `<div style="color:var(--gold);text-align:center;font-size:12px">✦ Максимальный уровень</div>`}
      <button class="btn btn-secondary btn-full" style="margin-top:6px" onclick="equipItemToHippo(${G.selectedUpgradeItem})">🎯 Надеть на бегемота</button>
    `;
  } else {
    upgradeDiv.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:12px">Выбери предмет слева</div>';
  }
}

function selectUpgradeItem(idx) { G.selectedUpgradeItem = idx; renderEquipSlots(); }

function upgradeItem() {
  const item = G.inventory[G.selectedUpgradeItem];
  if (!item) return;
  const cost = 100 + (item.upgradeLevel||0) * 80;
  const limit = { common:3, uncommon:5, rare:8, epic:12, legendary:18, mythic:25 }[item.rarity||'common'] || 5;
  if ((item.upgradeLevel||0) >= limit) { toast('Максимальный уровень!', 'error'); return; }
  if (G.coins < cost) { toast(`Нужно 🪙${cost}`, 'error'); return; }
  G.coins -= cost;
  const success = Math.random() < 0.6 + G.upgradePity * 0.04;
  if (success) {
    item.upgradeLevel = (item.upgradeLevel||0) + 1;
    G.upgradePity = 0;
    toast(`✅ ${item.name} → +${item.upgradeLevel}!`, 'success');
    if (G.quests[3]) G.quests[3].progress = Math.min(G.quests[3].goal, (G.quests[3].progress||0)+1);
  } else {
    G.upgradePity++;
    toast(`❌ Улучшение провалилось (pity: ${G.upgradePity}/10)`, 'error');
  }
  if (G.upgradePity >= 10) { item.upgradeLevel = (item.upgradeLevel||0)+1; G.upgradePity=0; toast(`🌟 Гарантия! +${item.upgradeLevel}`, 'legendary'); }
  saveGame(); updateHeader(); renderInventory();
}

function equipItemToHippo(idx) {
  const item = G.inventory[idx];
  const hippo = G.hippos[G.equippedHippo||0];
  if (!item || !hippo) return;
  hippo.equipped = hippo.equipped || {};
  const slot = item.type;
  if (hippo.equipped[slot]) {
    const old = G.inventory.find(i=>i.id===hippo.equipped[slot]);
    if (old) old.equipped_to = null;
  }
  hippo.equipped[slot] = item.id;
  item.equipped_to = hippo.id;
  toast(`✅ ${item.emoji} надет на ${hippo.name}`, 'success');
  saveGame(); renderInventory();
}

function unequipSlot(slot) {
  const hippo = G.hippos[G.equippedHippo||0];
  if (!hippo) return;
  const itemId = hippo.equipped?.[slot];
  if (itemId) {
    const item = G.inventory.find(i=>i.id===itemId);
    if (item) item.equipped_to = null;
  }
  hippo.equipped[slot] = null;
  saveGame(); renderInventory();
}

// ========================
// HIPPOS (compact view)
// ========================
function renderHippos() {
  const grid = document.getElementById('hippos-grid');
  if (!grid) return;
  if (!G.hippos.length) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-icon">🦛</span><div class="empty-text">Нет бегемотов</div><button class="btn btn-primary btn-sm" onclick="setTabByName('cases')" style="margin-top:10px">📦 Кейсы</button></div>`;
    return;
  }

  // Sort: pinned first, then by rarity
  const rarityOrder = { mythic:0, legendary:1, epic:2, rare:3, uncommon:4, common:5 };
  const sorted = [...G.hippos].map((h,i)=>({...h,_idx:i})).sort((a,b) => {
    const ap = G.pinnedHippos.includes(a.id) ? -1 : 0;
    const bp = G.pinnedHippos.includes(b.id) ? -1 : 0;
    if (ap !== bp) return ap - bp;
    return (rarityOrder[a.rarity]||5) - (rarityOrder[b.rarity]||5);
  });

  const activeIdx = G.activeHippo || 0;
  grid.innerHTML = sorted.map(h => {
    const inExp = isHippoInExpedition(h);
    const isPinned = G.pinnedHippos.includes(h.id);
    const isProtected = G.protectedHippos.includes(h.id);
    const isActive = G.hippos[activeIdx]?.id === h.id;
    return `
      <div class="hippo-card-compact rarity-${h.rarity} ${selectedHippo===h._idx?'selected':''}"
           onclick="showHippoDetail(${h._idx})"
           style="border-color:${getRarityColor(h.rarity)}40;position:relative">
        ${isPinned ? '<div style="position:absolute;top:3px;left:3px;font-size:10px">📌</div>' : ''}
        ${isActive ? '<div style="position:absolute;top:3px;right:3px;background:var(--success);color:#fff;font-size:8px;font-weight:700;padding:1px 4px;border-radius:8px">⚔️</div>' : ''}
        ${inExp ? '<div style="position:absolute;bottom:3px;right:3px;font-size:8px;background:var(--accent);color:#fff;padding:1px 4px;border-radius:6px">🧭</div>' : ''}
        ${isProtected ? '<div style="position:absolute;bottom:3px;left:3px;font-size:8px">🔒</div>' : ''}
        <span style="font-size:28px;display:block">${h.emoji}</span>
        <div style="font-size:10px;font-weight:700;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h.name}</div>
        <div style="font-size:9px;color:${getRarityColor(h.rarity)}">${getRarityName(h.rarity)}</div>
        <div style="font-size:9px;color:var(--text2)">Ур.${h.level} HP:${getHippoHP(h)}</div>
        <div style="font-size:11px;margin-top:2px">${(h.mutations||[]).map(mId=>{const m=MUTATIONS.find(x=>x.id===mId);return m?m.emoji:''}).join('')}</div>
        ${h.inValhalla ? '<div style="font-size:9px;color:#ff6600;font-weight:700">💀 Вальхалла</div>' : ''}
      </div>
    `;
  }).join('');

  // Sell all button
  const sellBtn = document.getElementById('sell-all-btn');
  if (sellBtn) {
    const sellable = G.hippos.filter(h => !G.protectedHippos.includes(h.id) && !G.pinnedHippos.includes(h.id) && !isHippoInExpedition(h) && G.hippos[G.activeHippo||0]?.id !== h.id);
    sellBtn.textContent = `🗑️ Продать всех незащищённых (${sellable.length})`;
    sellBtn.disabled = sellable.length === 0;
  }
}

function showHippoDetail(idx) {
  selectedHippo = idx;
  const h = G.hippos[idx];
  if (!h) return;
  const panel = document.getElementById('hippo-detail-panel');
  const inExp = isHippoInExpedition(h);
  const isPinned = G.pinnedHippos.includes(h.id);
  const isProtected = G.protectedHippos.includes(h.id);
  const limit = RARITY_UPGRADE_LIMITS[h.rarity] || 5;
  const upgCost = 100 + (h.level||1) * 20;

  panel.innerHTML = `
    <div class="card">
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:52px">${h.emoji}</div>
        <div style="font-family:var(--font-title);font-size:14px;font-weight:700;margin:4px 0">${h.name}</div>
        <div style="color:${getRarityColor(h.rarity)};font-weight:700;font-size:11px">✦ ${getRarityName(h.rarity)} ✦</div>
        <div style="font-size:10px;color:var(--text2);margin-top:2px">Ур.${h.level} | 💀 ${h.deaths}/20 | ${h.wins}W/${h.losses}L</div>
        ${inExp ? `<div style="color:var(--accent);font-size:11px;margin-top:3px">🧭 В экспедиции</div>` : ''}
        ${h.inValhalla ? `<div style="color:#ff6600;font-size:11px;font-weight:700">💀 Вальхалла</div>` : ''}
      </div>

      <div class="card-title" style="font-size:11px">📊 Характеристики (лимит апгрейда: ${limit})</div>
      ${Object.entries(h.stats).map(([k,v])=>`
        <div class="stat-mini"><span>${{str:'💪',agi:'⚡',int:'🧠',vit:'❤️',lck:'🍀'}[k]} ${k.toUpperCase()}</span><span style="font-weight:700">${v}</span></div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width:${Math.min(100,v/50*100)}%;background:${{str:'#f87171',agi:'#60d4f8',int:'#a855f7',vit:'#10b981',lck:'#f59e0b'}[k]}"></div></div>
      `).join('')}

      ${(h.upgradeCount||0) < limit && !inExp ? `
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin:8px 0">
          ${Object.keys(h.stats).map(k=>`<button class="btn btn-xs btn-secondary" onclick="upgradeHippoStat(${idx},'${k}')">+${k.toUpperCase()} 🪙${upgCost}</button>`).join('')}
        </div>
      ` : `<div style="font-size:10px;color:var(--text3);margin:6px 0">${(h.upgradeCount||0)>=limit?'✦ Лимит апгрейда достигнут':'🧭 В экспедиции'}</div>`}

      <div class="divider"></div>
      <div class="card-title" style="font-size:11px">🧬 Мутации (${(h.mutations||[]).length}/3)</div>
      ${(h.mutations||[]).length ? (h.mutations||[]).map(mId=>{
        const m=MUTATIONS.find(x=>x.id===mId);
        return m?`<div style="display:flex;align-items:center;gap:8px;padding:5px;background:var(--bg3);border-radius:7px;font-size:10px;margin-bottom:3px">${m.emoji}<div><strong>${m.name}</strong><div style="color:var(--text2)">${m.desc}</div></div></div>`:'';
      }).join('') : '<div style="font-size:11px;color:var(--text3)">Нет мутаций</div>'}
      ${(h.mutations||[]).length < 3 && !inExp ? `<button class="btn btn-xs btn-purple" onclick="tryMutation(${idx})" style="margin-top:6px">🧬 Мутация (💎50)</button>` : ''}

      <div class="divider"></div>
      <div class="card-title" style="font-size:11px">⚡ Способности (${(h.abilities||[]).length}/2)</div>
      ${(h.abilities||[]).length ? (h.abilities||[]).map((abId,ai) => {
        const ab = ABILITIES.find(x=>x.id===abId);
        return ab ? `
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:var(--bg3);border-radius:8px;margin-bottom:4px;font-size:11px">
            <span style="font-size:18px">${ab.emoji}</span>
            <div style="flex:1">
              <div style="font-weight:700">${ab.name}</div>
              <div style="font-size:10px;color:var(--text2)">${ab.desc}</div>
              <div style="font-size:9px;color:${getRarityColor(ab.rarity)}">${getRarityName(ab.rarity)}</div>
            </div>
            <button class="btn btn-xs btn-danger" onclick="removeAbility(${idx},${ai})">✕</button>
          </div>` : '';
      }).join('') : '<div style="font-size:11px;color:var(--text3)">Нет способностей</div>'}
      ${(h.abilities||[]).length < 2 && !inExp ? `
        <button class="btn btn-xs btn-gold" onclick="openAbilityShop(${idx})" style="margin-top:5px">✨ Купить способность</button>` : ''}

      <div class="divider"></div>
        ${!inExp && !h.inValhalla ? `<button class="btn btn-sm btn-primary" onclick="selectAsFighter(${idx})">⚔️ Боец</button>` : ''}
        ${!inExp ? `<button class="btn btn-sm btn-secondary" onclick="pickExpeditionRegion(${idx})">🧭 Экспедиция</button>` : ''}
        <button class="btn btn-sm ${isPinned?'btn-gold':'btn-secondary'}" onclick="togglePin(${idx})">${isPinned?'📌 Откреп.':'📌 Закрепить'}</button>
        <button class="btn btn-sm ${isProtected?'btn-success':'btn-secondary'}" onclick="toggleProtect(${idx})">${isProtected?'🔒 Снять':'🔒 Защита'}</button>
        ${!isProtected && !isPinned && !inExp ? `<button class="btn btn-sm btn-danger" onclick="releaseHippo(${idx})">🗑️ Продать</button>` : ''}
      </div>
    </div>
  `;
  renderHippos();
}

function upgradeHippoStat(hippoIdx, stat) {
  const h = G.hippos[hippoIdx];
  if (!h) return;
  const limit = RARITY_UPGRADE_LIMITS[h.rarity] || 5;
  if ((h.upgradeCount||0) >= limit) { toast(`Лимит апгрейда: ${limit} для ${getRarityName(h.rarity)}`, 'error'); return; }
  const cost = 100 + (h.level||1) * 20;
  if (G.coins < cost) { toast(`Нужно 🪙${cost}`, 'error'); return; }
  G.coins -= cost; h.stats[stat]++;
  h.upgradeCount = (h.upgradeCount||0) + 1;
  addXP(5); saveGame();
  toast(`✅ ${stat.toUpperCase()} → ${h.stats[stat]} (${h.upgradeCount}/${limit})`, 'success');
  if (G.quests[3]) G.quests[3].progress = Math.min(G.quests[3].goal, (G.quests[3].progress||0)+1);
  showHippoDetail(hippoIdx);
}

function tryMutation(hippoIdx) {
  const h = G.hippos[hippoIdx];
  if (!h) return;
  if (G.gems < 50) { toast('Нужно 💎 50', 'error'); return; }
  // Check event bonus
  const mutEvent = WORLD_EVENTS.find(e=>e.active && e.bonus==='mutation_cost');
  const cost = mutEvent ? Math.floor(50 * mutEvent.value) : 50;
  if (G.gems < cost) { toast(`Нужно 💎 ${cost}`, 'error'); return; }
  G.gems -= cost;
  if (Math.random() < 0.45) {
    const available = MUTATIONS.filter(m=>!(h.mutations||[]).includes(m.id));
    if (!available.length) { toast('Все мутации есть!', 'success'); return; }
    const mut = available[Math.floor(Math.random()*available.length)];
    h.mutations = [...(h.mutations||[]), mut.id];
    toast(`🧬 ${mut.emoji} ${mut.name}!`, 'legendary');
  } else { toast('🧬 Не прошла...', 'error'); }
  saveGame(); updateHeader(); showHippoDetail(hippoIdx);
}

function releaseHippo(idx) {
  if (!confirm('Продать бегемота?')) return;
  const h = G.hippos.splice(idx, 1)[0];
  const coins = { common:50, uncommon:120, rare:300, epic:700, legendary:1500, mythic:6000 }[h.rarity] || 50;
  G.coins += coins;
  toast(`🗑️ ${h.name} продан за 🪙${coins}`, 'success');
  saveGame(); selectedHippo = null; renderHippos();
  document.getElementById('hippo-detail-panel').innerHTML = '<div class="empty-state"><span class="empty-icon">🦛</span><div class="empty-text">Выберите бегемота</div></div>';
  // Adjust active hippo index
  if (G.activeHippo >= G.hippos.length) G.activeHippo = Math.max(0, G.hippos.length-1);
}

function sellAllHippos() {
  const sellable = G.hippos.filter(h =>
    !G.protectedHippos.includes(h.id) &&
    !G.pinnedHippos.includes(h.id) &&
    !isHippoInExpedition(h) &&
    G.hippos[G.activeHippo||0]?.id !== h.id
  );
  if (!sellable.length) { toast('Нет бегемотов для продажи', 'error'); return; }
  const total = sellable.reduce((sum,h) => sum + ({common:50,uncommon:120,rare:300,epic:700,legendary:1500,mythic:6000}[h.rarity]||50), 0);
  if (!confirm(`Продать ${sellable.length} бегемотов за 🪙${total}? Закреплённые, защищённые и активный боец сохранятся.`)) return;
  const sellIds = new Set(sellable.map(h=>h.id));
  G.hippos = G.hippos.filter(h => !sellIds.has(h.id));
  G.coins += total;
  if (G.activeHippo >= G.hippos.length) G.activeHippo = 0;
  toast(`🗑️ Продано ${sellable.length} бегемотов за 🪙${total}`, 'success');
  saveGame(); updateHeader(); renderHippos();
  document.getElementById('hippo-detail-panel').innerHTML = '<div class="empty-state"><span class="empty-icon">🦛</span><div class="empty-text">Выберите бегемота</div></div>';
}

function togglePin(idx) {
  const h = G.hippos[idx];
  if (!h) return;
  if (G.pinnedHippos.includes(h.id)) {
    G.pinnedHippos = G.pinnedHippos.filter(id=>id!==h.id);
    toast('📌 Откреплён', 'success');
  } else {
    G.pinnedHippos.push(h.id);
    toast('📌 Закреплён', 'success');
  }
  saveGame(); showHippoDetail(idx);
}

function toggleProtect(idx) {
  const h = G.hippos[idx];
  if (!h) return;
  if (G.protectedHippos.includes(h.id)) {
    G.protectedHippos = G.protectedHippos.filter(id=>id!==h.id);
    toast('🔓 Защита снята');
  } else {
    G.protectedHippos.push(h.id);
    toast('🔒 Защищён от продажи', 'success');
  }
  saveGame(); showHippoDetail(idx);
}

function removeAbility(hippoIdx, abilityIdx) {
  const h = G.hippos[hippoIdx];
  if (!h) return;
  const ab = ABILITIES.find(x=>x.id===h.abilities[abilityIdx]);
  if (!confirm(`Убрать способность ${ab?.name||''}?`)) return;
  h.abilities.splice(abilityIdx, 1);
  saveGame(); showHippoDetail(hippoIdx);
  toast('✕ Способность убрана', 'success');
}

function openAbilityShop(hippoIdx) {
  const h = G.hippos[hippoIdx];
  if (!h) return;
  const equipped = h.abilities || [];
  const available = ABILITIES.filter(ab => !equipped.includes(ab.id));
  const rarityPrices = { uncommon:200, rare:500, epic:1200, legendary:3000, mythic:8000 };
  openModal('✨ Способности', `
    <div style="font-size:12px;color:var(--text2);margin-bottom:12px">Купи активную способность для бегемота. Используется 1 раз за бой!</div>
    <div style="max-height:400px;overflow-y:auto">
      ${available.map(ab => {
        const price = rarityPrices[ab.rarity] || 500;
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border:1px solid ${getRarityColor(ab.rarity)}40;border-radius:10px;margin-bottom:6px">
            <span style="font-size:28px">${ab.emoji}</span>
            <div style="flex:1">
              <div style="font-weight:700;font-size:12px">${ab.name}</div>
              <div style="font-size:10px;color:var(--text2)">${ab.desc}</div>
              <div style="font-size:9px;color:${getRarityColor(ab.rarity)}">${getRarityName(ab.rarity)}</div>
            </div>
            <button class="btn btn-xs btn-primary" onclick="buyAbility('${ab.id}',${hippoIdx},${price})">🪙${price}</button>
          </div>
        `;
      }).join('')}
    </div>
  `);
}

function buyAbility(abilId, hippoIdx, price) {
  const h = G.hippos[hippoIdx];
  if (!h) return;
  if ((h.abilities||[]).length >= 2) { toast('Максимум 2 способности!', 'error'); return; }
  if (G.coins < price) { toast(`Нужно 🪙${price}`, 'error'); return; }
  G.coins -= price;
  h.abilities = [...(h.abilities||[]), abilId];
  const ab = ABILITIES.find(x=>x.id===abilId);
  toast(`✨ ${ab?.emoji||''} ${ab?.name} изучена!`, 'legendary', 4000);
  closeModal(); saveGame(); updateHeader(); showHippoDetail(hippoIdx);
}

function selectAsFighter(idx) {
  const h = G.hippos[idx];
  if (!h) return;
  if (h.inValhalla) { toast('💀 Этот бегемот в Вальхалле!', 'error'); return; }
  if (isHippoInExpedition(h)) { toast('🧭 Бегемот в экспедиции!', 'error'); return; }
  G.activeHippo = idx; G.equippedHippo = idx;
  saveGame();
  toast(`⚔️ ${h.emoji} ${h.name} — активный боец!`, 'success');
  renderHippos(); showHippoDetail(idx);
}

// ========================
// WORLD & EXPEDITIONS
// ========================
function renderWorld() {
  document.getElementById('world-map-grid').innerHTML = G.regions.map(r => {
    const locked = G.level < r.level;
    const activeExp = G.expeditions.find(e => !e.claimed && e.regionId === r.id && Date.now() < e.endTime);
    return `
      <div class="map-region ${locked?'locked':''} ${r.pvp?'pvp-zone':''}" onclick="${locked?`toast('Нужен уровень ${r.level}!','error')`:`openRegion('${r.id}')`}">
        ${r.king ? `<div class="region-king">👑 ${r.king}</div>` : ''}
        <div class="region-level">Ур.${r.level}</div>
        <span class="region-icon">${r.emoji}</span>
        <div class="region-name">${r.name}</div>
        <div class="region-desc">${r.desc}</div>
        ${activeExp ? `<div style="font-size:9px;color:var(--accent);margin-top:3px">🧭 ${activeExp.hippoEmoji} в пути...</div>` : ''}
        ${r.pvp ? '<div style="margin-top:3px"><span class="tag tag-pvp">⚔️ PvP</span></div>' : ''}
        ${locked ? '<div style="font-size:10px;color:var(--danger);margin-top:2px">🔒</div>' : ''}
      </div>
    `;
  }).join('');
  renderExpeditions();
}

function openRegion(regionId) {
  const r = G.regions.find(r=>r.id===regionId);
  if (!r) return;
  if (G.level < r.level) { toast(`Нужен уровень ${r.level}!`, 'error'); return; }

  // Available hippos (not in expedition, not in Valhalla)
  const available = G.hippos.filter(h => !isHippoInExpedition(h) && !h.inValhalla);

  openModal(`${r.emoji} ${r.name}`, `
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:44px">${r.emoji}</div>
      <div style="font-size:12px;color:var(--text2);margin:6px 0">${r.desc}</div>
      ${r.pvp ? '<div style="color:var(--danger);font-size:11px">⚠️ PvP зона</div>' : ''}
      ${r.king ? `<div style="font-size:11px">👑 Король: <strong style="color:var(--gold)">${r.king}</strong></div>` : ''}
    </div>

    <div style="margin-bottom:14px">
      <div class="card-title" style="font-size:11px">🦛 Выбери бегемота для экспедиции:</div>
      ${available.length ? `
        <div id="exp-hippo-select" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin:8px 0">
          ${available.map(h => `
            <div onclick="selectExpHippo('${h.id}')" id="exphippo-${h.id}"
              style="cursor:pointer;text-align:center;padding:8px;background:var(--bg3);border-radius:10px;border:2px solid var(--border);transition:border-color .2s"
              onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size:28px">${h.emoji}</div>
              <div style="font-size:10px;font-weight:600">${h.name}</div>
              <div style="font-size:9px;color:${getRarityColor(h.rarity)}">${getRarityName(h.rarity)}</div>
            </div>
          `).join('')}
        </div>
      ` : '<div style="color:var(--text3);font-size:12px;padding:8px">Нет доступных бегемотов</div>'}
      <div id="selected-exp-hippo" style="margin-top:6px;font-size:12px;color:var(--accent)">Выбери бегемота ↑</div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-primary btn-full" onclick="sendExpeditionToRegion('${regionId}', false)">🧭 Экспедиция (30 мин)</button>
      <button class="btn btn-secondary btn-full" onclick="sendExpeditionToRegion('${regionId}', true)">⚡ Мгновенно (💎20)</button>
      ${r.pvp ? `<button class="btn btn-danger btn-full" onclick="closeModal();startArena('casual')">⚔️ PvP бой</button>` : ''}
      ${!r.king ? `<button class="btn btn-gold btn-full" onclick="claimKingdom('${regionId}')">👑 Стать королём (💎100)</button>` : ''}
    </div>
  `);

  window._selectedExpHippoId = null;
}

function selectExpHippo(hippoId) {
  window._selectedExpHippoId = hippoId;
  document.querySelectorAll('[id^="exphippo-"]').forEach(el => {
    el.style.borderColor = el.id === `exphippo-${hippoId}` ? 'var(--accent)' : 'var(--border)';
    el.style.background = el.id === `exphippo-${hippoId}` ? 'rgba(124,58,237,0.15)' : 'var(--bg3)';
  });
  const h = G.hippos.find(x=>x.id===hippoId);
  const el = document.getElementById('selected-exp-hippo');
  if (el && h) el.textContent = `✅ Выбран: ${h.emoji} ${h.name}`;
}

function sendExpeditionToRegion(regionId, instant=false) {
  const hippoId = window._selectedExpHippoId;
  if (!hippoId) { toast('Выбери бегемота!', 'error'); return; }
  const h = G.hippos.find(x=>x.id===hippoId);
  if (!h) { toast('Бегемот не найден', 'error'); return; }
  if (isHippoInExpedition(h)) { toast(`${h.name} уже в экспедиции!`, 'error'); return; }
  if (instant && G.gems < 20) { toast('Нужно 💎 20', 'error'); return; }
  if (instant) G.gems -= 20;
  const r = G.regions.find(r=>r.id===regionId);
  const endTime = Date.now() + (instant ? 1000 : 30*60*1000);
  G.expeditions.push({
    id: 'exp_'+Date.now(), hippoId: h.id,
    hippoName: h.name, hippoEmoji: h.emoji,
    regionId, regionName: r?.name||regionId, regionEmoji: r?.emoji||'🗺️',
    endTime, claimed: false
  });
  closeModal();
  toast(`🧭 ${h.name} отправлен в ${r?.name||regionId}!`, 'success');
  if (G.quests[2]) G.quests[2].progress = Math.min(G.quests[2].goal, (G.quests[2].progress||0)+1);
  saveGame(); renderWorld();
}

function claimExpedition(idx) {
  const exp = G.expeditions[idx];
  if (!exp || exp.claimed) return;
  if (Date.now() < exp.endTime) { toast('Ещё не готово!', 'error'); return; }
  exp.claimed = true;
  const lootEvent = WORLD_EVENTS.find(e=>e.active&&e.bonus==='expedition_loot');
  const mult = lootEvent ? lootEvent.value : 1;
  const coins = Math.floor((80 + Math.floor(Math.random()*200)) * mult);
  G.coins += coins; addXP(40);
  let msg = `🎁 +${coins}🪙`;
  if (Math.random() < 0.4) {
    const item = { ...ALL_ITEMS[Math.floor(Math.random()*ALL_ITEMS.length)], id:'inv_'+Date.now(), upgradeLevel:0 };
    G.inventory.push(item);
    msg += ` + ${item.emoji} ${item.name}`;
  }
  toast(msg, 'success');
  saveGame(); updateHeader(); renderWorld();
}

function renderExpeditions() {
  const active = G.expeditions.filter(e => !e.claimed);
  const div = document.getElementById('active-expeditions');
  if (!div) return;
  if (!active.length) { div.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px">Нет активных экспедиций</div>'; return; }
  div.innerHTML = active.map((exp,i)=>{
    const remaining = exp.endTime - Date.now();
    const ready = remaining <= 0;
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:6px">
        <span style="font-size:24px">${exp.hippoEmoji}</span>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600">${exp.hippoName} → ${exp.regionEmoji} ${exp.regionName}</div>
          <div style="font-size:10px;color:${ready?'var(--success)':'var(--text2)'}">
            ${ready ? '✅ Готово!' : `⏰ ${fmtTime(remaining)}`}
          </div>
        </div>
        ${ready ? `<button class="btn btn-xs btn-success" onclick="claimExpedition(${G.expeditions.indexOf(exp)})">Забрать!</button>` : ''}
      </div>
    `;
  }).join('');
}

function pickExpeditionRegion(hippoIdx) {
  const h = G.hippos[hippoIdx];
  if (!h) return;
  const available = G.regions.filter(r => G.level >= r.level);
  openModal(`🧭 Куда отправить ${h.name}?`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${available.map(r => `
        <button class="btn btn-secondary" style="text-align:left;padding:10px" onclick="closeModal();window._selectedExpHippoId='${h.id}';sendExpeditionToRegion('${r.id}',false)">
          ${r.emoji} ${r.name}<br><span style="font-size:10px;color:var(--text2)">${r.desc}</span>
        </button>
      `).join('')}
    </div>
  `);
}

function claimKingdom(regionId) {
  if (G.gems < 100) { toast('Нужно 💎 100', 'error'); return; }
  G.gems -= 100;
  const r = G.regions.find(r=>r.id===regionId);
  if (r) r.king = G.playerName;
  toast(`👑 Ты король ${r?.name}!`, 'legendary'); closeModal();
  saveGame(); renderWorld();
}

// ========================
// CLANS (reworked)
// ========================
function renderClans() {
  const div = document.getElementById('tab-clans');
  if (!div) return;
  div.innerHTML = `
    <div class="section-title">🏰 Кланы</div>
    <div class="grid-2">
      <div>
        <div class="card" id="my-clan-card">
          <div class="card-title">👥 Мой клан</div>
          <div id="my-clan-content"><div style="color:var(--text3);font-size:12px">Загрузка...</div></div>
        </div>
        <div class="card" style="margin-top:12px">
          <div class="card-title">⚔️ Война кланов</div>
          <div id="clan-war-content"><div style="color:var(--text3);font-size:12px">Загрузка...</div></div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-title">🏰 Все кланы</div>
          <div id="clans-list"><div style="color:var(--text3);font-size:12px">Загрузка...</div></div>
        </div>
      </div>
    </div>
  `;
  loadClans();
}

async function loadClans() {
  // My clan
  const myDiv = document.getElementById('my-clan-content');
  if (G.clan) {
    myDiv.innerHTML = `
      <div style="text-align:center;padding:10px">
        <div style="font-size:40px">${G.clan.emoji}</div>
        <div style="font-family:var(--font-title);font-size:14px;font-weight:700;margin:4px 0">${G.clan.name}</div>
        <div style="font-size:11px;color:var(--text2)">Лидер: ${G.clan.leader}</div>
        <div style="font-size:11px;color:var(--text2)">⚡ Мощь: ${(G.clan.power||0).toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:8px">
        <button class="btn btn-sm btn-primary" onclick="attackClanWar()">⚔️ Атаковать</button>
        <button class="btn btn-sm btn-secondary" onclick="inviteFriendToClan()">👥 Пригласить друга</button>
        <button class="btn btn-sm btn-danger" onclick="leaveClan()">🚪 Выйти</button>
      </div>
    `;
  } else {
    myDiv.innerHTML = `
      <div style="text-align:center;padding:12px;color:var(--text3);font-size:12px">Ты не в клане</div>
      <button class="btn btn-primary btn-full" onclick="createClan()">➕ Создать клан (💎50)</button>
    `;
  }

  // Clans list
  const listDiv = document.getElementById('clans-list');
  let clans = [];
  try {
    const res = await fetch('/api/clans', { headers: G.token ? {'Authorization':'Bearer '+G.token} : {} });
    if (res.ok) clans = await res.json();
  } catch {}
  if (!clans.length) clans = DEMO_CLANS.map(c => ({ ...c, member_count: c.members }));
  listDiv.innerHTML = clans.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:8px">
      <span style="font-size:28px">${c.emoji}</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px">${c.name}</div>
        <div style="font-size:10px;color:var(--text2)">👥 ${c.member_count||0} | ⚡ ${(c.power||0).toLocaleString()}</div>
      </div>
      ${!G.clan ? `<button class="btn btn-xs btn-primary" onclick="joinClan('${c.id}','${c.name}','${c.emoji}','${c.leader||c.leader_id||''}')">Вступить</button>` : ''}
    </div>
  `).join('');

  // Clan war
  const warDiv = document.getElementById('clan-war-content');
  if (G.clan) {
    const opponents = (clans.length ? clans : DEMO_CLANS).filter(c => c.name !== G.clan.name).slice(0, 3);
    warDiv.innerHTML = opponents.map(c => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg3);border-radius:8px;margin-bottom:6px">
        <span style="font-size:20px">${c.emoji}</span>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600">${c.name}</div>
          <div style="font-size:10px;color:var(--text2)">⚡ ${(c.power||0).toLocaleString()}</div>
        </div>
        <button class="btn btn-xs btn-danger" onclick="attackClan('${c.name}',${c.power||1000})">⚔️</button>
      </div>
    `).join('') || '<div style="font-size:11px;color:var(--text3);padding:6px">Нет противников</div>';
  } else {
    warDiv.innerHTML = '<div style="font-size:11px;color:var(--text3);padding:6px">Вступи в клан чтобы воевать</div>';
  }
}

function createClan() {
  openModal('➕ Создать клан', `
    <input id="clan-name-input" class="input" placeholder="Название клана" style="margin-bottom:8px">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="clan-emoji-row">
      ${['🐺','⚔️','🔥','🏔️','🌊','🦅','🌑','💀','🌪️','🏰'].map(e=>`
        <button style="font-size:20px;background:var(--bg3);border:2px solid var(--border);border-radius:8px;padding:4px 8px;cursor:pointer"
          onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--accent)';document.getElementById('clan-emoji-selected').value='${e}'">${e}</button>
      `).join('')}
    </div>
    <input type="hidden" id="clan-emoji-selected" value="🏰">
    <div style="font-size:12px;color:var(--text2);margin-bottom:12px">Стоимость: 💎 50</div>
    <button class="btn btn-primary btn-full" onclick="confirmCreateClan()">✅ Создать</button>
  `);
}

async function confirmCreateClan() {
  const name = document.getElementById('clan-name-input')?.value?.trim();
  const emoji = document.getElementById('clan-emoji-selected')?.value || '🏰';
  if (!name || name.length < 2) { toast('Слишком короткое название', 'error'); return; }
  if (G.gems < 50) { toast('Нужно 💎 50', 'error'); return; }
  if (G.token) {
    try {
      const res = await fetch('/api/clans/create', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+G.token},
        body: JSON.stringify({ name, emoji })
      });
      const d = await res.json();
      if (!d.success && !d.id) { toast(d.error||'Ошибка', 'error'); return; }
    } catch {}
  }
  G.gems -= 50;
  G.clan = { id:'c_'+Date.now(), name, emoji, leader: G.playerName, power: G.elo * 10, members: 1 };
  closeModal(); saveGame(); updateHeader();
  toast(`🏰 Клан "${name}" создан!`, 'success');
  renderClans();
}

async function joinClan(id, name, emoji, leader) {
  if (G.clan) { toast('Сначала выйди из текущего клана', 'error'); return; }
  if (G.token) {
    try {
      await fetch(`/api/clans/${id}/join`, { method:'POST', headers:{'Authorization':'Bearer '+G.token} });
    } catch {}
  }
  G.clan = { id, name, emoji, leader, power: 5000, members: 1 };
  saveGame(); toast(`🏰 Ты вступил в "${name}"!`, 'success');
  renderClans();
}

async function leaveClan() {
  if (!confirm('Покинуть клан?')) return;
  if (G.token && G.clan) {
    try { await fetch(`/api/clans/${G.clan.id}/leave`, { method:'POST', headers:{'Authorization':'Bearer '+G.token} }); } catch {}
  }
  G.clan = null; saveGame(); toast('🚪 Вышел из клана');
  renderClans();
}

function attackClan(targetName, targetPower) {
  if (!G.clan) { toast('Ты не в клане!', 'error'); return; }
  const myPower = G.clan.power || G.elo * 10;
  const winChance = Math.min(0.8, Math.max(0.2, myPower / (myPower + targetPower)));
  const won = Math.random() < winChance;
  if (won) {
    const powerGain = Math.floor(targetPower * 0.1);
    G.clan.power = (G.clan.power||0) + powerGain;
    G.coins += 300; G.wins++;
    toast(`⚔️ Победа над "${targetName}"! +${powerGain} мощи клану`, 'success');
  } else {
    const powerLoss = Math.floor(myPower * 0.05);
    G.clan.power = Math.max(0, (G.clan.power||0) - powerLoss);
    toast(`💀 Поражение от "${targetName}". -${powerLoss} мощи`, 'error');
  }
  saveGame(); updateHeader(); renderClans();
}

function attackClanWar() {
  const opponents = DEMO_CLANS.filter(c => c.name !== G.clan?.name);
  const target = opponents[Math.floor(Math.random()*opponents.length)];
  if (target) attackClan(target.name, target.power);
}

async function inviteFriendToClan() {
  if (!G.token) { toast('Нужна авторизация', 'error'); return; }
  try {
    const res = await fetch('/api/players/friends/list', { headers:{'Authorization':'Bearer '+G.token} });
    const data = await res.json();
    const friends = (data.friends||[]).filter(f => f.status==='accepted');
    if (!friends.length) { toast('Нет друзей для приглашения', 'error'); return; }
    openModal('👥 Пригласить в клан', friends.map(f => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg3);border-radius:8px;margin-bottom:6px">
        <span style="font-size:20px">${f.avatar||'🦛'}</span>
        <div style="flex:1"><div style="font-weight:600;font-size:12px">${f.username}</div></div>
        <button class="btn btn-xs btn-primary" onclick="sendClanInvite('${f.id}','${f.username}')">📨 Пригласить</button>
      </div>
    `).join(''));
  } catch { toast('Ошибка загрузки', 'error'); }
}

async function sendClanInvite(friendId, friendName) {
  if (window.hwSocket) window.hwSocket.emit('clan_invite', { to_id: friendId, clan: G.clan });
  toast(`📨 Приглашение отправлено @${friendName}`, 'success'); closeModal();
}

// ========================
// LEADERBOARD
// ========================
async function loadLeaderboard(type) {
  const div = document.getElementById('leaderboard-list');
  if (!div) return;
  div.innerHTML = '<div style="color:var(--text2);font-size:12px;padding:12px;text-align:center">⏳ Загрузка...</div>';
  let players = [];
  try {
    const res = await fetch(`/api/players/leaderboard?type=${type}`, G.token ? { headers:{'Authorization':'Bearer '+G.token} } : {});
    if (res.ok) players = await res.json();
  } catch {}
  const tabs = [['elo','📈 ELO'],['wins','🏆 Победы'],['level','⭐ Уровень']];
  div.innerHTML = `
    <div style="display:flex;gap:6px;margin-bottom:14px">
      ${tabs.map(([t,l])=>`<button class="btn btn-xs ${type===t?'btn-primary':'btn-secondary'}" onclick="loadLeaderboard('${t}')">${l}</button>`).join('')}
    </div>
    ${!players.length ? '<div style="color:var(--text3);font-size:12px;padding:20px;text-align:center">Пока нет игроков. Войди в аккаунт!</div>'
      : players.map((p,i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:11px 12px;background:var(--bg3);border-radius:12px;margin-bottom:7px;cursor:${p.id?'pointer':'default'};border:1px solid var(--border);transition:border-color .2s" onclick="${p.id?`viewPlayerProfile('${p.id}')`:''}" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="font-size:${i<3?'20':'13'}px;min-width:30px;text-align:center;font-weight:700;color:${i===0?'var(--gold)':i===1?'#aaa':i===2?'#cd7f32':'var(--text2)'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div>
        <span style="font-size:24px">${p.avatar||'🦛'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.username}${p.username===G.playerName?' <span style="color:var(--accent);font-size:9px">(ты)</span>':''}</div>
          <div style="font-size:10px;color:var(--text2)">Ур.${p.level||1} · ${p.wins||0} побед</div>
        </div>
        <div style="text-align:right;min-width:50px">
          <div style="font-family:var(--font-title);font-size:14px;font-weight:700;color:var(--accent)">${type==='wins'?p.wins:type==='level'?'Ур.'+p.level:p.elo}</div>
          ${p.id&&p.id!==G.playerId?'<div style="font-size:9px;color:var(--text3)">→ профиль</div>':''}
        </div>
      </div>
    `).join('')}
  `;
}

async function viewPlayerProfile(playerId) {
  if (!playerId || !G.token) return;
  try {
    const res = await fetch(`/api/players/${playerId}`, { headers:{'Authorization':'Bearer '+G.token} });
    const data = await res.json();
    if (!data.player) return;
    const p = data.player;
    openModal(`${p.avatar||'🦛'} @${p.username}`, `
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:52px">${p.avatar||'🦛'}</div>
        <div style="font-family:var(--font-title);font-size:16px;font-weight:700;margin:5px 0">${p.username}</div>
        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:8px">
          <div style="text-align:center"><div style="font-size:16px;font-weight:700">${p.level}</div><div style="font-size:10px;color:var(--text2)">Уровень</div></div>
          <div style="text-align:center"><div style="font-size:16px;font-weight:700">${p.elo}</div><div style="font-size:10px;color:var(--text2)">ELO</div></div>
          <div style="text-align:center"><div style="font-size:16px;font-weight:700">${p.wins}</div><div style="font-size:10px;color:var(--text2)">Победы</div></div>
          <div style="text-align:center"><div style="font-size:16px;font-weight:700">${data.hippo_count||0}</div><div style="font-size:10px;color:var(--text2)">Бегемоты</div></div>
        </div>
      </div>
      ${data.hippos?.length ? `
        <div class="card-title" style="font-size:11px">🦛 Бегемоты</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
          ${data.hippos.slice(0,8).map(h => `
            <div style="text-align:center;padding:6px 10px;background:var(--bg3);border-radius:8px;border:1px solid ${getRarityColor(h.rarity||'common')}40">
              <div style="font-size:22px">${h.emoji||'🦛'}</div>
              <div style="font-size:9px;font-weight:600">${h.name}</div>
              <div style="font-size:9px;color:${getRarityColor(h.rarity||'common')}">${getRarityName(h.rarity||'common')}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div style="display:flex;gap:8px;margin-top:14px">
        ${G.token && p.id!==G.playerId ? `<button class="btn btn-primary" style="flex:1" onclick="addFriendById('${p.id}','${p.username}')">👥 Добавить</button>` : ''}
        <button class="btn btn-secondary" style="flex:1" onclick="closeModal()">Закрыть</button>
      </div>
    `);
  } catch { toast('Ошибка загрузки', 'error'); }
}

// ========================
// SHOP (expanded)
// ========================
function renderShop() {
  const tab = document.getElementById('tab-shop');
  if (!tab) return;
  tab.innerHTML = `
    <div class="section-title">🛒 Магазин</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      <button class="btn btn-xs btn-secondary" onclick="renderShopSection('resources')">💰 Ресурсы</button>
      <button class="btn btn-xs btn-secondary" onclick="renderShopSection('boosts')">⚡ Бусты</button>
      <button class="btn btn-xs btn-secondary" onclick="renderShopSection('weapons')">⚔️ Оружие</button>
      <button class="btn btn-xs btn-secondary" onclick="renderShopSection('armor')">🛡️ Броня</button>
      <button class="btn btn-xs btn-secondary" onclick="renderShopSection('accessories')">💍 Аксессуары</button>
      <button class="btn btn-xs btn-secondary" onclick="renderShopSection('artifacts')">🔮 Артефакты</button>
    </div>
    <div id="shop-section-content"></div>
  `;
  renderShopSection('resources');
}

function renderShopSection(section) {
  const div = document.getElementById('shop-section-content');
  if (!div) return;
  if (section === 'resources') {
    const items = [
      { emoji:'🪙', name:'500 монет',      price:10,  currency:'gems',  give:()=>{ G.coins+=500; } },
      { emoji:'🪙', name:'2000 монет',     price:35,  currency:'gems',  give:()=>{ G.coins+=2000; } },
      { emoji:'🪙', name:'10000 монет',    price:150, currency:'gems',  give:()=>{ G.coins+=10000; } },
      { emoji:'💎', name:'5 кристаллов',   price:300, currency:'coins', give:()=>{ G.gems+=5; } },
      { emoji:'💎', name:'15 кристаллов',  price:800, currency:'coins', give:()=>{ G.gems+=15; } },
      { emoji:'💎', name:'50 кристаллов',  price:2000,currency:'coins', give:()=>{ G.gems+=50; } },
    ];
    div.innerHTML = items.map((it,i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg3);border-radius:12px;margin-bottom:8px">
        <span style="font-size:28px">${it.emoji}</span>
        <div style="flex:1"><div style="font-weight:700">${it.name}</div></div>
        <button class="btn btn-primary btn-sm" onclick="buyResourceItem(${i},'${section}')">${it.currency==='gems'?'💎':'🪙'} ${it.price}</button>
      </div>
    `).join('');
    window._shopResItems = items;
  } else if (section === 'boosts') {
    const boosts = [
      { emoji:'⚡', name:'Двойной опыт (1 час)',  price:30,  currency:'gems',  desc:'Весь XP x2 на 1 час' },
      { emoji:'💰', name:'Двойные монеты (1 час)', price:25, currency:'gems',  desc:'Монеты из боёв x2' },
      { emoji:'🧬', name:'Мутация гарантия',       price:80, currency:'gems',  desc:'Следующая мутация 100%' },
      { emoji:'🎯', name:'Удача (30 мин)',          price:20, currency:'gems',  desc:'+15% шанс крита' },
      { emoji:'🛡️', name:'Щит ELO (1 бой)',        price:15, currency:'gems',  desc:'Следующее поражение не снимает ELO' },
      { emoji:'🔑', name:'Экспедиция x3',           price:40, currency:'gems',  desc:'Тройная награда из экспедиции' },
    ];
    div.innerHTML = boosts.map((b,i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg3);border-radius:12px;margin-bottom:8px">
        <span style="font-size:28px">${b.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:13px">${b.name}</div>
          <div style="font-size:11px;color:var(--text2)">${b.desc}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="buyBoost(${i})">💎 ${b.price}</button>
      </div>
    `).join('');
    window._shopBoosts = boosts;
  } else {
    const itemMap = { weapons:WEAPONS, armor:ARMORS, accessories:ACCESSORIES, artifacts:ARTIFACTS };
    const items = itemMap[section] || [];
    div.innerHTML = items.map(item => `
      <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg3);border:1px solid ${getRarityColor(item.rarity||'common')}40;border-radius:12px;margin-bottom:8px">
        <span style="font-size:28px">${item.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:12px">${item.name}</div>
          <div style="font-size:10px;color:var(--text2)">${Object.entries(item.bonus||{}).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(' · ')}</div>
          <div style="font-size:9px;color:${getRarityColor(item.rarity||'common')}">${getRarityName(item.rarity||'common')}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="buyShopItem('${item.id}')">🪙 ${item.price}</button>
      </div>
    `).join('');
  }
}

function buyResourceItem(idx, section) {
  const it = window._shopResItems?.[idx];
  if (!it) return;
  if (it.currency==='gems') { if (G.gems<it.price){toast('Нужно 💎'+it.price,'error');return;} G.gems-=it.price; }
  else { if (G.coins<it.price){toast('Нужно 🪙'+it.price,'error');return;} G.coins-=it.price; }
  it.give(); toast(`✅ ${it.name} куплено!`,'success');
  saveGame(); updateHeader();
}

function buyBoost(idx) {
  const b = window._shopBoosts?.[idx];
  if (!b) return;
  if (G.gems < b.price) { toast(`Нужно 💎${b.price}`, 'error'); return; }
  G.gems -= b.price;
  toast(`⚡ ${b.name} активирован!`, 'success');
  saveGame(); updateHeader();
}

function buyShopItem(itemId) {
  const item = ALL_ITEMS.find(i=>i.id===itemId);
  if (!item) return;
  if (G.coins < item.price) { toast(`Нужно 🪙${item.price}`, 'error'); return; }
  G.coins -= item.price;
  G.inventory.push({ ...item, id:'inv_'+Date.now(), upgradeLevel:0 });
  toast(`✅ ${item.emoji} ${item.name} куплен!`, 'success');
  saveGame(); updateHeader();
}

function buySpecialItem(i) { buyBoost(i); }

// ========================
// VALHALLA (reworked)
// ========================
function renderValhalla() {
  const tab = document.getElementById('tab-valhalla');
  if (!tab) return;
  const trapped = G.hippos.filter(h => h.inValhalla);
  tab.innerHTML = `
    <div class="section-title" style="color:#ff6b00">💀 Вальхалла</div>
    <div style="background:rgba(255,107,0,0.08);border:1px solid rgba(255,107,0,0.3);border-radius:14px;padding:14px;margin-bottom:16px;font-size:12px;color:var(--text2)">
      Бегемот умирает 20 раз → попадает в Вальхаллу.<br>
      Победи всех 5 боссов по очереди, чтобы вырваться. Уровень каждого следующего выше.
    </div>

    ${!trapped.length ? '<div style="text-align:center;padding:20px;color:var(--text3)">🎉 Никто в Вальхалле</div>' : `
      <div class="card-title">💀 Заключённые (${trapped.length})</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px;margin-bottom:16px">
        ${trapped.map((h,i) => {
          const valIdx = h.valhallaBossIdx || 0;
          const boss = VALHALLA_BOSSES[valIdx];
          return `
            <div style="text-align:center;padding:10px;background:rgba(255,107,0,0.05);border:1px solid rgba(255,107,0,0.3);border-radius:10px;cursor:pointer" onclick="selectValhippo('${h.id}')">
              <div style="font-size:28px">${h.emoji}</div>
              <div style="font-size:10px;font-weight:700">${h.name}</div>
              <div style="font-size:9px;color:var(--text2)">${getRarityName(h.rarity)}</div>
              <div style="font-size:9px;color:#ff6b00">Босс ${valIdx+1}/5</div>
            </div>
          `;
        }).join('')}
      </div>
    `}

    <div class="card-title" style="color:#ff6b00">👹 Боссы Вальхаллы</div>
    <div id="valhalla-hippo-selector" style="margin-bottom:10px">
      ${trapped.length ? `<div style="font-size:12px;color:var(--text2);margin-bottom:8px">Выбери бегемота для боя:</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${trapped.map(h => `<button class="btn btn-xs ${window._valHippo===h.id?'btn-primary':'btn-secondary'}" onclick="selectValhippo('${h.id}')">${h.emoji} ${h.name}</button>`).join('')}
        </div>` : ''}
    </div>

    <div style="display:flex;flex-direction:column;gap:8px">
      ${VALHALLA_BOSSES.map((boss,i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,107,0,0.05);border:1px solid ${i===0?'rgba(255,107,0,0.5)':'rgba(255,107,0,0.2)'};border-radius:12px">
          <span style="font-size:32px">${boss.emoji}</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">${boss.name}</div>
            <div style="font-size:10px;color:var(--text2)">HP: ${boss.hp} | ATK: ${boss.atk} | DEF: ${boss.def}</div>
            <div style="font-size:10px;color:var(--gold)">+${boss.coins}🪙 +${boss.xp}XP</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="fightValhallaBoss(${i})" ${!trapped.length?'disabled':''}>⚔️ Бой</button>
        </div>
      `).join('')}
    </div>
  `;
}

function selectValhippo(hippoId) {
  window._valHippo = hippoId;
  renderValhalla();
}

function fightValhallaBoss(bossIdx) {
  const hippoId = window._valHippo;
  const h = G.hippos.find(x=>x.id===hippoId && x.inValhalla);
  if (!h) { toast('Выбери бегемота!', 'error'); return; }

  const expectedBoss = h.valhallaBossIdx || 0;
  if (bossIdx !== expectedBoss) {
    toast(`Сначала победи Босса ${expectedBoss+1}: ${VALHALLA_BOSSES[expectedBoss].name}!`, 'error'); return;
  }

  const boss = VALHALLA_BOSSES[bossIdx];
  const myScore = getHippoHP(h) + getHippoATK(h) * 5;
  const bossScore = boss.hp + boss.atk * 5;
  const winChance = Math.min(0.85, Math.max(0.15, myScore / (myScore + bossScore)));
  const won = Math.random() < winChance;

  if (won) {
    G.coins += boss.coins; addXP(boss.xp);
    h.valhallaBossIdx = bossIdx + 1;
    if (bossIdx >= VALHALLA_BOSSES.length - 1) {
      h.inValhalla = false; h.valhallaBossIdx = 0; h.deaths = 0;
      toast(`🎉 ${h.name} вырвался из Вальхаллы! Смерти сброшены.`, 'legendary', 6000);
    } else {
      toast(`⚔️ Победа! +${boss.coins}🪙. Следующий босс: ${VALHALLA_BOSSES[bossIdx+1].name}`, 'success');
    }
  } else {
    toast(`💀 ${boss.name} слишком силён! Попробуй снова.`, 'error');
  }
  saveGame(); updateHeader(); renderValhalla();
}

// ========================
// PROFILE
// ========================
function renderProfile() {
  const div = document.getElementById('tab-profile');
  if (!div) return;
  div.innerHTML = `
    <div class="section-title">👤 Профиль</div>
    <div class="grid-2">
      <div>
        <div class="card">
          <div class="card-title">🎭 Аватар</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
            ${['🦛','🦏','🐘','🦬','🐗','🦣','🦁','🐯','🐻','🐺'].map(e=>`
              <button style="font-size:22px;background:${G.avatar===e?'var(--accent3)':'var(--bg3)'};border:2px solid ${G.avatar===e?'var(--accent)':'var(--border)'};border-radius:8px;padding:5px 8px;cursor:pointer" onclick="G.avatar='${e}';saveGame();renderProfile()">${e}</button>
            `).join('')}
          </div>
          <div class="card-title">🎨 Тема оформления</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="theme-btn btn btn-sm btn-secondary" data-theme="default" onclick="applyTheme('default')">🌑 Default</button>
            <button class="theme-btn btn btn-sm btn-secondary" data-theme="african" onclick="applyTheme('african')">🌍 Африка</button>
            <button class="theme-btn btn btn-sm btn-secondary" data-theme="naruto" onclick="applyTheme('naruto')">🍥 Наруто</button>
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-title">📊 Статистика</div>
          ${[
            ['🎯', 'Уровень', G.level], ['⚔️', 'Победы', G.wins],
            ['💀', 'Поражения', G.losses], ['📈', 'ELO', G.elo],
            ['🦛', 'Бегемоты', G.hippos.length], ['📦', 'Открыто кейсов', G.totalOpens],
          ].map(([e,n,v])=>`
            <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:12px">
              <span>${e} ${n}</span><strong>${v}</strong>
            </div>
          `).join('')}
        </div>
        <div class="card" style="margin-top:12px">
          <div class="card-title">🏆 Достижения</div>
          ${[
            {e:'⚔️', n:'Первая победа',   d:'Выиграй 1 бой',        done:G.wins>=1},
            {e:'🔥', n:'10 побед',         d:'Выиграй 10 боёв',      done:G.wins>=10},
            {e:'💯', n:'50 побед',         d:'Выиграй 50 боёв',      done:G.wins>=50},
            {e:'🦛', n:'Коллекционер',     d:'5 бегемотов',          done:G.hippos.length>=5},
            {e:'💎', n:'Богатей',          d:'1000 монет',           done:G.coins>=1000},
            {e:'🏆', n:'ELO 1500',         d:'Достигни ELO 1500',    done:G.elo>=1500},
            {e:'👑', n:'Король',           d:'Стань королём региона',done:G.regions.some(r=>r.king===G.playerName)},
            {e:'🌟', n:'Мифик',           d:'Открой мифического',   done:G.mythicOpens>=1},
          ].map(a=>`
            <div style="display:flex;align-items:center;gap:8px;padding:6px;background:var(--bg3);border-radius:8px;margin-bottom:5px;opacity:${a.done?1:0.4}">
              <span style="font-size:18px">${a.e}</span>
              <div style="flex:1"><div style="font-size:11px;font-weight:600">${a.n}</div><div style="font-size:10px;color:var(--text2)">${a.d}</div></div>
              ${a.done?'<span style="color:var(--success);font-size:14px">✓</span>':'<span style="color:var(--text3);font-size:11px">🔒</span>'}
            </div>
          `).join('')}
        </div>
        ${G.token ? `
          <div class="card" style="margin-top:12px">
            <div class="card-title">⚙️ Аккаунт</div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:10px">@${G.playerName}</div>
            <button class="btn btn-danger btn-full" onclick="logoutPlayer()">🚪 Выйти</button>
          </div>
        ` : `<div class="card" style="margin-top:12px"><a href="/" class="btn btn-primary btn-full">🔐 Войти</a></div>`}
      </div>
    </div>
  `;
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === G.theme || (btn.dataset.theme === 'default' && (!G.theme||G.theme==='default')));
  });
}

// ========================
// SEARCH & FRIENDS
// ========================
function renderSearch() {
  const div = document.getElementById('tab-search');
  if (!div) return;
  div.innerHTML = `
    <div class="section-title">🔍 Поиск игроков</div>
    <div class="card">
      <input id="search-input" type="text" class="input" placeholder="🔍 Поиск по нику (оставь пустым для всех)..." style="width:100%;margin-bottom:10px" oninput="doSearch(this.value)">
      <div id="search-results"></div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="card-title">👥 Друзья</div>
      <div id="friends-list"><div style="color:var(--text3);font-size:12px">Загрузка...</div></div>
    </div>
  `;
  doSearch('');
  loadFriendsList();
}

let searchTimeout = null;
async function doSearch(q) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const res_div = document.getElementById('search-results');
    if (!res_div) return;
    res_div.innerHTML = '<div style="color:var(--text2);font-size:12px;padding:8px">Загрузка...</div>';
    let players = [];
    if (G.token) {
      try {
        const url = q.length >= 2 ? `/api/players/search?q=${encodeURIComponent(q)}` : '/api/players/leaderboard?type=elo';
        const r = await fetch(url, { headers:{'Authorization':'Bearer '+G.token} });
        if (r.ok) players = await r.json();
      } catch {}
    }
    if (!players.length) {
      players = AI_PLAYERS
        .filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))
        .map(p => ({ username:p.name, elo:p.elo, wins:p.wins, level:Math.floor(p.elo/100), avatar:p.avatar||'🤖', id:null }));
    }
    if (!players.length) { res_div.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px">Никого не найдено</div>'; return; }
    res_div.innerHTML = players.slice(0,20).map(p => `
      <div class="search-result-row" onclick="${p.id?`viewPlayerProfile('${p.id}')`:''}" style="${p.id?'cursor:pointer':''}">
        <div style="font-size:24px">${p.avatar||'🦛'}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:12px">${p.username}</div>
          <div style="font-size:10px;color:var(--text2)">Ур.${p.level||1} | ELO: ${p.elo} | ⚔️ ${p.wins||0}W</div>
        </div>
        <div style="display:flex;gap:5px;align-items:center">
          ${G.token&&p.id ? `<button class="btn btn-xs btn-secondary" onclick="event.stopPropagation();addFriendById('${p.id}','${p.username}')">👥</button>` : ''}
          ${p.id ? '<div style="font-size:11px;color:var(--text3)">→</div>' : ''}
        </div>
      </div>
    `).join('');
  }, 300);
}

async function loadFriendsList() {
  const div = document.getElementById('friends-list');
  if (!div) return;
  if (!G.token) { div.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px">Войди чтобы видеть друзей</div>'; return; }
  try {
    const res = await fetch('/api/players/friends/list', { headers:{'Authorization':'Bearer '+G.token} });
    const data = await res.json();
    const friends = data.friends || [];
    if (!friends.length) { div.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px">Нет друзей пока 😔</div>'; return; }
    div.innerHTML = friends.map(f => `
      <div class="search-result-row">
        <div style="font-size:22px">${f.avatar||'🦛'}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:12px">${f.username}</div>
          <div style="font-size:10px;color:var(--text2)">ELO: ${f.elo} | ⚔️ ${f.wins||0}W</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          <span style="font-size:10px;color:${f.status==='accepted'?'var(--success)':'var(--text3)'}">
            ${f.status==='accepted'?'✅':f.sender_id===G.playerId?'⏳':'👥'}
          </span>
          ${f.status==='pending'&&f.sender_id!==G.playerId ? `<button class="btn btn-xs btn-primary" onclick="respondFriend('${f.id}','accept')">✓</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch { div.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px">Ошибка загрузки</div>'; }
}

async function respondFriend(id, action) {
  if (!G.token) return;
  try {
    const r = await fetch('/api/players/friends/respond', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+G.token}, body:JSON.stringify({friendship_id:id,action}) });
    const d = await r.json();
    toast(d.success ? '✅ Готово!' : (d.error||'Ошибка'), d.success ? 'success' : 'error');
    loadFriendsList();
  } catch { toast('Ошибка', 'error'); }
}

async function addFriendById(id, username) {
  if (!G.token) return;
  try {
    const r = await fetch('/api/players/friends/add', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+G.token}, body:JSON.stringify({friend_id:id}) });
    const d = await r.json();
    toast(d.success ? `👥 Запрос отправлен @${username}!` : (d.error||'Ошибка'), d.success?'success':'error');
  } catch { toast('Ошибка','error'); }
}

// ========================
// BOSS FIGHT TAB (friends invite)
// ========================
async function renderBossFightTab() {
  const div = document.getElementById('tab-bossfight');
  if (!div) return;
  div.innerHTML = `
    <div class="section-title">👹 Босс-файт сквадом</div>
    <div class="grid-2">
      <div>
        <div class="card">
          <div class="card-title">⚔️ Выбери босса</div>
          ${BOSSES.map(b => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border:1.5px solid var(--border);border-radius:12px;margin-bottom:8px;cursor:pointer;transition:border-color .2s"
              onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'"
              onclick="createBossLobby('${b.id}')">
              <span style="font-size:36px">${b.emoji}</span>
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px">${b.name}</div>
                <div style="font-size:10px;color:var(--text2)">HP: ${b.hp.toLocaleString()} | ATK: ${b.atk} | Мин.ур.: ${b.level}</div>
                <div style="font-size:10px;color:var(--gold)">+${b.coins}🪙 +${b.xp}XP</div>
              </div>
              <div style="font-size:11px;color:var(--text2)">${b.loot}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <div class="card" id="boss-lobby-panel">
          <div class="card-title">👥 Лобби сквада</div>
          <div style="color:var(--text2);font-size:12px;padding:8px">Выбери босса слева чтобы создать лобби</div>
        </div>
      </div>
    </div>
  `;
}

async function createBossLobby(bossId) {
  if (!G.token) { toast('Нужна авторизация', 'error'); return; }
  const boss = BOSSES.find(b=>b.id===bossId);
  if (!boss) return;
  if (G.level < boss.level) { toast(`Нужен уровень ${boss.level}!`, 'error'); return; }

  try {
    const res = await fetch('/api/bossfights/create', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+G.token},
      body: JSON.stringify({ boss_id: bossId })
    });
    const data = await res.json();
    if (!data.success) { toast(data.error||'Ошибка', 'error'); return; }
    showBossLobby(data.lobby_id, data.invite_code, boss, true, [{ username:G.playerName, avatar:G.avatar, ready:false, isHost:true }]);
  } catch { toast('Ошибка сервера', 'error'); }
}

function showBossLobby(lobbyId, inviteCode, boss, isHost, members=[]) {
  const panel = document.getElementById('boss-lobby-panel');
  if (!panel) return;
  if (window.hwSocket) window.hwSocket.emit('join_boss_lobby', { lobby_id: lobbyId });

  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:10px;margin-bottom:12px">
      <span style="font-size:32px">${boss.emoji}</span>
      <div>
        <div style="font-weight:700;font-size:13px">${boss.name}</div>
        <div style="font-size:10px;color:var(--text2)">HP: ${boss.hp.toLocaleString()}</div>
      </div>
    </div>

    <div class="card-title" style="font-size:11px">👥 Участники (${members.length}/4)</div>
    <div id="lobby-members" style="margin-bottom:12px">
      ${members.map(m => `
        <div style="display:flex;align-items:center;gap:8px;padding:7px;background:var(--bg3);border-radius:8px;margin-bottom:5px">
          <span style="font-size:18px">${m.avatar||'🦛'}</span>
          <div style="flex:1;font-size:12px;font-weight:600">${m.username}${m.isHost?' 👑':''}</div>
          <span style="font-size:11px;color:${m.ready?'var(--success)':'var(--text3)'}">${m.ready?'✅ Готов':'⏳ Ждёт'}</span>
        </div>
      `).join('')}
    </div>

    <div class="card-title" style="font-size:11px">📨 Пригласить друзей</div>
    <div id="lobby-friends-list" style="margin-bottom:12px">
      <div style="color:var(--text3);font-size:11px">Загрузка друзей...</div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${isHost ? `<button class="btn btn-primary" style="flex:1" id="start-boss-btn" onclick="startBossFight('${lobbyId}')">⚔️ Начать!</button>` : '<div style="font-size:12px;color:var(--text2)">Ждём хоста...</div>'}
      <button class="btn btn-secondary" onclick="toggleBossReady('${lobbyId}')">✅ Готов</button>
    </div>
  `;

  // Load friends for invite
  loadBossLobbyFriends(lobbyId);
}

async function loadBossLobbyFriends(lobbyId) {
  const div = document.getElementById('lobby-friends-list');
  if (!div || !G.token) return;
  try {
    const res = await fetch('/api/players/friends/list', { headers:{'Authorization':'Bearer '+G.token} });
    const data = await res.json();
    const friends = (data.friends||[]).filter(f=>f.status==='accepted');
    if (!friends.length) { div.innerHTML = '<div style="color:var(--text3);font-size:11px">Нет друзей онлайн</div>'; return; }
    div.innerHTML = friends.map(f => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px;background:var(--bg3);border-radius:7px;margin-bottom:4px">
        <span style="font-size:16px">${f.avatar||'🦛'}</span>
        <div style="flex:1;font-size:11px">${f.username}</div>
        <button class="btn btn-xs btn-primary" onclick="inviteFriendToBossLobby('${f.id}','${f.username}','${lobbyId}')">📨</button>
      </div>
    `).join('');
  } catch {}
}

function inviteFriendToBossLobby(friendId, friendName, lobbyId) {
  if (window.hwSocket) window.hwSocket.emit('boss_lobby_invite', { to_id: friendId, lobby_id: lobbyId, boss_name: 'Босс' });
  toast(`📨 Приглашение отправлено @${friendName}`, 'success');
}

function toggleBossReady(lobbyId) {
  if (window.hwSocket) window.hwSocket.emit('boss_lobby_ready', { lobby_id: lobbyId, ready: true });
  toast('✅ Готов!', 'success');
}

async function startBossFight(lobbyId) {
  const btn = document.getElementById('start-boss-btn');
  if (btn) { btn.disabled=true; btn.textContent='⏳ Бой...'; }
  try {
    const res = await fetch(`/api/bossfights/${lobbyId}/start`, { method:'POST', headers:{'Authorization':'Bearer '+G.token} });
    const data = await res.json();
    if (!data.success) { toast(data.error||'Ошибка','error'); if(btn){btn.disabled=false;btn.textContent='⚔️ Начать!';} return; }
    showBossFightResult(data);
  } catch { toast('Ошибка','error'); if(btn){btn.disabled=false;btn.textContent='⚔️ Начать!';} }
}

function showBossFightResult(data) {
  const panel = document.getElementById('boss-lobby-panel');
  if (!panel) return;
  const { result, boss, rewards } = data;
  const myReward = rewards?.find(r=>r.player_id===G.playerId);
  if (myReward) { G.coins += myReward.coins; addXP(myReward.xp); saveGame(); updateHeader(); }
  panel.innerHTML = `
    <div style="text-align:center;padding:16px;background:${result.won?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)'};border:2px solid ${result.won?'var(--success)':'var(--danger)'};border-radius:14px;margin-bottom:12px">
      <div style="font-size:48px">${result.won?'🏆':'💀'}</div>
      <div style="font-family:var(--font-title);font-size:16px;font-weight:900;color:${result.won?'var(--success)':'var(--danger)'}">${result.won?'ПОБЕДА!':'ПОРАЖЕНИЕ'}</div>
      ${myReward&&result.won ? `<div style="margin-top:8px;font-weight:700;color:var(--gold)">+${myReward.coins}🪙 +${myReward.xp}XP</div>` : ''}
    </div>
    <div style="background:var(--bg3);border-radius:10px;padding:10px;max-height:180px;overflow-y:auto;font-size:11px;margin-bottom:10px">
      ${(result.log||[]).map(l=>`<div style="padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.04);color:${l.type==='boss_attack'?'var(--danger)':'var(--accent)'}">${l.text}</div>`).join('')}
    </div>
    <button class="btn btn-primary btn-full" onclick="renderBossFightTab()">← Назад</button>
  `;
  toast(result.won ? '🏆 Победа над боссом!' : '💀 Босс победил...', result.won?'legendary':'error', 5000);
}
