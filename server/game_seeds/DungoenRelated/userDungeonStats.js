// seedUserDungeonStats.js
import mongoose from "mongoose";
import User from "../../models/User.js";
import { UserDungeonStats } from "../../models/UserDungeonStats.js";
import dotenv from "dotenv";

dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);

// Step 1: 找到测试用户
const user = await User.findOne({ username: "testuser" });
if (!user) {
  console.error('❌ No user named "testuser" found.');
  process.exit(1);
}

// Step 2: 删除该用户现有的所有迷宫统计数据
await UserDungeonStats.deleteMany({ user: user._id });
console.log("✅ Deleted existing dungeon stats for testuser.");

// Step 3: 创建基础迷宫统计数据（不包括职业属性）
const baseStats = {
  user: user._id,
  dungeonSlug: "echo-labyrinth", // 默认迷宫
  baseTaskLevel: 1,
  dungeonLevel: 1,
  dungeonExp: 0,
  unspentStatPoints: 0, // 初始为0，选择职业后会设置
  assignedStats: {
    // 空的属性集，需要选择职业来填充
    hp: 0,
    attack: 0,
    defense: 0,
    magicPower: 0,
    speed: 0,
    critRate: 0,
    evasion: 0,
  },
  exploredFloors: [],
  checkpointFloor: 0,
  statsBoost: {
    maxHp: 0,
    attack: 0,
    defense: 0,
  },
  Skills: [], // 空技能列表，选择职业后会填充
};

// 不设置 currentExploration 字段，因为用户需要先选择职业，然后才能开始探索

await UserDungeonStats.create(baseStats);
console.log(
  "✅ Base UserDungeonStats created for testuser (needs class selection)."
);
await mongoose.disconnect();
