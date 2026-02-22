// ========================
// GAME DATA DEFINITIONS
// ========================

const RARITIES = {
  common:    { name:'Обычный',     color:'#9ca3af', chance:45 },
  uncommon:  { name:'Необычный',   color:'#10b981', chance:28 },
  rare:      { name:'Редкий',      color:'#a855f7', chance:15 },
  epic:      { name:'Эпический',   color:'#f59e0b', chance:7  },
  legendary: { name:'Легендарный', color:'#ff6b00', chance:4  },
  mythic:    { name:'Мифический',  color:'#ff0080', chance:1  },
};

// Max upgrade level per rarity
const RARITY_UPGRADE_LIMITS = {
  common: 3, uncommon: 5, rare: 8, epic: 12, legendary: 18, mythic: 25
};

const HIPPO_NAMES = [
  // Russian
  'Тоторо','Бронзобей','Хитрован','Мамонт','Пузырь','Косматый','Гром','Ледоруб',
  'Шаман','Вихрь','Великан','Хранитель','Гоблин','Рыцарь','Тень','Призрак',
  'Маэстро','Берсерк','Молния','Стальной','Огненный','Морозный','Ядовитый','Электрик',
  'Гигант','Малыш','Пустынник','Болотник','Горный','Речной','Разрушитель','Страж',
  'Колдун','Воевода','Атаман','Купец','Кузнец','Витязь','Богатырь','Дружинник',
  'Чародей','Знахарь','Кочевник','Степняк','Скиталец','Охотник','Следопыт','Воин',
  // Kazakh
  'Аскар','Нурлан','Батыр','Хасан','Серкебай','Болат','Айдос','Мурат','Тулеген',
  'Ерлан','Бауыржан','Дамир','Санжар','Азамат','Алибек','Даурен','Кайрат','Руслан',
  // Epic names
  'Громовержец','Вихреступ','Железнобок','Огнегрив','Ледосердце','Тенебрис','Аурум',
];

const HIPPO_EMOJIS = [
  '🦛','🦏','🐘','🦬','🐗','🦣','🐃','🐂',
  '🦁','🐯','🐻','🦊','🐺','🦝','🐨','🐼',
];

// MUTATIONS
const MUTATIONS = [
  { id:'fire',    emoji:'🔥', name:'Огненная шкура',   desc:'+15% урона в атаке',      atk_bonus:0.15 },
  { id:'ice',     emoji:'❄️', name:'Ледяной панцирь',  desc:'-20% входящего урона',    def_bonus:0.20 },
  { id:'venom',   emoji:'☠️', name:'Яд',               desc:'Враг теряет 8% макс HP/ход', dot:true },
  { id:'regen',   emoji:'💚', name:'Регенерация',      desc:'Восст. 5% макс HP/ход',   regen:0.05 },
  { id:'berserk', emoji:'😤', name:'Берсерк',          desc:'+50% урон когда HP<30%',  berserk:0.5 },
  { id:'ghost',   emoji:'👻', name:'Призрак',          desc:'25% шанс уклонения',      dodge:0.25 },
  { id:'lucky',   emoji:'🍀', name:'Удачливый',        desc:'+20% шанс крит. удара',   crit_bonus:0.20 },
  { id:'vampire', emoji:'🧛', name:'Вампиризм',        desc:'25% урона превращается в HP', lifesteal:0.25 },
  { id:'giant',   emoji:'🏔️', name:'Гигант',           desc:'+80 макс. HP',             hp_bonus:80 },
  { id:'swift',   emoji:'⚡', name:'Молниеносный',     desc:'30% шанс двойной атаки',  double:0.30 },
  { id:'thorns',  emoji:'🌵', name:'Шипы',             desc:'Отражает 15% урона врагу', reflect:0.15 },
  { id:'cursed',  emoji:'💜', name:'Проклятье',        desc:'Враг атакует на -10% слабее', curse:true },
  { id:'iron',    emoji:'🔩', name:'Железная воля',    desc:'Иммунитет к крит. первые 3 хода', ironwill:true },
  { id:'storm',   emoji:'⛈️', name:'Буря',             desc:'+25% урон особой атакой', skill_bonus:0.25 },
  { id:'hex',     emoji:'🌑', name:'Гексаграмма',      desc:'10% шанс пропустить ход врага', hex:0.10 },
];

const CASES_DEF = [
  { id:'basic',     name:'Базовый кейс',       emoji:'📦', price:100,  currency:'coins',
    rarities:{common:55,uncommon:30,rare:13,epic:2,legendary:0,mythic:0},   desc:'Для новичков' },
  { id:'rare',      name:'Редкий кейс',        emoji:'🟣', price:350,  currency:'coins',
    rarities:{common:10,uncommon:40,rare:35,epic:12,legendary:3,mythic:0},  desc:'Повышен шанс редких' },
  { id:'epic',      name:'Эпический кейс',     emoji:'🟡', price:700,  currency:'coins',
    rarities:{common:0,uncommon:10,rare:40,epic:35,legendary:13,mythic:2},  desc:'Эпические гарантированы' },
  { id:'mythic',    name:'Мифический кейс',    emoji:'🌟', price:500,  currency:'gems',
    rarities:{common:0,uncommon:0,rare:10,epic:40,legendary:35,mythic:15},  desc:'Шанс мифа 15%!' },
  { id:'battle',    name:'Боевой кейс',        emoji:'⚔️', price:500,  currency:'coins',
    rarities:{common:15,uncommon:35,rare:30,epic:18,legendary:2,mythic:0},  desc:'Только бойцы' },
  { id:'mutant',    name:'Мутантский кейс',    emoji:'☢️', price:800,  currency:'coins',
    rarities:{common:0,uncommon:20,rare:40,epic:30,legendary:10,mythic:0},  desc:'Гаранти. мутация' },
  { id:'kazakh',    name:'🇰🇿 Казахский кейс', emoji:'🦅', price:1200, currency:'coins',
    rarities:{common:0,uncommon:5,rare:30,epic:40,legendary:20,mythic:5},   desc:'Только для своих!' },
  { id:'valhalla',  name:'💀 Кейс Вальхаллы',  emoji:'💀', price:200,  currency:'gems',
    rarities:{common:0,uncommon:0,rare:20,epic:45,legendary:30,mythic:5},   desc:'Тьма и сила' },
  { id:'frost',     name:'❄️ Ледяной кейс',    emoji:'❄️', price:600,  currency:'coins',
    rarities:{common:5,uncommon:25,rare:40,epic:22,legendary:8,mythic:0},   desc:'Ледяные мутации' },
  { id:'dragon',    name:'🐉 Кейс Дракона',    emoji:'🐉', price:150,  currency:'gems',
    rarities:{common:0,uncommon:5,rare:20,epic:40,legendary:28,mythic:7},   desc:'Легендарные рептилии' },
  { id:'event',     name:'🎉 Ивент кейс',       emoji:'🎉', price:75,   currency:'gems',
    rarities:{common:0,uncommon:15,rare:40,epic:30,legendary:14,mythic:1},  desc:'Лимитированный!' },
  { id:'premium',   name:'💎 Премиум кейс',    emoji:'💎', price:250,  currency:'gems',
    rarities:{common:0,uncommon:0,rare:5,epic:35,legendary:45,mythic:15},   desc:'Только лучшее' },
];

// WEAPONS (20 items)
const WEAPONS = [
  { id:'w1',  name:'Деревянная дубина',    emoji:'🪵', type:'weapon', bonus:{str:3},              price:80,   rarity:'common'    },
  { id:'w2',  name:'Костяная дубина',      emoji:'🦴', type:'weapon', bonus:{str:5,vit:2},        price:130,  rarity:'common'    },
  { id:'w3',  name:'Железный меч',         emoji:'⚔️', type:'weapon', bonus:{str:8},              price:200,  rarity:'uncommon'  },
  { id:'w4',  name:'Боевой топор',         emoji:'🪓', type:'weapon', bonus:{str:10,agi:-2},      price:250,  rarity:'uncommon'  },
  { id:'w5',  name:'Магический посох',     emoji:'🪄', type:'weapon', bonus:{int:10,str:3},       price:380,  rarity:'rare'      },
  { id:'w6',  name:'Лук степного кочевника',emoji:'🏹',type:'weapon', bonus:{agi:10,str:5},       price:420,  rarity:'rare'      },
  { id:'w7',  name:'Кинжал яда',          emoji:'🗡️', type:'weapon', bonus:{str:8,lck:6},        price:500,  rarity:'rare'      },
  { id:'w8',  name:'Клинок теней',         emoji:'🌑', type:'weapon', bonus:{str:15,agi:8},       price:700,  rarity:'epic'      },
  { id:'w9',  name:'Огненный меч',         emoji:'🔥', type:'weapon', bonus:{str:18,int:5},       price:850,  rarity:'epic'      },
  { id:'w10', name:'Ледяное копьё',        emoji:'🧊', type:'weapon', bonus:{str:16,vit:8},       price:900,  rarity:'epic'      },
  { id:'w11', name:'Молот Грома',          emoji:'⚡', type:'weapon', bonus:{str:25,vit:5},       price:1400, rarity:'legendary' },
  { id:'w12', name:'Серп Луны',            emoji:'🌙', type:'weapon', bonus:{str:22,lck:12},      price:1600, rarity:'legendary' },
  { id:'w13', name:'Посох Бури',           emoji:'🌪️', type:'weapon', bonus:{int:20,str:15},      price:1800, rarity:'legendary' },
  { id:'w14', name:'Клыки Вальхаллы',     emoji:'🦷', type:'weapon', bonus:{str:35,lck:10},      price:3200, rarity:'mythic'    },
  { id:'w15', name:'Хаос-Клинок',         emoji:'💀', type:'weapon', bonus:{str:40,agi:15},      price:4000, rarity:'mythic'    },
];

// ARMORS (12 items)
const ARMORS = [
  { id:'a1',  name:'Тростниковый доспех',  emoji:'🌿', type:'armor', bonus:{vit:5},              price:80,   rarity:'common'    },
  { id:'a2',  name:'Деревянный щит',       emoji:'🛡️', type:'armor', bonus:{vit:7,str:-1},        price:120,  rarity:'common'    },
  { id:'a3',  name:'Кожаный нагрудник',    emoji:'🥋', type:'armor', bonus:{vit:12},              price:200,  rarity:'uncommon'  },
  { id:'a4',  name:'Кольчуга',             emoji:'⛓️', type:'armor', bonus:{vit:16,agi:-2},       price:320,  rarity:'uncommon'  },
  { id:'a5',  name:'Стальная броня',       emoji:'🔩', type:'armor', bonus:{vit:22,str:4},        price:450,  rarity:'rare'      },
  { id:'a6',  name:'Чешуя дракона',        emoji:'🐉', type:'armor', bonus:{vit:30,agi:6},        price:750,  rarity:'epic'      },
  { id:'a7',  name:'Призрачная мантия',    emoji:'👻', type:'armor', bonus:{vit:20,lck:10},       price:800,  rarity:'epic'      },
  { id:'a8',  name:'Огненный нагрудник',   emoji:'🔥', type:'armor', bonus:{vit:28,str:6},        price:900,  rarity:'epic'      },
  { id:'a9',  name:'Мифрил',               emoji:'💙', type:'armor', bonus:{vit:45,int:8},        price:1800, rarity:'legendary' },
  { id:'a10', name:'Астральный панцирь',   emoji:'✨', type:'armor', bonus:{vit:50,agi:10},       price:2000, rarity:'legendary' },
  { id:'a11', name:'Доспех Бездны',        emoji:'🌑', type:'armor', bonus:{vit:70,str:15},       price:3500, rarity:'mythic'    },
  { id:'a12', name:'Шкура Отца Бегемотов', emoji:'🦛', type:'armor', bonus:{vit:80,lck:20},      price:5000, rarity:'mythic'    },
];

// ACCESSORIES (12 items)
const ACCESSORIES = [
  { id:'ac1',  name:'Удачливый амулет',    emoji:'🍀', type:'accessory', bonus:{lck:8},            price:100,  rarity:'uncommon' },
  { id:'ac2',  name:'Кольцо ловкача',      emoji:'💍', type:'accessory', bonus:{agi:8},            price:150,  rarity:'uncommon' },
  { id:'ac3',  name:'Пояс силы',           emoji:'🎗️', type:'accessory', bonus:{str:6,vit:4},      price:200,  rarity:'uncommon' },
  { id:'ac4',  name:'Корона шамана',       emoji:'👑', type:'accessory', bonus:{int:12,lck:5},     price:450,  rarity:'rare'     },
  { id:'ac5',  name:'Ожерелье дракона',    emoji:'🐉', type:'accessory', bonus:{str:8,vit:6},      price:520,  rarity:'rare'     },
  { id:'ac6',  name:'Перо Хумай',          emoji:'🪶', type:'accessory', bonus:{agi:15,lck:8},     price:850,  rarity:'epic'     },
  { id:'ac7',  name:'Маска Анубиса',       emoji:'🦅', type:'accessory', bonus:{int:18,lck:10},    price:900,  rarity:'epic'     },
  { id:'ac8',  name:'Браслет молнии',      emoji:'⚡', type:'accessory', bonus:{agi:20,str:8},     price:1000, rarity:'epic'     },
  { id:'ac9',  name:'Печать Богов',        emoji:'🔮', type:'accessory', bonus:{int:25,str:10},    price:1800, rarity:'legendary'},
  { id:'ac10', name:'Кольцо Хаоса',        emoji:'🌀', type:'accessory', bonus:{lck:25,agi:12},    price:2200, rarity:'legendary'},
  { id:'ac11', name:'Амулет Вальхаллы',    emoji:'💀', type:'accessory', bonus:{str:20,vit:20,lck:15},price:4000,rarity:'mythic'},
  { id:'ac12', name:'Корона Мифика',       emoji:'⭐', type:'accessory', bonus:{int:30,lck:30},    price:5000, rarity:'mythic'   },
];

// ARTIFACTS (10 items)
const ARTIFACTS = [
  { id:'art1',  name:'Кристалл силы',      emoji:'🔮', type:'artifact', bonus:{str:5,vit:5},       price:200,  rarity:'rare'      },
  { id:'art2',  name:'Кристалл ловкости',  emoji:'💠', type:'artifact', bonus:{agi:7,lck:4},       price:250,  rarity:'rare'      },
  { id:'art3',  name:'Сердце бури',        emoji:'⛈️', type:'artifact', bonus:{str:10,agi:6},      price:550,  rarity:'epic'      },
  { id:'art4',  name:'Осколок вулкана',    emoji:'🌋', type:'artifact', bonus:{str:12,int:5},      price:600,  rarity:'epic'      },
  { id:'art5',  name:'Лёд Арктики',        emoji:'🧊', type:'artifact', bonus:{vit:15,agi:5},      price:650,  rarity:'epic'      },
  { id:'art6',  name:'Глаз бездны',        emoji:'👁️', type:'artifact', bonus:{int:15,lck:10},     price:1100, rarity:'legendary' },
  { id:'art7',  name:'Звезда Хаоса',       emoji:'⭐', type:'artifact', bonus:{str:15,int:10},     price:1300, rarity:'legendary' },
  { id:'art8',  name:'Сердце Феникса',     emoji:'🦅', type:'artifact', bonus:{vit:20,lck:15},     price:1500, rarity:'legendary' },
  { id:'art9',  name:'Сферa Мифика',       emoji:'🌟', type:'artifact', bonus:{str:25,vit:25},     price:4000, rarity:'mythic'    },
  { id:'art10', name:'Орб Хаоса',          emoji:'🌀', type:'artifact', bonus:{int:30,lck:20,str:15},price:5500,rarity:'mythic'  },
];

const ALL_ITEMS = [...WEAPONS, ...ARMORS, ...ACCESSORIES, ...ARTIFACTS];

const REGIONS = [
  { id:'savanna',   name:'Саванна',          emoji:'🌿', desc:'Лёгкие монстры',          level:1,  pvp:false, king:null },
  { id:'swamp',     name:'Болото',            emoji:'🌊', desc:'Средняя сложность',       level:5,  pvp:false, king:null },
  { id:'desert',    name:'Пустыня',           emoji:'🏜️', desc:'Жара, зато золото!',      level:8,  pvp:true,  king:null },
  { id:'volcano',   name:'Вулкан',            emoji:'🌋', desc:'Огненные боссы',          level:15, pvp:true,  king:null },
  { id:'tundra',    name:'Тундра',            emoji:'🏔️', desc:'Ледяной лут',             level:12, pvp:false, king:null },
  { id:'jungle',    name:'Джунгли',           emoji:'🌴', desc:'Мутанты, PvP зона',       level:10, pvp:true,  king:null },
  { id:'ruins',     name:'Древние руины',     emoji:'🏛️', desc:'Монстры + артефакты',     level:20, pvp:false, king:null },
  { id:'voidland',  name:'Земля Пустоты',     emoji:'🌑', desc:'Только топы. Мифика шанс',level:30, pvp:true,  king:null },
  { id:'steppe',    name:'🇰🇿 Великая степь', emoji:'🌾', desc:'Родная земля',            level:1,  pvp:true,  king:null },
  { id:'mountains', name:'Алтай',             emoji:'⛰️', desc:'Сокровища в пещерах',     level:7,  pvp:false, king:null },
  { id:'sea',       name:'Каспийское море',   emoji:'🐋', desc:'Морские чудовища',        level:15, pvp:true,  king:null },
  { id:'forest',    name:'Сибирский лес',     emoji:'🌲', desc:'Медведи vs бегемоты',     level:6,  pvp:false, king:null },
];

const BOSSES = [
  { id:'b1', name:'Кракен',          emoji:'🦑', hp:1500,  atk:60,  def:25,  xp:300,  loot:'epic',      coins:300,  level:5  },
  { id:'b2', name:'Огненный Феникс', emoji:'🦅', hp:2500,  atk:85,  def:40,  xp:500,  loot:'legendary', coins:600,  level:15 },
  { id:'b3', name:'Ледяной Дракон',  emoji:'🐉', hp:4000,  atk:110, def:60,  xp:800,  loot:'legendary', coins:1000, level:25 },
  { id:'b4', name:'Тьма Вальхаллы', emoji:'💀', hp:7000,  atk:150, def:90,  xp:1500, loot:'mythic',    coins:2000, level:40 },
  { id:'b5', name:'Отец Бегемотов',  emoji:'🦛', hp:15000, atk:250, def:180, xp:5000, loot:'mythic',    coins:5000, level:99 },
];

const VALHALLA_BOSSES = [
  { id:'vb1', name:'Страж Врат',     emoji:'🗡️', hp:400,  atk:45,  def:20,  coins:150, xp:80  },
  { id:'vb2', name:'Демон Тени',     emoji:'👹', hp:700,  atk:75,  def:40,  coins:300, xp:150 },
  { id:'vb3', name:'Великан Тьмы',   emoji:'🏔️', hp:1200, atk:110, def:65,  coins:600, xp:250 },
  { id:'vb4', name:'Владыка Хаоса',  emoji:'🌀', hp:1800, atk:145, def:90,  coins:1000,xp:400 },
  { id:'vb5', name:'Один',           emoji:'⚡', hp:3500, atk:220, def:160, coins:2500,xp:1000},
];

// ========================
// ABILITIES — equippable active skills (one per hippo, once per battle)
// ========================
const ABILITIES = [
  { id:'ab_firestorm',    emoji:'🔥', name:'Огненный Шторм',      desc:'Наносит 3x урон, но пропускает следующий ход',    rarity:'rare',      cost_gems:30,
    effect:{ type:'nuke', dmgMult:3, skipNext:true } },
  { id:'ab_iceshield',    emoji:'🧊', name:'Ледяной Щит',         desc:'Блокирует 50% урона 2 хода',                      rarity:'rare',      cost_gems:25,
    effect:{ type:'shield', reduction:0.5, turns:2 } },
  { id:'ab_blooddrain',   emoji:'🩸', name:'Выкачать Кровь',      desc:'Крадёт 40% HP противника',                        rarity:'epic',      cost_gems:60,
    effect:{ type:'drain', amount:0.4 } },
  { id:'ab_thunderstrike',emoji:'⚡', name:'Удар Грома',          desc:'2x урон + шанс ошеломить (пропуск хода)',         rarity:'epic',      cost_gems:55,
    effect:{ type:'stun', dmgMult:2, stunChance:0.4 } },
  { id:'ab_berserkrush',  emoji:'😤', name:'Берсерк Раш',         desc:'3 атаки подряд, каждая слабее',                   rarity:'epic',      cost_gems:65,
    effect:{ type:'multistrike', hits:3, dmgMult:0.7 } },
  { id:'ab_holylight',    emoji:'✨', name:'Святой Свет',         desc:'Лечит 50% HP и снимает все дебаффы',              rarity:'legendary', cost_gems:100,
    effect:{ type:'bigHeal', amount:0.5 } },
  { id:'ab_shadowstep',   emoji:'👻', name:'Шаг в Тень',          desc:'Уклоняется от следующей атаки + контратака',      rarity:'legendary', cost_gems:120,
    effect:{ type:'dodge_counter', dmgMult:1.5 } },
  { id:'ab_ragnarok',     emoji:'💥', name:'Рагнарёк',            desc:'Мгновенно убивает если HP врага < 30%',           rarity:'mythic',    cost_gems:200,
    effect:{ type:'execute', threshold:0.3 } },
  { id:'ab_phoenix',      emoji:'🦅', name:'Возрождение Феникса', desc:'Воскрешает с 30% HP (раз за бой)',                rarity:'mythic',    cost_gems:250,
    effect:{ type:'revive', amount:0.3 } },
  { id:'ab_timewarp',     emoji:'⏳', name:'Изгиб Времени',       desc:'Даёт лишний ход в этом раунде',                   rarity:'mythic',    cost_gems:180,
    effect:{ type:'extra_turn' } },
];

const ABILITY_RARITIES = { uncommon:'Необычный', rare:'Редкий', epic:'Эпический', legendary:'Легендарный', mythic:'Мифический' };

const AI_PLAYERS = [
  { name:'СтальнойМамонт_kz',  elo:1200, wins:45,  losses:12, avatar:'🦣' },
  { name:'БегемотМастер',       elo:980,  wins:30,  losses:25, avatar:'🦛' },
  { name:'КочевникАли',         elo:1450, wins:88,  losses:20, avatar:'🐘' },
  { name:'ДжунглиБой',          elo:750,  wins:15,  losses:40, avatar:'🦬' },
  { name:'АрктикМедведь',       elo:1100, wins:55,  losses:30, avatar:'🐻' },
  { name:'ЗлойВулкан',          elo:1600, wins:120, losses:35, avatar:'🦁' },
  { name:'ЛедяноеСердце',       elo:890,  wins:22,  losses:28, avatar:'🐯' },
  { name:'КурыльщикТабака',     elo:500,  wins:5,   losses:50, avatar:'🐗' },
  { name:'ТигрСаванны',         elo:1300, wins:70,  losses:22, avatar:'🦊' },
  { name:'НинзяСтепи',          elo:1050, wins:40,  losses:35, avatar:'🐺' },
  { name:'ОгненныйДух',         elo:1750, wins:200, losses:50, avatar:'🦅' },
  { name:'БурыйОхотник',        elo:670,  wins:18,  losses:42, avatar:'🦝' },
  { name:'СеверныйВолк',        elo:1380, wins:95,  losses:30, avatar:'🐺' },
  { name:'ЗолотойСтеп',         elo:1520, wins:110, losses:28, avatar:'🦬' },
  { name:'ДикийБатыр',          elo:920,  wins:35,  losses:38, avatar:'🦛' },
];

// World events (can be managed from admin panel)
let WORLD_EVENTS = [
  { id:'e1', emoji:'🌋', text:'Вулкан активен! +50% лута из экспедиций', color:'#ff6b00', active:true,  bonus:'expedition_loot', value:1.5 },
  { id:'e2', emoji:'⚔️', text:'Боевой Weekend! +30% ELO за победы',      color:'#ef4444', active:false, bonus:'elo_gain',        value:1.3 },
  { id:'e3', emoji:'💰', text:'Двойные монеты из боёв!',                  color:'#f59e0b', active:false, bonus:'coins',           value:2.0 },
  { id:'e4', emoji:'🔮', text:'Мутации дешевле вдвое (25💎)',             color:'#a855f7', active:true,  bonus:'mutation_cost',   value:0.5 },
  { id:'e5', emoji:'🌟', text:'Двойной опыт весь день!',                  color:'#10b981', active:false, bonus:'xp',              value:2.0 },
  { id:'e6', emoji:'📦', text:'Кейсы со скидкой 20%!',                   color:'#60d4f8', active:false, bonus:'case_discount',   value:0.8 },
  { id:'e7', emoji:'🏆', text:'Сезон 1 заканчивается через 3 дня',        color:'var(--accent)', active:true, bonus:null,         value:1   },
];

const DEMO_CLANS = [
  { id:'c1', name:'Степные Воины',   emoji:'🐺', power:15000, members:8,  leader:'КочевникАли',    war:true  },
  { id:'c2', name:'Железная Орда',   emoji:'⚔️', power:22000, members:12, leader:'ЗлойВулкан',     war:true  },
  { id:'c3', name:'Речные Духи',     emoji:'🌊', power:8000,  members:5,  leader:'БолотникSam',    war:false },
  { id:'c4', name:'Огненная Степь',  emoji:'🔥', power:18000, members:10, leader:'ОгненныйДух',    war:true  },
  { id:'c5', name:'Ледяные Стражи',  emoji:'❄️', power:12000, members:7,  leader:'ЛедяноеСердце',  war:false },
];
