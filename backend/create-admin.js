// Run once: node create-admin.js
// Creates admin account: login=admin, password=admintest

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db, stmts } = require('./db/database');

async function createAdmin() {
  const username = 'admin';
  const password = 'admintest';

  // Check if exists
  const existing = stmts.getPlayerByUsername.get(username);
  if (existing) {
    // Update to admin
    db.prepare('UPDATE players SET is_admin=1 WHERE username=?').run(username);
    console.log('✅ admin уже существует — обновлён до is_admin=1');
    console.log('   ID:', existing.id);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  stmts.createPlayer.run(id, username, hash, 'admin@hippowars.local');
  db.prepare('UPDATE players SET is_admin=1, coins=999999, gems=99999, level=100 WHERE id=?').run(id);

  // Give starter hippo
  const hippoId = 'h_' + uuidv4();
  db.prepare(`INSERT INTO hippos (id, owner_id, name, emoji, rarity, stats, mutations, equipped) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(hippoId, id, 'АдминБег', '🦛', 'mythic',
      JSON.stringify({ str: 99, agi: 99, int: 99, vit: 99, lck: 99 }),
      JSON.stringify(['fire', 'berserk', 'vampire']),
      JSON.stringify({ weapon: null, armor: null, accessory: null, artifact: null }));

  console.log('✅ Admin создан!');
  console.log('   Логин:', username);
  console.log('   Пароль:', password);
  console.log('   ID:', id);
  console.log('   Панель: /admin');
  process.exit(0);
}

createAdmin().catch(e => { console.error(e); process.exit(1); });
