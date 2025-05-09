import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  icon: { type: String }, // 对应 /Icon/Event/
  description: { type: String },
  type: {
    type: String,
    enum: ['reward', 'trap', 'story', 'shop', 'stat-change', 'summon'],
    required: true
  },
  triggerCondition: {
    type: String,
    default: 'onEnter' // 可扩展为 onKill, onLeave, afterCombat 等
  },
  chance: { type: Number, default: 1.0 }, // 出现概率

  effect: {
    gold: { type: Number, default: 0 },
    dungenonExp: { type: Number, default: 0 },
    itemDrop: [{ 
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
      rate: Number 
    }],
    statChange: {
      hp: Number,
      attack: Number,
      defense: Number
    },
    shopInventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopInventory' } // 可选，商店事件
  }
}, { timestamps: true });

export const Event = mongoose.model('Event', eventSchema);