import mongoose from 'mongoose';

const userDungeonStatsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dungeonSlug: { type: String, required: true }, // 可改为 Dungeon 引用

  baseTaskLevel: { type: Number, default: 1 },
  dungeonLevel: { type: Number, default: 1 },
  dungeonExp: { type: Number, default: 0 },
  unspentStatPoints: { type: Number, default: 0 },

  assignedStats: {
    hp: { type: Number, default: 0 },
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    magicPower: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    critRate: { type: Number, default: 0 },
    evasion: { type: Number, default: 0 }
  },

  exploredFloors: [Number],
  checkpointFloor: { type: Number, default: 0 },
  lastEnter: Date,

  statsBoost: {
    maxHp: { type: Number, default: 0 },
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 }
  },

  currentExploration: {
    floorIndex: { type: Number },
    mode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    currentHp: { type: Number, default: 100 }, // 后续根据角色基础 + 加点设定
    activeEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    activeMonsters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Monster' }],
    clearedMonsters: [String], // slug 或 _id，根据前端设计决定
    startTime: { type: Date, default: Date.now },
    status: {
      inCombat: { type: Boolean, default: false },
      atCheckpoint: { type: Boolean, default: false }
    }
  },

  Skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }]
}, { timestamps: true });

userDungeonStatsSchema.index({ user: 1, dungeonSlug: 1 }, { unique: true });

export const UserDungeonStats = mongoose.model('UserDungeonStats', userDungeonStatsSchema);
