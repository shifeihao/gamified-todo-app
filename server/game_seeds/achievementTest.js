import { generateTestUser } from "./generateTestUser.js";
import { loadDefaultAchievements } from "./loadDefaultAchievements.js";
import { createUserStat } from "./loadUserStat.js";
import User from "../models/User.js";
import connectDB from "../config/db.js";

// 连接到 MongoDB 数据库
import mongoose from "mongoose";
await mongoose.connect(
  `mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
);

// 创建测试用户，并加载默认成就，载入用户统计数据
await generateTestUser();
const user = await User.findOne({ username: "testuser" });
await loadDefaultAchievements();
await createUserStat(user._id);
await mongoose.disconnect();
