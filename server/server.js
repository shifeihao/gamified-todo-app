import express from "express";
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { scheduleDailyCardReset, schedulePeriodicCardCheck } from './utils/scheduler.js';
import { loadDefaultAchievements } from './utils/loadDefaultAchievements.js';


// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

// 初始化Express应用
const app = express();

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(morgan('dev')); // HTTP请求日志

// 路由
import routes from "./routes/routes.js";
app.use("/", routes);

// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/tasks', require('./routes/taskRoutes'));
// app.use('/api/cards', require('./routes/cardRoutes'));

// // 基本路由
// app.get('/', (req, res) => {
//   res.json({ message: 'API已运行' });
// });

// 错误处理中间件


// 设置端口并启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`服务器运行在端口 ${PORT}`);

  // 👇 初始化默认成就
  try {
    await loadDefaultAchievements();
    console.log('默认成就同步完成');
  } catch (e) {
    console.error('成就导入失败:', e);
  }

  // 👇 初始化定时任务
  try {
    scheduleDailyCardReset();
    schedulePeriodicCardCheck();
    console.log('定时任务初始化成功');
  } catch (error) {
    console.error('定时任务初始化失败:', error);
  }
});
