import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  scheduleDailyCardReset,
  schedulePeriodicCardCheck,
} from "./utils/scheduler.js";

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保logs目录存在
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('日志目录已创建:', logsDir);
  } catch (err) {
    console.warn('无法创建日志目录:', err.message);
  }
}

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

// 初始化Express应用
const app = express();

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(cookieParser()); // 解析 Cookie
app.use(morgan("dev")); // HTTP请求日志

// API路由
import routes from "./routes/routes.js";
app.use("/api", routes);

// 生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  // 静态文件夹
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));
  
  // 任何未匹配的路由都返回index.html
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) return; // API路由不处理
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
  
  console.log('已配置前端静态文件服务');
} else {
  // 开发环境基础路由
  app.get('/', (req, res) => {
    res.json({ message: 'API已运行' });
  });
}

// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/tasks', require('./routes/taskRoutes'));
// app.use('/api/cards', require('./routes/cardRoutes'));

// 错误处理中间件

// 设置端口并启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);

  // 👇 初始化定时任务
  try {
    scheduleDailyCardReset();
    schedulePeriodicCardCheck();
    console.log("定时任务初始化成功");
  } catch (error) {
    console.error("定时任务初始化失败:", error);
  }
});
