import cron from 'node-cron';
import User from '../models/User.js';
import Card from '../models/Card.js';

// 每天凌晨0点重置卡片
const scheduleDailyCardReset = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('开始执行每日卡片重置...');
      
      // 获取所有用户
      const users = await User.find();
      
      for (const user of users) {
        // 创建3张空白卡片
        const blankCards = await Promise.all([...Array(3)].map(() => 
          Card.create({
            user: user._id,
            type: 'blank',
            title: '空白卡片',
            description: '可用于创建任意类型的任务',
            taskDuration: 'short', // 添加taskDuration属性，指定为短期卡片
            issuedAt: new Date()
          })
        ));
        
        // 更新用户卡片库存
        user.cardInventory.push(...blankCards.map(card => card._id));
        user.dailyCards.blank = 3;
        user.dailyCards.lastIssued = new Date();
        await user.save();
      }
      
      console.log('每日卡片重置完成');
    } catch (error) {
      console.error('每日卡片重置失败:', error);
    }
  }, {
    timezone: "Asia/Shanghai" // 使用中国时区
  });
};

// 每小时检查周期性卡片冷却
const schedulePeriodicCardCheck = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('开始检查周期性卡片冷却...');
      
      // 获取所有冷却中的周期性卡片
      const cards = await Card.find({
        type: 'periodic',
        cooldownUntil: { $lt: new Date() }
      });
      
      for (const card of cards) {
        card.cooldownUntil = null;
        await card.save();
      }
      
      console.log('周期性卡片检查完成');
    } catch (error) {
      console.error('周期性卡片检查失败:', error);
    }
  });
};

export {
  scheduleDailyCardReset,
  schedulePeriodicCardCheck
};
