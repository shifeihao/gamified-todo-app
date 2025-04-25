import { creatLevel } from "./loadLevel.js";
import { generateTestUser } from "./generateTestUser.js";
import User from "../models/User.js";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import mongoose from "mongoose";

// 连接到 MongoDB 数据库
await mongoose.connect(
  `mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
);

// 创建测试用户，并加载默认成就，载入用户统计数据
await generateTestUser();
const user = await User.findOne({ username: "testuser" });
await creatLevel(user._id);
await mongoose.disconnect();
