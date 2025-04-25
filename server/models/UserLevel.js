// server/models/UserLevel.js

import mongoose from 'mongoose';

const userLevelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // 每个用户只有一条等级记录
  },
  exp: {
    type: Number,
    required: true,
    default: 0     // 当前总经验
  },
  level: {
    type: Number,
    required: true,
    default: 1     // 当前等级
  },
  nextLevelExp: {
    type: Number,
    required: true,
    default: 155   // LV1 ➜ LV2 的经验门槛
  },
  lastUpdate: {
    type: Date,
    default: Date.now  // 上次经验更新时间
  }
});

const UserLevel = mongoose.model('UserLevel', userLevelSchema);
export default UserLevel;
