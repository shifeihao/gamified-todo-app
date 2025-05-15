import { creatLevel } from "./loadLevel.js";
import { generateTestUser } from "./generateTestUser.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

// 连接到 MongoDB 数据库
dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);

// 创建测试用户，并加载默认成就，载入用户统计数据
await generateTestUser();
const user = await User.findOne({ username: "testuser" });
await creatLevel(user._id);
await mongoose.disconnect();
