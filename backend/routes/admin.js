const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { stmts, db } = require('../db/database');
const { authenticate } = require('./auth');

function adminOnly(req, res, next) {
  // Use raw DB check (not authenticate which checks ban)
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Нет авторизации' });
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'hippowars_secret_2025';
  try {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const player = stmts.getPlayerById.get(decoded.id);
    if (!player || !player.is_admin) return res.status(403).json({ error: 'Нет доступа' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Недействительный токен' }); }
}

// Stats
router.get('/stats', adminOnly, (req, res) => {
  res.json(stmts.getStats.get());
});

// All players
router.get('/players', adminOnly, (req, res) => {
  res.json(stmts.getAllPlayers.all());
});

// BAN/UNBAN — properly kicks socket
router.post('/players/:id/ban', adminOnly, (req, res) => {
  const { banned } = req.body;
  stmts.setBanned.run(banned ? 1 : 0, req.params.id);
  // Signal global io to kick
  if (req.app.get('io') && banned) {
    req.app.get('io').to(`player:${req.params.id}`).emit('banned', { reason: 'Аккаунт заблокирован администратором' });
  }
  res.json({ success: true });
});

// Set admin
router.post('/players/:id/admin', adminOnly, (req, res) => {
  const { isAdmin } = req.body;
  stmts.setAdmin.run(isAdmin ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// Give resources
router.post('/players/:id/give', adminOnly, (req, res) => {
  const { coins, gems, elo } = req.body;
  if (coins !== undefined) stmts.giveCoins.run(parseInt(coins) || 0, req.params.id);
  if (gems !== undefined) stmts.giveGems.run(parseInt(gems) || 0, req.params.id);
  if (elo !== undefined) stmts.setElo.run(parseInt(elo) || 1000, req.params.id);
  res.json({ success: true });
});

// DELETE player — cascade all related data
router.delete('/players/:id', adminOnly, (req, res) => {
  const player = stmts.getPlayerById.get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Игрок не найден' });
  if (player.is_admin) return res.status(400).json({ error: 'Нельзя удалить администратора' });
  try {
    // Temporarily disable FK checks for cascade manual cleanup
    db.exec('PRAGMA foreign_keys = OFF');
    db.prepare('DELETE FROM hippos WHERE owner_id=?').run(req.params.id);
    db.prepare('DELETE FROM inventory WHERE owner_id=?').run(req.params.id);
    db.prepare('DELETE FROM friendships WHERE player_id=? OR friend_id=?').run(req.params.id, req.params.id);
    db.prepare('DELETE FROM notifications WHERE player_id=?').run(req.params.id);
    db.prepare('DELETE FROM expeditions WHERE owner_id=?').run(req.params.id);
    db.prepare('DELETE FROM clan_members WHERE player_id=?').run(req.params.id);
    db.prepare('DELETE FROM matchmaking_queue WHERE player_id=?').run(req.params.id);
    db.prepare('DELETE FROM boss_lobbies WHERE host_id=?').run(req.params.id);
    db.prepare("UPDATE battles SET player2_id=NULL WHERE player2_id=?").run(req.params.id);
    db.prepare("UPDATE battles SET winner_id=NULL WHERE winner_id=?").run(req.params.id);
    // Update clans where this player was leader
    db.prepare("UPDATE clans SET leader_id=NULL WHERE leader_id=?").run(req.params.id);
    stmts.deletePlayer.run(req.params.id);
    db.exec('PRAGMA foreign_keys = ON');
    // Kick from socket if online
    if (req.app.get('io')) {
      req.app.get('io').to(`player:${req.params.id}`).emit('banned', { reason: 'Аккаунт удалён' });
    }
    res.json({ success: true });
  } catch (err) {
    db.exec('PRAGMA foreign_keys = ON');
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Ошибка удаления: ' + err.message });
  }
});

// Broadcast notification
router.post('/broadcast', adminOnly, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Нет сообщения' });
  const players = db.prepare('SELECT id FROM players').all();
  for (const p of players) {
    try {
      stmts.createNotification.run(uuidv4(), p.id, 'broadcast', JSON.stringify({ message, from: 'Admin' }));
    } catch {}
  }
  if (req.app.get('io')) {
    req.app.get('io').emit('broadcast_notification', { message });
  }
  res.json({ success: true, sent: players.length });
});

// Create player manually
router.post('/players', adminOnly, async (req, res) => {
  try {
    const { username, password, coins, gems, is_admin } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Нужны логин и пароль' });
    const existing = stmts.getPlayerByUsername.get(username);
    if (existing) return res.status(400).json({ error: 'Имя занято' });
    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    stmts.createPlayer.run(id, username, hash, null);
    if (coins) stmts.giveCoins.run(parseInt(coins), id);
    if (gems) stmts.giveGems.run(parseInt(gems), id);
    if (is_admin) stmts.setAdmin.run(1, id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/players/:id/hippos
router.get('/players/:id/hippos', adminOnly, (req, res) => {
  const hippos = stmts.getHipposByOwner.all(req.params.id);
  res.json(hippos.map(h => ({
    ...h,
    stats: typeof h.stats === 'string' ? JSON.parse(h.stats) : h.stats,
    mutations: typeof h.mutations === 'string' ? JSON.parse(h.mutations) : (h.mutations || []),
    abilities: typeof h.abilities === 'string' ? JSON.parse(h.abilities) : (h.abilities || []),
  })));
});

// POST /api/admin/players/:id/hippos — add hippo to player
router.post('/players/:id/hippos', adminOnly, (req, res) => {
  const { name, emoji, rarity, mutations, abilities } = req.body;
  const player = stmts.getPlayerById.get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Игрок не найден' });
  const mult = { common:1, uncommon:1.3, rare:1.7, epic:2.2, legendary:3, mythic:5 }[rarity] || 1;
  const base = 30;
  const stats = {
    str: Math.floor(base * mult), agi: Math.floor(base * mult),
    int: Math.floor(base * mult), vit: Math.floor(base * mult), lck: Math.floor(base * mult)
  };
  const hippoId = 'h_admin_' + uuidv4();
  try {
    stmts.createHippo.run(hippoId, req.params.id, name || 'АдминБег', emoji || '🦛', rarity || 'rare',
      JSON.stringify(stats), JSON.stringify(mutations || []), JSON.stringify(abilities || []),
      JSON.stringify({ weapon: null, armor: null, accessory: null, artifact: null }));
    res.json({ success: true, id: hippoId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/hippos/:id — edit hippo (stats, mutations, abilities, upgrade_count)
router.patch('/hippos/:id', adminOnly, (req, res) => {
  const hippo = stmts.getHippoById.get(req.params.id);
  if (!hippo) return res.status(404).json({ error: 'Бегемот не найден' });
  const { name, emoji, stats, mutations, abilities, upgrade_count, deaths, in_valhalla } = req.body;
  try {
    stmts.updateHippo.run(
      name || hippo.name,
      hippo.level, hippo.xp,
      deaths !== undefined ? deaths : hippo.deaths,
      hippo.wins, hippo.losses,
      upgrade_count !== undefined ? upgrade_count : (hippo.upgrade_count || 0),
      stats ? JSON.stringify(stats) : hippo.stats,
      mutations ? JSON.stringify(mutations) : hippo.mutations,
      abilities ? JSON.stringify(abilities) : (hippo.abilities || '[]'),
      hippo.equipped,
      in_valhalla !== undefined ? (in_valhalla ? 1 : 0) : hippo.in_valhalla,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/hippos/:id
router.delete('/hippos/:id', adminOnly, (req, res) => {
  try {
    stmts.deleteHippoAdmin.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
