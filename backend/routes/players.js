const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { stmts, db } = require('../db/database');
const { authenticate } = require('./auth');

// GET /api/players/search
router.get('/search', authenticate, (req, res) => {
  const q = req.query.q?.trim();
  if (!q || q.length < 2) {
    const all = stmts.getLeaderboard.all().filter(p => p.id !== req.user.id);
    return res.json(all);
  }
  const results = stmts.searchPlayers.all(`%${q}%`).filter(p => p.id !== req.user.id);
  res.json(results);
});

// GET /api/players/leaderboard
router.get('/leaderboard', (req, res) => {
  const type = req.query.type || 'elo';
  let rows;
  if (type === 'wins') rows = stmts.getLeaderboardByWins.all();
  else if (type === 'level') rows = stmts.getLeaderboardByLevel.all();
  else rows = stmts.getLeaderboard.all();
  res.json(rows);
});

// POST /api/players/save — save game state, fix FK error
router.post('/save', authenticate, (req, res) => {
  try {
    const { player, hippos } = req.body;

    // Verify player still exists (FK guard)
    const existing = stmts.getPlayerById.get(req.user.id);
    if (!existing) return res.status(404).json({ error: 'Игрок не найден' });

    // Sanitize numeric values
    const safeInt = (v, def=0) => Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : def;

    stmts.updatePlayer.run(
      safeInt(player.level, 1), safeInt(player.xp), safeInt(player.xp_needed, 100),
      safeInt(player.coins), safeInt(player.gems), safeInt(player.elo, 1000),
      safeInt(player.wins), safeInt(player.losses),
      (player.avatar || '🦛').substring(0, 10),
      player.theme || 'default', req.user.id
    );

    if (hippos && Array.isArray(hippos)) {
      for (const h of hippos) {
        if (!h.id || !h.name) continue;
        try {
          const existingH = db.prepare('SELECT id FROM hippos WHERE id=? AND owner_id=?').get(h.id, req.user.id);
          if (existingH) {
            stmts.updateHippo.run(
              h.name, safeInt(h.level, 1), safeInt(h.xp), safeInt(h.deaths), safeInt(h.wins), safeInt(h.losses),
              safeInt(h.upgradeCount || h.upgrade_count),
              JSON.stringify(h.stats || {}), JSON.stringify(h.mutations || []),
              JSON.stringify(h.abilities || []), JSON.stringify(h.equipped || {}),
              h.inValhalla ? 1 : 0, h.id
            );
          } else {
            // Only create if no other owner has this id (prevent FK violation)
            const anyOwner = db.prepare('SELECT id FROM hippos WHERE id=?').get(h.id);
            if (!anyOwner) {
              stmts.createHippo.run(
                h.id, req.user.id, h.name, h.emoji || '🦛', h.rarity || 'common',
                JSON.stringify(h.stats || {}), JSON.stringify(h.mutations || []),
                JSON.stringify(h.abilities || []), JSON.stringify(h.equipped || {})
              );
            }
          }
        } catch (hippoErr) {
          console.warn('Hippo save skipped:', hippoErr.message);
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Save error:', err.message);
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

// POST /api/players/friends/add — prevent spam with rate limiting
const friendRequestCooldowns = new Map(); // key: sender_id:friend_id -> timestamp

router.post('/friends/add', authenticate, (req, res) => {
  const { friend_id } = req.body;
  if (!friend_id) return res.status(400).json({ error: 'friend_id обязателен' });
  if (friend_id === req.user.id) return res.status(400).json({ error: 'Нельзя добавить себя' });

  // Rate limit: 1 request per friend per 60 seconds
  const cooldownKey = `${req.user.id}:${friend_id}`;
  const lastReq = friendRequestCooldowns.get(cooldownKey);
  if (lastReq && Date.now() - lastReq < 60000) {
    return res.status(429).json({ error: 'Подожди 60 секунд перед повторной отправкой' });
  }

  const friend = stmts.getPlayerById.get(friend_id);
  if (!friend) return res.status(404).json({ error: 'Игрок не найден' });

  // Check if friendship already exists in any direction
  const existing = stmts.checkFriendship.get(req.user.id, friend_id, friend_id, req.user.id);
  if (existing) return res.status(400).json({ error: 'Запрос уже отправлен или уже друзья' });

  try {
    stmts.addFriend.run(uuidv4(), req.user.id, friend_id, req.user.id);
    friendRequestCooldowns.set(cooldownKey, Date.now());
    // Cleanup old entries every 100 requests
    if (friendRequestCooldowns.size > 1000) {
      const cutoff = Date.now() - 120000;
      for (const [k,t] of friendRequestCooldowns) { if (t < cutoff) friendRequestCooldowns.delete(k); }
    }
    try {
      stmts.createNotification.run(uuidv4(), friend_id, 'friend_request',
        JSON.stringify({ from_id: req.user.id, from_name: req.user.username }));
    } catch {}
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Уже есть запрос дружбы' });
  }
});

// GET /api/players/friends/list
router.get('/friends/list', authenticate, (req, res) => {
  const rows = stmts.getFriendships.all(req.user.id, req.user.id, req.user.id);
  res.json({ friends: rows });
});

// POST /api/players/friends/respond
router.post('/friends/respond', authenticate, (req, res) => {
  const { friendship_id, action } = req.body;
  const status = action === 'accept' ? 'accepted' : 'rejected';
  stmts.updateFriendship.run(status, friendship_id);
  res.json({ success: true });
});

// GET /api/players/notifications
router.get('/notifications', authenticate, (req, res) => {
  const notifs = stmts.getNotifications.all(req.user.id);
  res.json(notifs.map(n => {
    try { return { ...n, data: JSON.parse(n.data) }; } catch { return { ...n, data: {} }; }
  }));
});

// POST /api/players/notifications/read
router.post('/notifications/read', authenticate, (req, res) => {
  stmts.markAllNotifsRead.run(req.user.id);
  res.json({ success: true });
});

// GET /api/players/:id — public profile (must be LAST)
router.get('/:id', authenticate, (req, res) => {
  const player = stmts.getPlayerById.get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Игрок не найден' });
  const hippos = stmts.getHipposByOwner.all(player.id);
  const { password_hash, email, ...safe } = player;
  res.json({ player: safe, hippos, hippo_count: hippos.length });
});

module.exports = router;
