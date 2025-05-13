import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Card from '../models/Card.js';
import User from '../models/User.js';
import colors from 'colors';

// 加载环境变量
dotenv.config();

// 连接数据库
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'.cyan.bold))
  .catch(err => console.error(`Error: ${err.message}`.red.bold));

/**
 * 重置所有用户的卡片，确保每个用户有3张短期和3张长期卡片
 */
const resetAllUserCards = async () => {
  try {
    console.log('开始重置所有用户的卡片...'.yellow);
    
    // 获取所有用户
    const users = await User.find({});
    console.log(`找到 ${users.length} 个用户`.cyan);
    
    for (const user of users) {
      console.log(`处理用户 ${user.username}`.blue);
      
      // 1. 删除该用户的所有卡片
      const deletedCards = await Card.deleteMany({ user: user._id });
      console.log(`已删除 ${deletedCards.deletedCount} 张卡片`.red);
      
      // 2. 创建3张新的短期卡片
      const shortCards = await Promise.all(
        [...Array(3)].map(() =>
          Card.create({
            user: user._id,
            type: 'blank',
            title: '空白短期卡片',
            description: '每日自动发放的短期卡片',
            taskDuration: 'short',
            issuedAt: new Date(),
          })
        )
      );
      console.log(`已创建 ${shortCards.length} 张短期卡片`.green);
      
      // 3. 创建3张新的长期卡片
      const longCards = await Promise.all(
        [...Array(3)].map(() =>
          Card.create({
            user: user._id,
            type: 'blank',
            title: '空白长期卡片',
            description: '每周自动发放的长期卡片',
            taskDuration: 'long',
            issuedAt: new Date(),
          })
        )
      );
      console.log(`已创建 ${longCards.length} 张长期卡片`.green);
      
      // 4. 更新用户的卡片库存
      const allCardIds = [...shortCards, ...longCards].map(card => card._id);
      user.cardInventory = allCardIds;
      user.dailyCards = {
        blank: 3,
        lastIssued: new Date()
      };
      user.weeklyCards = {
        lastIssued: new Date()
      };
      await user.save();
      console.log(`已更新用户 ${user.username} 的卡片库存`.green);
    }
    
    console.log('所有用户卡片重置完成!'.yellow.bold);
    
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已关闭'.cyan);
    
  } catch (error) {
    console.error(`重置卡片出错: ${error.message}`.red.bold);
    // 确保出错时也断开数据库连接
    await mongoose.disconnect();
  }
};

// 执行重置
resetAllUserCards(); 