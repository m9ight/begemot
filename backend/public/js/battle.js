// ========================
// ARENA RENDER
// ========================
function renderArena() {
  document.getElementById('arena-elo').textContent = G.elo;
  document.getElementById('arena-select').style.display = 'grid';
  document.getElementById('arena-battle-view').style.display = 'none';
  document.getElementById('arena-colosseum-view').style.display = 'none';
  const cdText = G.bossCD > Date.now() ? fmtTime(G.bossCD - Date.now()) : 'Готов!';
  document.getElementById('boss-cd').textContent = cdText;
}

function startArena(mode) {
  if (!G.hippos.length) { toast('Нужен хотя бы один бегемот!', 'error'); setTabByName('cases'); return; }
  const hippo = G.hippos[G.activeHippo || 0];
  if (!hippo) { toast('Выбери бойца во вкладке Бегемоты!', 'error'); return; }
  if (hippo.inValhalla) { toast('Твой боец в Вальхалле!', 'error'); return; }
  if (isHippoInExpedition(hippo)) { toast('Твой боец в экспедиции!', 'error'); return; }

  if (mode === 'colosseum') { openColosseumModal(); return; }
  if (mode === 'bounty') { showBountyBoard(); return; }
  if (mode === 'boss') {
    if (G.bossCD > Date.now()) { toast(`Босс восстанавливается: ${fmtTime(G.bossCD - Date.now())}`, 'error'); return; }
    beginFight('boss', 'bot'); return;
  }
  if (mode === 'ranked') {
    if (!window.hwSocket?.connected) { toast('Нет подключения к серверу', 'error'); return; }
    startPvPMatchmaking(mode); return;
  }
  openModal(`⚔️ ${modeLabel(mode)}`, `
    <div style="text-align:center;margin-bottom:16px;color:var(--text2);font-size:13px">Твой боец: ${hippo.emoji} ${hippo.name} | HP:${getHippoHP(hippo)} ATK:${getHippoATK(hippo)}</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-secondary btn-full" onclick="closeModal();beginFight('${mode}','bot')">
        🤖 Против бота <span style="font-size:11px;opacity:0.6;float:right">Всегда доступно</span>
      </button>
      <button class="btn btn-danger btn-full" onclick="closeModal();startPvPMatchmaking('${mode}')">
        🌐 Против игрока <span style="font-size:11px;opacity:0.6;float:right">${window.onlineCount || 0} онлайн</span>
      </button>
    </div>
  `);
}

function modeLabel(m) {
  return { casual:'Обычный бой', ranked:'Рейтинговый', boss:'Босс', bounty:'Баунти', colosseum:'Колизей' }[m] || m;
}

function beginFight(mode, opponentType) {
  currentArenaMode = mode;
  if (opponentType === 'pvp' && window.hwSocket) { startPvPMatchmaking(mode); return; }
  const playerHippo = G.hippos[G.activeHippo || 0];
  if (!playerHippo) { toast('Нет бойца!', 'error'); return; }

  let enemy;
  if (mode === 'boss') {
    const boss = BOSSES[Math.min(Math.floor(G.level / 10), BOSSES.length - 1)];
    enemy = { id: boss.id, name: boss.name, emoji: boss.emoji, isBoss: true,
      hp: boss.hp, maxHp: boss.hp, atk: boss.atk, def: boss.def,
      mutations: ['berserk', 'fire'], abilities: [],
      stats: { str: boss.atk, agi: 20, int: 10, vit: Math.floor(boss.hp / 5), lck: 5 } };
  } else {
    const ai = AI_PLAYERS[Math.floor(Math.random() * AI_PLAYERS.length)];
    const eH = generateHippo(rollRarity());
    enemy = { ...eH, ownerName: ai.name, maxHp: getHippoHP(eH), hp: getHippoHP(eH) };
  }

  battleState = {
    mode, isPvP: false,
    player: { ...playerHippo, hp: getHippoHP(playerHippo), maxHp: getHippoHP(playerHippo) },
    enemy: { ...enemy },
    turn: 0, log: [], ended: false, active: false,
    // Ability state
    abilityUsed: false,
    shieldTurns: 0, shieldReduction: 0,
    stunned: false,
    phoenixUsed: false,
  };

  document.getElementById('arena-select').style.display = 'none';
  document.getElementById('arena-battle-view').style.display = 'block';
  renderBattle(); renderBattleActions();
}

// ========================
// PvP MATCHMAKING (turn-based)
// ========================
function startPvPMatchmaking(mode) {
  if (!window.hwSocket?.connected) { toast('Нет подключения к серверу', 'error'); return; }
  const hippo = G.hippos[G.activeHippo || 0];
  if (!hippo) { toast('Нет бойца!', 'error'); return; }

  document.getElementById('arena-select').style.display = 'none';
  document.getElementById('arena-battle-view').style.display = 'block';

  document.getElementById('battle-arena-box').innerHTML = `
    <div class="pvp-waiting">
      <span class="big-icon">⚔️</span>
      <div style="font-family:var(--font-title);font-size:18px;font-weight:700;margin-bottom:8px">Поиск противника...</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:12px">Режим: ${modeLabel(mode)} | ELO: ${G.elo}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:18px">
        <div class="queue-spinner"></div>
        <span style="font-size:12px;color:var(--text2)" id="queue-timer">0 сек</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:14px">Боец: ${hippo.emoji} ${hippo.name} | HP:${getHippoHP(hippo)}</div>
      <button class="btn btn-danger btn-sm" onclick="cancelMatchmaking()">✕ Отмена</button>
    </div>`;
  document.getElementById('battle-action-btns').innerHTML = '';

  window.queueStartTime = Date.now();
  window.queueInterval = setInterval(() => {
    const el = document.getElementById('queue-timer');
    if (el) el.textContent = Math.floor((Date.now() - window.queueStartTime) / 1000) + ' сек';
  }, 1000);

  window.hwSocket.emit('join_queue', { mode, hippo: serializeHippoForPvP(hippo) });
}

function cancelMatchmaking() {
  if (window.hwSocket) window.hwSocket.emit('leave_queue');
  clearInterval(window.queueInterval);
  document.getElementById('arena-select').style.display = 'grid';
  document.getElementById('arena-battle-view').style.display = 'none';
}

function serializeHippoForPvP(h) {
  return { id: h.id, name: h.name, emoji: h.emoji, rarity: h.rarity,
    stats: h.stats, mutations: h.mutations || [], abilities: h.abilities || [],
    hp: getHippoHP(h), maxHp: getHippoHP(h), atk: getHippoATK(h) };
}

// Called by socket event (match_found)
function onMatchFound({ battle_id, opponent, side, your_turn }) {
  clearInterval(window.queueInterval);
  window.pvpBattleId = battle_id;
  window.pvpSide = side;
  window.pvpMyTurn = !!your_turn; // true = my turn first

  toast(`⚔️ Найден противник: @${opponent.username} (ELO ${opponent.elo})!`, 'success', 4000);

  const myHippo = G.hippos[G.activeHippo || 0];
  battleState = {
    mode: currentArenaMode, isPvP: true,
    player: { ...myHippo, hp: getHippoHP(myHippo), maxHp: getHippoHP(myHippo), ownerName: G.playerName },
    enemy: { ...opponent.hippo, hp: opponent.hippo.maxHp, ownerName: opponent.username },
    turn: 0, log: [], ended: false, active: false,
    abilityUsed: false, phoenixUsed: false,
  };
  renderBattle(); renderBattleActions();
}

// Called by socket event (battle_update)
function onPvPBattleUpdate(data) {
  if (!battleState) return;
  const mySide = window.pvpSide;
  battleState.player.hp = mySide === 'player1' ? data.player1_hp : data.player2_hp;
  battleState.enemy.hp = mySide === 'player1' ? data.player2_hp : data.player1_hp;
  battleState.log = data.log || battleState.log;
  battleState.turn = data.turn;
  // ability_used: server tracks per player; mirror for display
  if (data.ability_used) {
    battleState.abilityUsed = data.ability_used[mySide] || false;
  }

  // It's my turn again after server processed the opponent's action
  window.pvpMyTurn = data.your_turn;

  if (data.ended) {
    const iWon = (data.winner === 'player1' && mySide === 'player1') ||
                 (data.winner === 'player2' && mySide === 'player2');
    // ELO comes via elo_update event from socket, not here
    endBattle(iWon, true);
  } else {
    renderBattle(); renderBattleActions();
  }
}

// ========================
// BATTLE RENDER
// ========================
function renderBattle() {
  if (!battleState) return;
  const { player, enemy } = battleState;
  const pPct = Math.max(0, player.hp / player.maxHp * 100);
  const ePct = Math.max(0, enemy.hp / enemy.maxHp * 100);

  const parseArr = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  };
  const mutBadges = (muts) => parseArr(muts).map(mId => {
    const m = MUTATIONS.find(x => x.id === mId);
    return m ? `<span title="${m.desc}" style="font-size:13px">${m.emoji}</span>` : '';
  }).join('');

  const abilBadges = (abs) => parseArr(abs).map(abId => {
    const ab = ABILITIES.find(x => x.id === abId);
    return ab ? `<span title="${ab.desc}" style="font-size:13px">${ab.emoji}</span>` : '';
  }).join('');

  document.getElementById('battle-arena-box').innerHTML = `
    <div class="battle-fighters">
      <div class="fighter-side">
        <span class="fighter-emoji">${player.emoji}</span>
        <div class="fighter-name">${player.name}</div>
        <div style="font-size:10px;color:var(--accent);margin-bottom:6px">@${G.playerName}</div>
        <div class="fighter-hp-bar"><div class="fighter-hp-fill ${pPct < 30 ? 'low' : ''}" style="width:${pPct}%"></div></div>
        <div class="fighter-hp-text">${Math.max(0, Math.floor(player.hp))} / ${player.maxHp}</div>
        <div style="margin-top:5px">${mutBadges(player.mutations)} ${abilBadges(player.abilities)}</div>
        <div style="margin-top:4px">
          <span class="stat-tag str">⚔️${getHippoATK(player)}</span>
          <span class="stat-tag vit">🛡️${Math.floor((player.stats?.vit || 10) / 2)}</span>
        </div>
        ${battleState.shieldTurns > 0 ? `<div style="font-size:10px;color:#60d4f8;margin-top:3px">🧊 Щит ${battleState.shieldTurns} ход(а)</div>` : ''}
      </div>
      <div class="vs-badge">VS</div>
      <div class="fighter-side">
        <span class="fighter-emoji">${enemy.emoji}</span>
        <div class="fighter-name">${enemy.name}</div>
        <div style="font-size:10px;color:var(--danger);margin-bottom:6px">${enemy.isBoss ? '👹 БОСС' : `👤 ${enemy.ownerName || 'AI'}`}</div>
        <div class="fighter-hp-bar"><div class="fighter-hp-fill ${ePct < 30 ? 'low' : ''}" style="width:${ePct}%"></div></div>
        <div class="fighter-hp-text">${Math.max(0, Math.floor(enemy.hp))} / ${enemy.maxHp}</div>
        <div style="margin-top:5px">${mutBadges(enemy.mutations)}</div>
        <div style="margin-top:4px">
          <span class="stat-tag str">⚔️${enemy.isBoss ? enemy.atk : getHippoATK(enemy)}</span>
        </div>
      </div>
    </div>
    <div class="battle-log" id="battle-log-inner">
      ${battleState.log.slice(-25).map(e =>
        `<div class="battle-log-entry ${e.class || ''}"><span class="turn">Х${e.turn}:</span> <span>${e.text}</span></div>`
      ).join('')}
    </div>`;

  const log = document.getElementById('battle-log-inner');
  if (log) log.scrollTop = log.scrollHeight;
}

function renderBattleActions() {
  const btns = document.getElementById('battle-action-btns');
  if (!battleState || battleState.ended) {
    btns.innerHTML = `
      <button class="btn btn-primary" onclick="renderArena();document.getElementById('arena-select').style.display='grid';document.getElementById('arena-battle-view').style.display='none'">← Назад</button>
      <button class="btn btn-gold" onclick="beginFight(currentArenaMode,'bot')">🔄 Ещё раз</button>`;
    return;
  }
  if (battleState.active) {
    btns.innerHTML = '<div style="color:var(--text2);font-size:12px;display:flex;align-items:center;gap:8px"><div class="queue-spinner"></div> Бой идёт...</div>';
    return;
  }

  const myHippo = G.hippos[G.activeHippo || 0];
  const myAbilities = myHippo?.abilities || [];
  const ablHtml = myAbilities.length && !battleState.abilityUsed
    ? myAbilities.slice(0, 1).map(abId => {
        const ab = ABILITIES.find(x => x.id === abId);
        return ab ? `<button class="btn btn-gold" onclick="${battleState.isPvP ? `pvpAction('ability')` : `useAbility('${ab.id}')`}" title="${ab.desc}">${ab.emoji} ${ab.name}</button>` : '';
      }).join('')
    : (battleState.abilityUsed ? `<button class="btn btn-secondary" disabled title="Уже использована">💤 Способность</button>` : '');

  if (battleState.isPvP) {
    if (!window.pvpMyTurn) {
      btns.innerHTML = '<div style="color:var(--accent);font-size:12px;display:flex;align-items:center;gap:8px"><div class="queue-spinner"></div> ⏳ Ход противника...</div>';
    } else {
      btns.innerHTML = `
        <button class="btn btn-secondary" onclick="pvpAction('attack')">⚔️ Атака</button>
        <button class="btn btn-purple" onclick="pvpAction('heal')">💚 Лечение</button>
        <button class="btn btn-danger" onclick="pvpAction('skill')">🌀 Спецудар</button>
        ${ablHtml}`;
    }
    return;
  }

  btns.innerHTML = `
    <button class="btn btn-secondary" onclick="doPlayerAttack()">⚔️ Атака</button>
    <button class="btn btn-purple" onclick="doHeal()">💚 Лечение</button>
    <button class="btn btn-danger" onclick="doSkill()">🌀 Спецудар</button>
    ${ablHtml}
    <button class="btn btn-primary" onclick="autoBattle()">⚡ Авто</button>
    <button class="btn btn-secondary btn-sm" onclick="renderArena();document.getElementById('arena-select').style.display='grid';document.getElementById('arena-battle-view').style.display='none'">🏃 Сбежать</button>`;
}

function pvpAction(action) {
  if (!window.pvpBattleId || !window.hwSocket) return;
  if (!window.pvpMyTurn) { toast('Подожди свой ход!', 'error'); return; }
  if (action === 'ability' && battleState?.abilityUsed) { toast('Способность уже использована!', 'error'); return; }
  window.pvpMyTurn = false; // Block until server responds
  if (action === 'ability') battleState.abilityUsed = true;
  window.hwSocket.emit('battle_action', { battle_id: window.pvpBattleId, action });
  renderBattleActions();
}

// ========================
// ABILITY SYSTEM (local bot fights)
// ========================
function useAbility(abilId) {
  if (!battleState || battleState.ended || battleState.abilityUsed) return;
  const ab = ABILITIES.find(x => x.id === abilId);
  if (!ab) return;
  battleState.abilityUsed = true;
  battleState.turn++;

  const p = battleState.player, e = battleState.enemy;
  let text = '';

  switch (ab.effect.type) {
    case 'nuke': {
      const atk = getHippoATK(p);
      const dmg = Math.floor(atk * ab.effect.dmgMult);
      e.hp = Math.max(0, e.hp - dmg);
      text = `${ab.emoji} ${ab.name}: ${dmg} урона!`;
      if (ab.effect.skipNext) battleState.skipPlayerNextTurn = true;
      break;
    }
    case 'shield':
      battleState.shieldTurns = ab.effect.turns;
      battleState.shieldReduction = ab.effect.reduction;
      text = `${ab.emoji} ${ab.name}: щит на ${ab.effect.turns} хода!`;
      break;
    case 'drain': {
      const drainAmt = Math.floor(e.maxHp * ab.effect.amount);
      e.hp = Math.max(0, e.hp - drainAmt);
      p.hp = Math.min(p.maxHp, p.hp + drainAmt);
      text = `${ab.emoji} ${ab.name}: украдено ${drainAmt} HP!`;
      break;
    }
    case 'stun': {
      const atk = getHippoATK(p);
      const dmg = Math.floor(atk * ab.effect.dmgMult);
      e.hp = Math.max(0, e.hp - dmg);
      text = `${ab.emoji} ${ab.name}: ${dmg} урона`;
      if (Math.random() < ab.effect.stunChance) {
        battleState.enemyStunned = true;
        text += ' + враг ошеломлён!';
      }
      break;
    }
    case 'multistrike': {
      let totalDmg = 0;
      for (let i = 0; i < ab.effect.hits; i++) {
        const d = Math.floor(getHippoATK(p) * ab.effect.dmgMult);
        e.hp = Math.max(0, e.hp - d);
        totalDmg += d;
      }
      text = `${ab.emoji} ${ab.name}: ${ab.effect.hits} удара = ${totalDmg} урона!`;
      break;
    }
    case 'bigHeal': {
      const healAmt = Math.floor(p.maxHp * ab.effect.amount);
      p.hp = Math.min(p.maxHp, p.hp + healAmt);
      text = `${ab.emoji} ${ab.name}: +${healAmt} HP!`;
      break;
    }
    case 'execute':
      if (e.hp / e.maxHp < ab.effect.threshold) {
        e.hp = 0;
        text = `${ab.emoji} ${ab.name}: КАЗНЬ! Мгновенная смерть!`;
      } else {
        text = `${ab.emoji} ${ab.name}: HP врага выше ${Math.floor(ab.effect.threshold * 100)}%!`;
      }
      break;
    case 'revive':
      // Mark for revive on death
      battleState.phoenixAbility = ab;
      text = `${ab.emoji} ${ab.name}: готово к воскрешению!`;
      break;
    case 'extra_turn':
      text = `${ab.emoji} ${ab.name}: лишний ход!`;
      break;
    default:
      text = `${ab.emoji} ${ab.name}: активировано!`;
  }

  battleState.log.push({ turn: battleState.turn, text, class: 'critical-entry' });
  if (e.hp <= 0) { endBattle(true); return; }
  if (ab.effect.type !== 'extra_turn' && ab.effect.type !== 'shield' && ab.effect.type !== 'revive' && !battleState.skipPlayerNextTurn) {
    enemyAttack();
    if (battleState.player.hp <= 0) { endBattle(false); return; }
  }
  if (battleState.skipPlayerNextTurn) battleState.skipPlayerNextTurn = false;
  if (battleState.enemyStunned) battleState.enemyStunned = false;
  renderBattle(); renderBattleActions();
}

// ========================
// DAMAGE CALCULATION
// ========================
function calcDamage(attacker, defender, isSpecial = false) {
  const baseAtk = attacker.isBoss ? attacker.atk : getHippoATK(attacker);
  const def = defender.isBoss ? (defender.def || 0) : Math.floor((defender.stats?.vit || 10) / 2);
  const lck = attacker.stats?.lck || 10;
  const muts = attacker.mutations || [];
  const dMuts = defender.mutations || [];

  let dmg = Math.max(1, baseAtk - def * 0.35 + Math.random() * 8 - 4);
  if (isSpecial) dmg *= muts.includes('storm') ? 1.5 : 1.25;
  if (muts.includes('berserk') && attacker.hp / attacker.maxHp < 0.3) dmg *= 1.5;
  if (muts.includes('fire')) dmg *= 1.15;
  if (dMuts.includes('cursed')) dmg *= 0.9;
  if (dMuts.includes('ice')) dmg *= 0.8;

  const critChance = lck / 120 + (muts.includes('lucky') ? 0.20 : 0);
  const isCrit = Math.random() < critChance;
  if (isCrit) dmg *= 2;

  const dodgeChance = (defender.stats?.agi || 10) / 220 + (dMuts.includes('ghost') ? 0.25 : 0);
  const isMiss = Math.random() < dodgeChance;

  return { dmg: Math.max(1, Math.floor(dmg)), isCrit, isMiss };
}

function applyTurnEffects(state) {
  const p = state.player, e = state.enemy;
  if ((p.mutations || []).includes('regen')) {
    const h = Math.floor(p.maxHp * 0.05);
    p.hp = Math.min(p.maxHp, p.hp + h);
    state.log.push({ turn: state.turn, text: `💚 Регенерация +${h} HP`, class: 'heal-entry' });
  }
  if ((e.mutations || []).includes('regen')) e.hp = Math.min(e.maxHp, e.hp + Math.floor(e.maxHp * 0.05));
  if ((p.mutations || []).includes('venom') && e.hp > 0) {
    const dot = Math.max(1, Math.floor(e.maxHp * 0.08));
    e.hp -= dot;
    state.log.push({ turn: state.turn, text: `☠️ Яд → враг -${dot} HP`, class: 'hit-player' });
  }
  if ((e.mutations || []).includes('venom') && p.hp > 0) {
    const dot = Math.max(1, Math.floor(p.maxHp * 0.08));
    p.hp -= dot;
    state.log.push({ turn: state.turn, text: `☠️ Яд от врага -${dot} HP`, class: 'hit-enemy' });
  }
  if (state.shieldTurns > 0) state.shieldTurns--;
  state.hexActive = (p.mutations || []).includes('hex') && Math.random() < 0.10;
  if (state.hexActive) state.log.push({ turn: state.turn, text: '🌑 Гексаграмма! Враг пропускает ход', class: 'heal-entry' });
}

function applyHit(attacker, target, dmg, isCrit, isMiss, state, label, shieldReduction = 0) {
  if (isMiss) {
    state.log.push({ turn: state.turn, text: `${target.name} уклонился!`, class: 'heal-entry' });
    return;
  }
  let finalDmg = dmg;
  if (shieldReduction > 0) finalDmg = Math.floor(finalDmg * (1 - shieldReduction));
  target.hp = Math.max(0, target.hp - finalDmg);
  state.log.push({ turn: state.turn, text: isCrit ? `💥 КРИТ! ${label} → ${finalDmg}!` : `${label} → ${finalDmg}`, class: isCrit ? 'critical-entry' : 'hit-player' });
  if ((attacker.mutations || []).includes('vampire')) {
    const steal = Math.floor(finalDmg * 0.25);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + steal);
    state.log.push({ turn: state.turn, text: `🧛 Вампиризм +${steal} HP`, class: 'heal-entry' });
  }
  if ((target.mutations || []).includes('thorns')) {
    const ref = Math.floor(finalDmg * 0.15);
    attacker.hp = Math.max(0, attacker.hp - ref);
    state.log.push({ turn: state.turn, text: `🌵 Шипы +${ref} отражено!`, class: 'hit-enemy' });
  }
  if ((attacker.mutations || []).includes('swift') && Math.random() < 0.30) {
    const { dmg: d2, isMiss: m2 } = calcDamage(attacker, target);
    if (!m2) { target.hp = Math.max(0, target.hp - d2); state.log.push({ turn: state.turn, text: `⚡ Двойная +${d2}!`, class: 'hit-player' }); }
  }
}

function doPlayerAttack(isSpecial = false) {
  if (!battleState || battleState.ended) return;
  if (battleState.stunned) {
    battleState.stunned = false;
    battleState.log.push({ turn: battleState.turn, text: '😵 Ты был ошеломлён! Ход пропущен.', class: 'hit-enemy' });
    enemyAttack();
    renderBattle(); renderBattleActions();
    return;
  }
  battleState.turn++;
  applyTurnEffects(battleState);
  const { dmg, isCrit, isMiss } = calcDamage(battleState.player, battleState.enemy, isSpecial);
  applyHit(battleState.player, battleState.enemy, dmg, isCrit, isMiss, battleState, battleState.player.name);
  if (battleState.enemy.hp <= 0) { endBattle(true); return; }
  if (!battleState.hexActive && !battleState.enemyStunned) {
    enemyAttack();
    // Phoenix revive check
    if (battleState.player.hp <= 0 && battleState.phoenixAbility && !battleState.phoenixUsed) {
      battleState.phoenixUsed = true;
      battleState.player.hp = Math.floor(battleState.player.maxHp * 0.3);
      battleState.log.push({ turn: battleState.turn, text: '🦅 ВОСКРЕШЕНИЕ ФЕНИКСА! +30% HP!', class: 'critical-entry' });
    }
    if (battleState.player.hp <= 0) { endBattle(false); return; }
  }
  battleState.enemyStunned = false;
  renderBattle(); renderBattleActions();
}

function enemyAttack() {
  const shieldRed = battleState.shieldTurns > 0 ? battleState.shieldReduction : 0;
  const { dmg, isCrit, isMiss } = calcDamage(battleState.enemy, battleState.player);
  applyHit(battleState.enemy, battleState.player, dmg, isCrit, isMiss, battleState, battleState.enemy.name, shieldRed);
}

function doHeal() {
  if (!battleState || battleState.ended) return;
  const healAmt = Math.floor(battleState.player.maxHp * 0.2);
  battleState.player.hp = Math.min(battleState.player.maxHp, battleState.player.hp + healAmt);
  battleState.turn++;
  battleState.log.push({ turn: battleState.turn, text: `💚 Лечение +${healAmt} HP`, class: 'heal-entry' });
  enemyAttack();
  if (battleState.player.hp <= 0) { endBattle(false); return; }
  renderBattle(); renderBattleActions();
}

function doSkill() { doPlayerAttack(true); }

function autoBattle() {
  if (!battleState || battleState.ended || battleState.active) return;
  battleState.active = true; renderBattleActions();
  const iv = setInterval(() => {
    if (!battleState || battleState.ended) { clearInterval(iv); if (battleState) battleState.active = false; renderBattleActions(); return; }
    doPlayerAttack();
  }, 450);
}

// ========================
// END BATTLE
// ========================
function endBattle(won, isPvP = false) {
  if (!battleState) return;
  battleState.ended = true; battleState.active = false;
  const mode = battleState.mode;
  const isBoss = battleState.enemy?.isBoss;

  const eloEvent = WORLD_EVENTS.find(e => e.active && e.bonus === 'elo_gain');
  const coinsMult = (WORLD_EVENTS.find(e => e.active && e.bonus === 'coins')?.value) || 1;
  const xpMult = (WORLD_EVENTS.find(e => e.active && e.bonus === 'xp')?.value) || 1;

  if (won) {
    G.wins++;
    let coins = Math.floor(({casual:40, ranked:80, team:100, bounty:150}[mode] || 40) * coinsMult);
    let xp = Math.floor(({casual:60, ranked:100, boss:250}[mode] || 60) * xpMult);
    if (isBoss) { coins = 500; xp = 250; }
    G.coins += coins; addXP(xp);

    if (mode === 'ranked' && !isPvP) {
      // Bot ranked: give local ELO (server gives real ELO for PvP via elo_update socket event)
      const gain = Math.floor(18 * ((eloEvent?.value) || 1));
      G.elo += gain;
      battleState.log.push({ turn: battleState.turn + 1, text: `📈 ELO +${gain} → ${G.elo}`, class: 'critical-entry' });
      toast(`🏆 Победа! +${coins}🪙 +${gain} ELO`, 'success', 4000);
      if (G.quests[5]) G.quests[5].progress = Math.min(G.quests[5].goal, (G.quests[5].progress || 0) + 1);
    } else if (mode === 'ranked' && isPvP) {
      toast(`🏆 Победа PvP! +${coins}🪙 (ELO обновляется...)`, 'success', 4000);
    } else {
      toast(`⚔️ Победа! +${coins}🪙`, 'success');
    }

    if (Math.random() < 0.3 || isBoss) {
      const pool = ALL_ITEMS.filter(i => ['rare', 'epic', 'legendary'].includes(i.rarity));
      const item = { ...pool[Math.floor(Math.random() * pool.length)], id: 'inv_' + Date.now(), upgradeLevel: 0 };
      G.inventory.push(item);
      battleState.log.push({ turn: battleState.turn + 1, text: `🎁 Предмет: ${item.emoji} ${item.name}!`, class: 'critical-entry' });
      toast(`🎁 ${item.emoji} ${item.name} получен!`, 'legendary', 4000);
    }

    // Rare ability drop
    if (Math.random() < 0.08 || (isBoss && Math.random() < 0.4)) {
      const dropPool = ABILITIES.filter(ab => isBoss || ['rare', 'epic'].includes(ab.rarity));
      const ab = dropPool[Math.floor(Math.random() * dropPool.length)];
      const myHippo = G.hippos[G.activeHippo || 0];
      if (myHippo && !(myHippo.abilities || []).includes(ab.id) && (myHippo.abilities || []).length < 2) {
        myHippo.abilities = [...(myHippo.abilities || []), ab.id];
        battleState.log.push({ turn: battleState.turn + 1, text: `${ab.emoji} Способность: ${ab.name} разучена!`, class: 'critical-entry' });
        toast(`${ab.emoji} Новая способность: ${ab.name}!`, 'legendary', 5000);
      }
    }

    if (isBoss) G.bossCD = Date.now() + 30 * 60 * 1000;
    const h = G.hippos[G.activeHippo || 0];
    if (h) h.wins++;
    battleState.log.push({ turn: battleState.turn + 1, text: `🎉 ПОБЕДА! +${coins}🪙 +${xp}XP`, class: 'critical-entry' });
  } else {
    G.losses++;
    if (mode === 'ranked' && !isPvP) {
      const loss = 12;
      G.elo = Math.max(0, G.elo - loss);
      battleState.log.push({ turn: battleState.turn + 1, text: `📉 ELO -${loss} → ${G.elo}`, class: 'hit-enemy' });
      toast(`💀 Поражение. ELO -${loss}`, 'error');
    } else {
      toast('💀 Поражение!', 'error');
    }
    const h = G.hippos[G.activeHippo || 0];
    if (h) {
      h.losses++; h.deaths = (h.deaths || 0) + 1;
      if (h.deaths >= 20 && !h.inValhalla) {
        h.inValhalla = true; G.activeHippo = 0;
        toast(`💀 ${h.name} попал в Вальхаллу!`, 'legendary', 6000);
      }
    }
    battleState.log.push({ turn: battleState.turn + 1, text: '💀 ПОРАЖЕНИЕ.', class: 'hit-enemy' });
  }

  if (G.quests[0]) G.quests[0].progress = Math.min(G.quests[0].goal, (G.quests[0].progress || 0) + (won ? 1 : 0));
  saveGame(); updateHeader(); renderBattle(); renderBattleActions();
}

// ========================
// COLOSSEUM (balanced)
// ========================
function openColosseumModal() {
  const now = Date.now();
  const today = new Date().toDateString();
  if (!G.colosseumDate || G.colosseumDate !== today) { G.colosseumToday = 0; G.colosseumDate = today; }
  const remaining = 5 - (G.colosseumToday || 0);
  const cdLeft = G.colosseumCD > now ? fmtTime(G.colosseumCD - now) : null;

  openModal('🏟️ Колизей', `
    <div style="font-size:12px;color:var(--text2);margin-bottom:12px">
      Победи всех и забери приз. Лимит: 5 раз/день. Осталось: <strong>${remaining}</strong>
    </div>
    ${cdLeft ? `<div style="color:var(--danger);font-size:12px;margin-bottom:8px">⏰ Кд: ${cdLeft}</div>` : ''}
    ${[8, 16, 32].map(size => {
      const fee = size * 50;
      const prize = Math.floor(fee * size * 0.8);
      return `
        <div style="background:var(--bg3);border-radius:12px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">${size === 8 ? '⚔️' : size === 16 ? '🔥' : '💀'} ${size} бойцов</div>
            <div style="font-size:11px;color:var(--text2)">Взнос: 🪙${fee} | Приз: 🪙${prize}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="closeModal();startColosseum(${size})" ${(!remaining || cdLeft) ? 'disabled' : ''}>Участвовать</button>
        </div>`;
    }).join('')}`);
}

function startColosseum(size) {
  const today = new Date().toDateString();
  if (!G.colosseumDate || G.colosseumDate !== today) { G.colosseumToday = 0; G.colosseumDate = today; }
  if ((G.colosseumToday || 0) >= 5) { toast('Лимит 5 турниров в день!', 'error'); return; }
  if (G.colosseumCD > Date.now()) { toast(`Кд: ${fmtTime(G.colosseumCD - Date.now())}`, 'error'); return; }
  const fee = size * 50;
  if (G.coins < fee) { toast(`Нужно 🪙${fee}`, 'error'); return; }

  G.coins -= fee; G.colosseumToday = (G.colosseumToday || 0) + 1;
  G.colosseumCD = Date.now() + 5 * 60 * 1000;

  const ph = G.hippos[G.activeHippo || 0];
  if (!ph) { toast('Нет бойца!', 'error'); return; }

  const participants = [{ ...ph, ownerName: G.playerName, isPlayer: true }];
  for (let i = 1; i < size; i++) {
    const ai = AI_PLAYERS[i % AI_PLAYERS.length];
    participants.push({ ...generateHippo(rollRarity()), ownerName: ai.name });
  }

  let round = [...participants], allMatches = [], roundNum = 1;
  while (round.length > 1) {
    const nextRound = [], matches = [];
    for (let i = 0; i < round.length; i += 2) {
      if (i + 1 >= round.length) { nextRound.push(round[i]); continue; }
      const a = round[i], b = round[i + 1];
      const aS = getHippoHP(a) * 0.5 + getHippoATK(a) * 2 + Math.random() * 30;
      const bS = getHippoHP(b) * 0.5 + getHippoATK(b) * 2 + Math.random() * 30;
      const winner = aS >= bS ? a : b;
      matches.push({ a, b, winner }); nextRound.push(winner);
    }
    allMatches.push({ round: roundNum++, matches }); round = nextRound;
  }

  const champion = round[0], playerWon = champion.isPlayer;
  document.getElementById('arena-select').style.display = 'none';
  document.getElementById('arena-colosseum-view').style.display = 'block';

  document.getElementById('colosseum-bracket').innerHTML = allMatches.map(r => `
    <div style="font-size:10px;color:var(--text3);margin:6px 0 2px;font-weight:700">РАУНД ${r.round}</div>
    ${r.matches.map(m => `
      <div class="bracket-match">
        <span style="color:${m.winner === m.a ? 'var(--text)' : 'var(--text3)'}">${m.a.emoji} ${m.a.name}</span>
        <span class="bracket-vs">VS</span>
        <span style="color:${m.winner === m.b ? 'var(--text)' : 'var(--text3)'}">${m.b.emoji} ${m.b.name}</span>
        <span class="bracket-winner" style="color:var(--success)">→ ${m.winner.emoji} ${m.winner.name}</span>
      </div>`).join('')}`).join('');

  const prize = Math.floor(fee * size * 0.8);
  const resultDiv = document.getElementById('colosseum-result');
  if (playerWon) {
    G.coins += prize; G.wins++; addXP(size * 25);
    resultDiv.innerHTML = `<div style="text-align:center;padding:20px;background:rgba(245,158,11,0.1);border:2px solid var(--gold);border-radius:14px"><div style="font-size:48px">🏆</div><div style="font-family:var(--font-title);font-size:16px;font-weight:900;color:var(--gold)">ЧЕМПИОН! +🪙${prize}</div><div style="font-size:11px;color:var(--text3);margin-top:6px">Осталось: ${5 - G.colosseumToday}/5</div></div>`;
    toast(`🏆 Чемпион! +${prize}🪙`, 'legendary', 5000);
    if (G.quests[0]) G.quests[0].progress = Math.min(G.quests[0].goal, (G.quests[0].progress || 0) + 1);
  } else {
    resultDiv.innerHTML = `<div style="text-align:center;padding:20px;background:rgba(239,68,68,0.1);border:2px solid var(--danger);border-radius:14px"><div style="font-size:48px">💀</div><div style="font-weight:700;color:var(--danger)">Победитель: ${champion.emoji} ${champion.name}</div><div style="font-size:11px;color:var(--text3);margin-top:4px">Осталось: ${5 - G.colosseumToday}/5</div></div>`;
    toast('💀 Не в этот раз', 'error');
  }
  saveGame(); updateHeader();
}

// ========================
// BOUNTY (balanced)
// ========================
function showBountyBoard() {
  const today = new Date().toDateString();
  if (!G.bountyDate || G.bountyDate !== today) { G.bountyDaily = 0; G.bountyDate = today; G.bountyCD = {}; }
  const remaining = 10 - (G.bountyDaily || 0);
  const targets = AI_PLAYERS.map(ai => ({
    ...ai, bounty: Math.floor(ai.elo * 0.4 + 50 + Math.floor(Math.random() * 150)),
    cooldown: G.bountyCD?.[ai.name] || 0,
  }));

  openModal('🎯 Доска Баунти', `
    <div style="font-size:11px;color:var(--text2);margin-bottom:10px">Охоться за головами! Лимит 10/день. Осталось: <strong>${remaining}</strong></div>
    <div style="max-height:380px;overflow-y:auto">
      ${targets.map((t) => {
        const onCD = t.cooldown > Date.now();
        return `<div style="display:flex;align-items:center;gap:8px;padding:9px;background:var(--bg3);border-radius:10px;margin-bottom:5px;opacity:${onCD ? 0.5 : 1}">
          <span style="font-size:22px">${t.avatar}</span>
          <div style="flex:1"><div style="font-weight:700;font-size:12px">@${t.name}</div>
          <div style="font-size:10px;color:var(--text2)">ELO: ${t.elo} | 🏆 ${t.wins}W</div>
          ${onCD ? `<div style="font-size:9px;color:var(--danger)">🕐 ${fmtTime(t.cooldown - Date.now())}</div>` : ''}</div>
          <div style="text-align:right"><div style="color:var(--gold);font-weight:700;font-size:12px">🪙 ${t.bounty}</div>
          <button class="btn btn-xs btn-danger" style="margin-top:3px" onclick="huntTarget('${t.name}',${t.bounty},${t.elo})" ${(!remaining || onCD) ? 'disabled' : ''}>⚔️</button></div>
        </div>`;
      }).join('')}
    </div>`);
}

function huntTarget(targetName, bounty, targetElo) {
  const today = new Date().toDateString();
  if (!G.bountyDate || G.bountyDate !== today) { G.bountyDaily = 0; G.bountyDate = today; G.bountyCD = {}; }
  if ((G.bountyDaily || 0) >= 10) { toast('Лимит 10 охот в день!', 'error'); return; }
  closeModal();
  const winChance = Math.min(0.80, Math.max(0.25, 0.5 + (G.elo - targetElo) / 600));
  const won = Math.random() < winChance;
  G.bountyDaily = (G.bountyDaily || 0) + 1;
  if (!G.bountyCD) G.bountyCD = {};
  G.bountyCD[targetName] = Date.now() + 60 * 60 * 1000;
  if (won) {
    G.coins += bounty; G.wins++; addXP(70);
    toast(`🎯 +${bounty}🪙 поймана цель!`, 'success');
    if (G.quests[0]) G.quests[0].progress = Math.min(G.quests[0].goal, (G.quests[0].progress || 0) + 1);
  } else {
    const loss = Math.floor(bounty * 0.1);
    G.coins = Math.max(0, G.coins - loss); G.losses++;
    toast(`🎯 Цель сбежала! -${loss}🪙`, 'error');
  }
  saveGame(); updateHeader();
}
