# 🦛 HippoWars — Complete Game Documentation

## Table of Contents
1. [Game Overview](#game-overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Features](#features)
5. [API Reference](#api-reference)
6. [Game Systems](#game-systems)
7. [Deployment](#deployment)
8. [Admin Panel](#admin-panel)
9. [Bug Fixes Applied](#bug-fixes-applied)
10. [Balance Sheets](#balance-sheets)

---

## Game Overview

HippoWars is a multiplayer browser game where players collect, upgrade, and battle hippopotamus characters. Features:
- 6 rarity tiers (Common → Mythic), 15 mutations, 15 equippable abilities
- CS2-style case opening animations
- Real-time turn-based PvP (server-authoritative)
- Expeditions, Colosseum, Bounty Board, Valhalla
- Clan system, boss fights with friend lobbies
- Comprehensive admin panel

---

## Architecture

```
Backend:  Node.js + Express + Socket.IO + SQLite (node:sqlite)
Frontend: Vanilla JS + CSS, served as static files
Auth:     JWT (30-day expiry), bcrypt passwords
Realtime: Socket.IO for PvP, boss lobbies, notifications
Deploy:   Railway (or any Node.js host)
```

---

## File Structure

```
hippowars/
├── backend/
│   ├── server.js               — Main server, Socket.IO, matchmaking
│   ├── db/database.js          — SQLite schema + prepared statements
│   ├── routes/
│   │   ├── auth.js             — Register, login, /me, JWT middleware
│   │   ├── players.js          — Save, search, friends, notifications
│   │   ├── admin.js            — Admin CRUD (players, hippos, ban, delete)
│   │   ├── bossfights.js       — Boss lobby create/join/start
│   │   └── clans.js            — Clan create/join/leave/war
│   └── public/
│       ├── index.html          — Login/register screen
│       ├── game.html           — Main game UI shell
│       ├── admin.html          — Admin panel
│       ├── css/base.css        — All styles
│       └── js/
│           ├── data.js         — Game data (items, bosses, mutations, ABILITIES)
│           ├── game-core.js    — G state, save/load, XP, helpers
│           ├── world.js        — All tab rendering
│           ├── battle.js       — Combat, Colosseum, Bounty
│           └── multiplayer.js  — Socket.IO client, notification popups
```

---

## Features

### ⚡ Abilities System (NEW — 15 total)

Each hippo can equip up to **2 abilities** (active, used once per battle).

| Ability | Emoji | Effect | Rarity |
|---|---|---|---|
| Сокрушительный удар | 💥 | 250% ATK damage | Uncommon |
| Огненный шар | 🔥 | 180% + DOT burn | Rare |
| Землетрясение | 🌍 | 200% + stun | Rare |
| Ледяная стрела | ❄️ | 150% + -30% enemy def | Rare |
| Удар молнии | ⚡ | 300% + 50% crit chance | Epic |
| Смертельный яд | ☠️ | 10% max HP DOT × 3 turns | Epic |
| Мощное восстановление | 💚 | +40% max HP heal | Uncommon |
| Железный щит | 🛡️ | -60% incoming damage 2 turns | Rare |
| Вампирский укус | 🧛 | 150% + 80% lifesteal | Epic |
| Боевой клич | 📯 | +50% ATK for 3 turns | Rare |
| Шаг в тень | 👻 | 100% dodge next attack | Epic |
| Безумие | 😤 | +100% ATK, -30% def, 3 turns | Legendary |
| Остановка времени | ⏳ | Enemy skips 2 turns | Legendary |
| Метеорит | ☄️ | 400% damage, ignores defense | Mythic |
| Возрождение | 🔆 | Restore 100% HP once | Mythic |

**How to get:** Buy from hippo detail panel (costs 200–8000 coins by rarity) or drop from winning battles (8% chance, 40% from bosses).

### ⚔️ PvP Combat (Server-Authoritative Turn System)
- Only the player whose turn it is can act — server rejects all others
- Client buttons are **disabled** while waiting for server response
- `your_turn` flag returned by server after every action
- Cannot spam attacks — each action requires a full server round-trip

### 🏟️ Colosseum
- Max **5 runs per day**; 5-minute cooldown between runs
- Entry fee: 8-bracket=400🪙, 16-bracket=800🪙, 32-bracket=1600🪙
- Winner takes 80% of total prize pool

### 🎯 Bounty Board
- Max **10 hunts per day**; 1-hour cooldown **per target**
- Win chance: 25%–80% based on ELO difference
- Reward = ELO×0.4 + random; Fail = -10% bounty

---

## API Reference

### Auth
```
POST /api/auth/register  { username, password, email? }
POST /api/auth/login     { username, password }
GET  /api/auth/me        → player, hippos, inventory, expeditions
```

### Players
```
POST /api/players/save                — save game state
GET  /api/players/leaderboard?type=  — elo | wins | level
GET  /api/players/friends/list
POST /api/players/friends/add         { friend_id }  ← rate-limited 60s
POST /api/players/friends/respond     { friendship_id, action }
GET  /api/players/notifications
GET  /api/players/:id                — public profile
```

### Admin (admin token required)
```
GET    /api/admin/players
POST   /api/admin/players/:id/ban       { banned: bool }
DELETE /api/admin/players/:id           — full cascade
GET    /api/admin/players/:id/hippos
POST   /api/admin/players/:id/hippos    { name, emoji, rarity, mutations, abilities }
PATCH  /api/admin/hippos/:id            { mutations, abilities, upgrade_count, deaths, in_valhalla }
DELETE /api/admin/hippos/:id
POST   /api/admin/broadcast             { message }
```

---

## Game Systems

### Rarity & Upgrade Limits
| Rarity | Upgrade Limit | Sell Price |
|---|---|---|
| Common | 3 | 50 🪙 |
| Uncommon | 5 | 120 🪙 |
| Rare | 8 | 300 🪙 |
| Epic | 12 | 700 🪙 |
| Legendary | 18 | 1500 🪙 |
| Mythic | 25 | 6000 🪙 |

Upgrade count is **saved to the database** (`upgrade_count` column) — page refresh does NOT reset it.

### Valhalla
- Hippo enters Valhalla after 20 deaths
- Must beat 5 Valhalla bosses in order to escape
- On escape: `inValhalla = false`, **`deaths = 0`** (reset)

### ELO
| Mode | Win | Loss |
|---|---|---|
| Ranked PvP (real player) | +25 | -18 |
| Ranked vs Bot | +18 | -12 |

ELO updates are sent via `elo_update` socket event after ranked PvP.

---

## Deployment

### Environment Variables
```
PORT=3000
JWT_SECRET=your_very_secret_key_here
```

### Railway
1. Connect GitHub → Railway
2. Root directory: `backend/`
3. Start command: `node server.js`
4. Add a **Volume** at `/app` for SQLite persistence

### Local
```bash
cd hippowars/backend
npm install
node server.js
# → http://localhost:3000
```

### Default Admin
Auto-created on first start:
- **Login:** `admin`
- **Password:** `admintest`
- ⚠️ Change via admin panel immediately!

---

## Admin Panel

URL: `/admin`

### Tabs
| Tab | Function |
|---|---|
| 📊 Обзор | Server stats overview |
| 👥 Игроки | Player list, search, all actions |
| ➕ Создать | Manually create accounts |
| 📢 Рассылка | Broadcast notification to all players |
| 🌟 События | Enable/disable/create world events |

### Player Actions in Admin
- **💰** — Give coins/gems/set ELO
- **🦛** — Hippo manager: add hippos, edit mutations, abilities, upgrade count, reset deaths, delete
- **👑** — Toggle admin status
- **🚫 / ✅** — Ban / Unban (instant socket kick + blocks all API calls)
- **🗑️** — Delete account (full cascade, cannot delete admins)

### Ban Effect
When a player is banned:
- Kicked from Socket.IO immediately
- `POST /login` returns 403
- Every authenticated API request returns 403
- Cannot matchmake, save, or interact with any game system

---

## Bug Fixes Applied

| Bug | Root Cause | Fix |
|---|---|---|
| `FOREIGN KEY constraint failed` | Delete left orphaned hippo references | `PRAGMA foreign_keys = OFF` during cascade; NULL-out battle references |
| Upgrade count resets on refresh | Front-end used `h.upgradeCount` but server sent `h.upgrade_count` | Map `upgradeCount: h.upgrade_count \|\| 0` on server load |
| PvP spam / button mashing | Client controlled turns locally | Server enforces `currentTurn`; client gets `your_turn` from server |
| ELO not updating on PvP win | Client tried to update ELO locally for PvP | Server emits `elo_update` socket event; client applies delta |
| Friend request spam | No rate limiting | 60-second in-memory cooldown per sender:target pair |
| Inventory not displaying | Wrong element IDs in `renderInventory()` | Fixed all IDs to match `game.html`: `inventory-grid`, `equip-slots` |
| Boss invite invisible to friend | Frontend used invite codes | Server socket emits `boss_lobby_invited` popup + DB notification |
| Leaderboard ugly UI | Outdated rendering code | Rewritten with medals, hover effects, clickable rows |
| Valhalla escape keeps death counter | `deaths` wasn't reset | `h.deaths = 0` added on Valhalla escape |
| Delete player fails sometimes | FK violation from boss lobbies/battles | Full manual cascade with FK disabled |

---

## Balance Sheets

### Quest Rewards (Daily, 6 quests)
| Quest | Goal | Reward |
|---|---|---|
| Win battles | 5 wins | 150 🪙 |
| Open cases | 3 cases | 120 🪙 |
| Expeditions | 2 completed | 100 🪙 |
| Upgrade items | 1 upgrade | 80 🪙 |
| Daily login | Log in once | 50 🪙 + 5 💎 |
| Ranked ELO wins | 3 wins | 200 🪙 + 10 💎 |

### Item Upgrade
- Cost: `100 + upgradeLevel × 80` coins
- Base success: 60%
- Pity: +4% per failed attempt
- Guaranteed at pity 10

### World Events (admin-controlled)
| Event | Bonus Value |
|---|---|
| Expedition loot | +50% |
| ELO gain | +30% |
| Coins from battles | ×2 |
| Mutation cost | ×0.5 |
| XP gain | ×2 |
| Case price | ×0.8 (discount) |
