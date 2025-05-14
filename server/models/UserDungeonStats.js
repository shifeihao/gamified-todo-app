import mongoose from 'mongoose';

const userDungeonStatsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dungeonSlug: { type: String, required: true }, // 可改为 Dungeon 引用
  gender: {
    type: String,
    enum: ['male', 'female'],
    default: 'male'
  },

  baseTaskLevel: { type: Number, default: 1 },
  dungeonLevel: { type: Number, default: 1 },
  classSlug: { type: String },
  className: { type: String },
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
    currentHp: { type: Number, default: 100 },
    activeEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    activeMonsters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Monster' }],
    clearedMonsters: [String], 
    startTime: { type: Date, default: Date.now },
    status: {
      inCombat: { type: Boolean, default: false },
      atCheckpoint: { type: Boolean, default: false },
      inShop: { type: Boolean, default: false }
    }
  },

  Skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }]
}, { timestamps: true });

userDungeonStatsSchema.index({ user: 1, dungeonSlug: 1 }, { unique: true });

export const UserDungeonStats = mongoose.model('UserDungeonStats', userDungeonStatsSchema);
