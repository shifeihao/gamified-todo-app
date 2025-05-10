import { generateTestUser } from "./generateTestUser.js";
import { loadDefaultAchievements } from "./loadDefaultAchievements.js";
import { createUserStat } from "./loadUserStat.js";
import User from "../models/User.js";
import UserAchievement from "../models/UserAchievement.js";

import { checkAndUnlockAchievements } from "../utils/checkAchievements.js";
import { SyncUserStats } from "../utils/userStatsSync.js";

// 连接到 MongoDB 数据库
import mongoose from "mongoose";
await mongoose.connect(
  `mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
);

// 创建测试用户，并加载默认成就，载入用户统计数据
await generateTestUser();
const user = await User.findOne({ username: "testuser" });
//加载默认成就
await loadDefaultAchievements();
//加载默认UserStat状态
await createUserStat(user._id);
console.log("准备检查成就");
//同步UserStats
await SyncUserStats(user._id);
//清空个人目前成就
await UserAchievement.deleteMany({ user: user._id });
//检查成就是否解锁
await checkAndUnlockAchievements(user._id); // 触发成就检查

//关闭连接
await mongoose.disconnect();
