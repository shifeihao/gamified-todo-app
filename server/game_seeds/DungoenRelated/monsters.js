// ✅ Final Version: seedMonsters.js with Drops Data
import mongoose from "mongoose";
import { Monster } from "../../models/Monster.js";
import { Skill } from "../../models/Skill.js";
import { ShopItem } from "../../models/ShopItem.js";

await mongoose.connect(
  "mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

// 获取现有物品ID
const existingItems = await ShopItem.find();
console.log(`Found ${existingItems.length} items in database`);

// 创建物品ID映射（按类型）
const itemsByType = {
  weapon: existingItems.filter(item => item.type === 'weapon'),
  armor: existingItems.filter(item => item.type === 'armor'),
  consumable: existingItems.filter(item => item.type === 'consumable')
};

// 辅助函数：随机获取物品ID
const getRandomItem = (type, fallbackIndex = 0) => {
  const items = itemsByType[type];
  if (items && items.length > 0) {
    return items[Math.floor(Math.random() * items.length)]._id;
  }
  // 如果没有特定类型的物品，返回任意物品
  return existingItems[fallbackIndex]?._id;
};

await Promise.all([Monster.deleteMany({})]);

const monsters = [
  // 低级怪物 (Lv 1-10)
  {
    name: "Echo Bat",
    slug: "echo-bat",
    level: 3,
    description:
      "A shadowy bat that echoes your doubts and vanishes before strikes land.",
    tags: ["bat", "psychic"],
    environmentTags: ["dark"],
    floors: [1, 2, 3, 4, 5],
    bias: {
      hp: 0.9,
      attack: 1.0,
      defense: 0.9,
      magicPower: 1.0,
      magicResist: 1.0,
      critRate: 1.2,
      evasion: 1.5,
      speed: 1.6,
    },
    // 添加掉落数据
    expDrop: 10,
    goldDrop: 3,
    itemDrops: [
      {
        item: getRandomItem('consumable', 0),
        rate: 8 // 8%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 3 // 3%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Sloth Slime",
    slug: "sloth-slime",
    level: 4,
    description:
      "A sluggish ooze that shrugs off pain and takes forever to fall.",
    tags: ["slime", "lazy"],
    environmentTags: ["wet"],
    floors: [1, 2, 3, 4, 5],
    bias: {
      hp: 1.5,
      attack: 0.9,
      defense: 1.3,
      magicPower: 0.8,
      magicResist: 1.1,
      critRate: 0.6,
      evasion: 0.7,
      speed: 0.6,
    },
    // 添加掉落数据
    expDrop: 15,
    goldDrop: 5,
    itemDrops: [
      {
        item: getRandomItem('consumable', 1),
        rate: 10 // 10%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 4 // 4%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Hollow Child",
    slug: "hollow-child",
    level: 5,
    description:
      "An emotionless phantom with eerie calm, shrugging off spells.",
    tags: ["phantom"],
    environmentTags: ["fog"],
    floors: [1, 2, 3, 4, 5],
    bias: {
      hp: 1.0,
      attack: 1.0,
      defense: 0.9,
      magicPower: 1.0,
      magicResist: 1.5,
      critRate: 1.4,
      evasion: 1.0,
      speed: 1.0,
    },
    // 添加掉落数据
    expDrop: 20,
    goldDrop: 8,
    itemDrops: [
      {
        item: getRandomItem('armor', 0),
        rate: 9 // 9%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 5 // 5%概率掉落任务卡片
      }
    ]
  },
  {
    name: "False Prophet",
    slug: "false-prophet",
    icon: "false-prophet.png",
    type: "boss",
    description:
      "A shapeless voice that mimics truth. It thrives when you hesitate.",
    level: 13,
    tags: ["deception", "psychic", "judgement"],
    environmentTags: ["echo", "void"],
    behavior: "boss-fearlogic",
    trueForm: true,
    floors: [10],

    // ⬇️ 属性根据第10层怪物提升约25~30%
    stats: {
      hp: 240,
      attack: 24,
      defense: 18,
      magicPower: 32,
      magicResist: 22,
      critRate: 0.12,
      evasion: 0.1,
      speed: 14,
    },

    // BOSS掉落
    expDrop: 120,
    goldDrop: 200,
    spawnRate: 1,
    itemDrops: [
      {
        item: getRandomItem('weapon', 0),
        rate: 50 // 50%概率掉落武器（BOSS特殊）
      },
      {
        item: getRandomItem('armor', 1),
        rate: 40 // 40%概率掉落护甲（BOSS特殊）
      },
      {
        item: getRandomItem('consumable', 2),
        rate: 60 // 60%概率掉落消耗品（BOSS特殊）
      }
    ],
    taskCardDrops: [
      {
        rate: 80 // BOSS有较高卡片掉落率（80%）
      }
    ],

    skills: ["Invert Faith", "Echo of Doubt", "Veil of Truth"],
  },

  // 中级怪物 (Lv 11–20)
  {
    name: "Dread Hound",
    slug: "dread-hound",
    level: 13,
    description: "Fear incarnate, it hunts those who hesitate or flee.",
    tags: ["beast", "fear"],
    environmentTags: ["ruins"],
    floors: [6, 7, 8, 9, 10],
    bias: {
      hp: 1.1,
      attack: 1.6,
      defense: 1.0,
      magicPower: 0.8,
      magicResist: 0.8,
      critRate: 1.2,
      evasion: 1.1,
      speed: 1.3,
    },
    // 添加掉落数据
    expDrop: 35,
    goldDrop: 15,
    itemDrops: [
      {
        item: getRandomItem('weapon', 1),
        rate: 8 // 8%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 4 // 4%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Guilt Phantom",
    slug: "guilt-phantom",
    level: 14,
    description:
      "The specter of your past mistakes takes shape and watches silently.",
    tags: ["ghost", "guilt"],
    environmentTags: ["grave"],
    floors: [6, 7, 8, 9, 10],
    bias: {
      hp: 1.0,
      attack: 1.1,
      defense: 1.0,
      magicPower: 1.3,
      magicResist: 1.4,
      critRate: 1.1,
      evasion: 1.0,
      speed: 0.9,
    },
    // 添加掉落数据
    expDrop: 40,
    goldDrop: 18,
    itemDrops: [
      {
        item: getRandomItem('armor', 2),
        rate: 9 // 9%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 5 // 5%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Shadow Doll",
    slug: "shadow-doll",
    level: 15,
    description: "A doll with no eyes and no soul, always smiling in the dark.",
    tags: ["doll", "subconscious"],
    environmentTags: ["toybox"],
    floors: [6, 7, 8, 9, 10],
    bias: {
      hp: 1.1,
      attack: 1.1,
      defense: 1.1,
      magicPower: 1.1,
      magicResist: 1.1,
      critRate: 1.0,
      evasion: 1.0,
      speed: 1.0,
    },
    // 添加掉落数据
    expDrop: 45,
    goldDrop: 20,
    itemDrops: [
      {
        item: getRandomItem('consumable', 3),
        rate: 12 // 12%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 6 // 6%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Obsession Wasp",
    slug: "obsession-wasp",
    level: 23,
    description:
      "A giant wasp that tries to pierce your mind with relentless buzzing.",
    tags: ["insect", "obsession"],
    environmentTags: ["hive"],
    floors: [11, 12, 13, 14, 15],
    bias: {
      hp: 0.9,
      attack: 1.0,
      defense: 0.9,
      magicPower: 1.6,
      magicResist: 1.1,
      critRate: 1.2,
      evasion: 1.0,
      speed: 1.2,
    },
    // 添加掉落数据
    expDrop: 70,
    goldDrop: 35,
    itemDrops: [
      {
        item: getRandomItem('weapon', 2),
        rate: 10 // 10%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 5 // 5%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Jealous Flame",
    slug: "jealous-flame",
    level: 24,
    description: "A fire that burns from envy, resisting all forms of magic.",
    tags: ["elemental", "jealousy"],
    environmentTags: ["volcano"],
    floors: [11, 12, 13, 14, 15],
    bias: {
      hp: 1.1,
      attack: 0.9,
      defense: 1.0,
      magicPower: 1.2,
      magicResist: 1.7,
      critRate: 0.9,
      evasion: 1.0,
      speed: 0.9,
    },
    // 添加掉落数据
    expDrop: 75,
    goldDrop: 40,
    itemDrops: [
      {
        item: getRandomItem('armor', 3),
        rate: 11 // 11%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 5 // 5%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Judgement Eye",
    slug: "judgement-eye",
    level: 25,
    description: "An enormous eye hidden in fog, cursing those it sees.",
    tags: ["eye", "curse"],
    environmentTags: ["mist"],
    floors: [11, 12, 13, 14, 15],
    bias: {
      hp: 1.0,
      attack: 1.2,
      defense: 1.0,
      magicPower: 1.0,
      magicResist: 1.2,
      critRate: 1.6,
      evasion: 0.9,
      speed: 0.9,
    },
    // 添加掉落数据
    expDrop: 80,
    goldDrop: 45,
    itemDrops: [
      {
        item: getRandomItem('consumable', 4),
        rate: 12 // 12%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 6 // 6%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Misery Wraith",
    slug: "misery-wraith",
    level: 33,
    description: "A floating being born from cries and lingering sorrow.",
    tags: ["wraith", "sorrow"],
    environmentTags: ["catacomb"],
    floors: [16, 17, 18, 19, 20],
    bias: {
      hp: 1.0,
      attack: 0.9,
      defense: 1.0,
      magicPower: 1.3,
      magicResist: 1.3,
      critRate: 1.1,
      evasion: 1.1,
      speed: 1.0,
    },
    // 添加掉落数据
    expDrop: 100,
    goldDrop: 60,
    itemDrops: [
      {
        item: getRandomItem('weapon', 3),
        rate: 11 // 11%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 6 // 6%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Whisper Raven",
    slug: "whisper-raven",
    level: 34,
    description: "A raven that whispers lies, disrupting your thoughts.",
    tags: ["bird", "whisper"],
    environmentTags: ["sky"],
    floors: [16, 17, 18, 19, 20],
    bias: {
      hp: 0.9,
      attack: 1.0,
      defense: 0.9,
      magicPower: 1.1,
      magicResist: 1.0,
      critRate: 1.2,
      evasion: 1.6,
      speed: 1.4,
    },
    // 添加掉落数据
    expDrop: 105,
    goldDrop: 65,
    itemDrops: [
      {
        item: getRandomItem('armor', 4),
        rate: 12 // 12%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 6 // 6%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Vile Husk",
    slug: "vile-husk",
    level: 35,
    description: "A lifeless shell that moves with disturbing awkwardness.",
    tags: ["undead", "shell"],
    environmentTags: ["ruins"],
    floors: [16, 17, 18, 19, 20],
    bias: {
      hp: 1.4,
      attack: 1.0,
      defense: 1.3,
      magicPower: 0.7,
      magicResist: 1.0,
      critRate: 0.8,
      evasion: 0.7,
      speed: 0.8,
    },
    // 添加掉落数据
    expDrop: 110,
    goldDrop: 70,
    itemDrops: [
      {
        item: getRandomItem('consumable', 1),
        rate: 13 // 13%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 6 // 6%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Rage Beast",
    slug: "rage-beast",
    level: 43,
    description: "A feral monster born of hatred, rampaging without restraint.",
    tags: ["beast", "rage"],
    environmentTags: ["cave"],
    floors: [21, 22, 23, 24, 25],
    bias: {
      hp: 1.3,
      attack: 1.7,
      defense: 1.1,
      magicPower: 0.7,
      magicResist: 0.8,
      critRate: 1.1,
      evasion: 1.0,
      speed: 1.2,
    },
    // 添加掉落数据
    expDrop: 140,
    goldDrop: 90,
    itemDrops: [
      {
        item: getRandomItem('weapon', 4),
        rate: 13 // 13%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 7 // 7%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Doubt Elemental",
    slug: "doubt-elemental",
    level: 44,
    description: "A formless energy formed from shaken faith and hesitation.",
    tags: ["elemental", "doubt"],
    environmentTags: ["void"],
    floors: [21, 22, 23, 24, 25],
    bias: {
      hp: 1.0,
      attack: 1.0,
      defense: 1.1,
      magicPower: 1.4,
      magicResist: 1.2,
      critRate: 0.9,
      evasion: 1.1,
      speed: 1.0,
    },
    // 添加掉落数据
    expDrop: 145,
    goldDrop: 95,
    itemDrops: [
      {
        item: getRandomItem('armor', 1),
        rate: 14 // 14%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 7 // 7%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Masked Knight",
    slug: "masked-knight",
    level: 45,
    description:
      "A faceless warrior whose identity is lost behind iron and silence.",
    tags: ["knight", "isolation"],
    environmentTags: ["fortress"],
    floors: [21, 22, 23, 24, 25],
    bias: {
      hp: 1.4,
      attack: 1.2,
      defense: 1.6,
      magicPower: 0.7,
      magicResist: 1.0,
      critRate: 0.8,
      evasion: 0.9,
      speed: 0.9,
    },
    // 添加掉落数据
    expDrop: 150,
    goldDrop: 100,
    itemDrops: [
      {
        item: getRandomItem('weapon', 5),
        rate: 15 // 15%概率掉落武器
      },
      {
        item: getRandomItem('armor', 5),
        rate: 10 // 10%概率掉落护甲
      }
    ],
    taskCardDrops: [
      {
        rate: 8 // 8%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Time Leech",
    slug: "time-leech",
    level: 53,
    description: "A parasite born of delay, it drains time and vitality alike.",
    tags: ["leech", "procrastination"],
    environmentTags: ["temporal"],
    floors: [26, 27, 28, 29, 30],
    bias: {
      hp: 1.0,
      attack: 1.1,
      defense: 1.0,
      magicPower: 1.2,
      magicResist: 1.3,
      critRate: 0.9,
      evasion: 1.1,
      speed: 1.1,
    },
    // 添加掉落数据
    expDrop: 170,
    goldDrop: 120,
    itemDrops: [
      {
        item: getRandomItem('consumable', 2),
        rate: 15 // 15%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 8 // 8%概率掉落任务卡片
      }
    ]
  },
  {
    name: "Silence Idol",
    slug: "silence-idol",
    level: 54,
    description:
      "A massive, motionless statue that suppresses all noise and thought.",
    tags: ["idol", "oppression"],
    environmentTags: ["temple"],
    floors: [26, 27, 28, 29, 30],
    bias: {
      hp: 1.6,
      attack: 1.0,
      defense: 1.7,
      magicPower: 0.5,
      magicResist: 1.2,
      critRate: 0.6,
      evasion: 0.6,
      speed: 0.5,
    },
    // 添加掉落数据
    expDrop: 175,
    goldDrop: 125,
    itemDrops: [
      {
        item: getRandomItem('armor', 6),
        rate: 16 // 16%概率掉落
      }
    ],
    taskCardDrops: [
      {
        rate: 8 // 8%概率掉落任务卡片
      }
    ]
  },
  {
    name: "The Whisper of Doubt",
    slug: "the-whisper-of-doubt",
    level: 55,
    description:
      "A shimmering figure who speaks truths that lead only to ruin.",
    tags: ["phantasm", "deception"],
    environmentTags: ["hallucination"],
    floors: [26, 27, 28, 29, 30],
    bias: {
      hp: 1.1,
      attack: 1.0,
      defense: 0.9,
      magicPower: 1.6,
      magicResist: 1.5,
      critRate: 1.3,
      evasion: 1.2,
      speed: 1.0,
    },
    // 添加掉落数据
    expDrop: 180,
    goldDrop: 130,
    itemDrops: [
      {
        item: getRandomItem('weapon', 6),
        rate: 17 // 17%概率掉落武器
      },
      {
        item: getRandomItem('consumable', 3),
        rate: 12 // 12%概率掉落消耗品
      }
    ],
    taskCardDrops: [
      {
        rate: 9 // 9%概率掉落任务卡片
      }
    ]
  },
];

const getSkillIds = async (names) => {
  const skills = await Skill.find({ name: { $in: names } });
  const map = Object.fromEntries(skills.map((s) => [s.name, s._id]));
  return names.map((n) => map[n]);
};

const computeStatsWithBias = (level, bias) => {
  const base = {
    hp: 80 + level * 10,
    attack: 10 + level * 1.2,
    defense: 8 + level * 1.1,
    magicPower: 5 + level,
    magicResist: 5 + level * 0.8,
    critRate: 5,
    evasion: 3,
    speed: 6 + Math.floor(level / 10),
  };

  const scale = 1 + 0.05 * 5; // baseLevel boost: 25%
  const scaled = {};
  for (const key in base) {
    const multiplier = bias?.[key] ?? 1;
    scaled[key] = Math.round(base[key] * scale * multiplier);
  }
  return scaled;
};

const sharedSkills = await getSkillIds([
  "Smash",
  "Poison Needle",
  "Precise Shot",
  "Fireball",
]);

for (const m of monsters) {
  const isBoss = m.type === "boss";

  const skillIds = m.skills
    ? await getSkillIds(m.skills)
    : sharedSkills.slice(0, 2);

  // 确保每个怪物都有掉落数据
  const monsterData = {
    name: m.name,
    slug: m.slug,
    icon: m.icon || `${m.slug}.png`,
    type: isBoss ? "boss" : "normal",
    description: m.description,
    level: m.level,
    tags: m.tags,
    trueForm: m.trueForm || false,
    stats: m.stats || computeStatsWithBias(m.level, m.bias),
    skills: skillIds,
    behavior: m.behavior || "basic",
    expDrop: m.expDrop !== undefined ? m.expDrop : Math.floor(m.level * 3.2),
    goldDrop: m.goldDrop !== undefined ? m.goldDrop : Math.floor(m.level * 2.5),
    itemDrops: m.itemDrops || [],
    taskCardDrops: m.taskCardDrops || [{ rate: 5 }], // 默认5%概率掉落任务卡片
    spawnRate: m.spawnRate || 1,
    floors: m.floors,
    environmentTags: m.environmentTags || [],
  };

  await Monster.create(monsterData);
}

console.log("✅ Monsters and Bosses seeded successfully with drop data.");
await mongoose.disconnect();