import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
  },
  expRequired: {
    type: Number, // 到达该等级所需的总经验值（从 1 级加起来）
    required: true,
  },
  expSegment: {
    type: Number, // 从上一级升到该等级所需的段经验（n-1 ➜ n）
    required: true,
  },
  expToNext: {
    type: Number, // 从该等级升到下一级所需经验（n ➜ n+1）
    required: true,
  },
});

const Level = mongoose.model('Level', levelSchema);
export default Level;
