import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String,default: ''}, // 可选：用于前端 hover 展示
  icon: { type: String , default: ''}, // 如 'flame-sword.png'

  /** 触发条件 **/
  trigger: {
    type: String,
    enum: [
      'onStartBattle',
      'onHpBelow',
      'onAttack',
      'onDefend',
      'onReceiveHit',
      'always'
    ],
    required: true
  },
  triggerCondition: {
    // 补充触发条件细节，例如：hp < 0.35
    type: mongoose.Schema.Types.Mixed // e.g. { hpBelow: 0.35 }
  },
  allowedClasses: {
    type: [String], // 如 ['warrior', 'mage']
    default: []
  },

  /** 技能效果 **/
  effect: {
    type: String,
    enum: [
      'dealDamage',
      'gainShield',
      'heal',
      'buffAttack',
      'debuffEnemy',
      'reviveOnce'
    ],
    required: true
  },
  effectValue: { type: Number, required: true }, // 具体数值

  /** 技能控制选项 **/
  once: { type: Boolean, default: false }, // 是否仅触发一次（如仅在本场战斗中）
  cooldown: { type: Number, default: 0 }, // 单位：回合；如果为0表示无冷却
  priority: { type: Number, default: 0 }, // 同步触发时用于排序
});

export const Skill = mongoose.model('Skill', skillSchema);