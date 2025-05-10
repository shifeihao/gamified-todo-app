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
            issuedAt: new Date()
          })
        ));
        
        // 更新用户卡片库存
        user.cardInventory.push(...blankCards.map(card => card._id));
        user.dailyCards.blank = 3;
        user.dailyCards.lastIssued = new Date();
        await user.save();
      }
      
      console.log('Daily card reset completed');
    } catch (error) {
      console.error('Daily card reset failed:', error);
    }
  }, {
    timezone: "Pacific/Auckland" // 使用中国时区
  });
};

// 每小时检查周期性卡片冷却
const schedulePeriodicCardCheck = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Start checking periodic card cooling...');
      
      // 获取所有冷却中的周期性卡片
      const cards = await Card.find({
        type: 'periodic',
        cooldownUntil: { $lt: new Date() }
      });
      
      for (const card of cards) {
        card.cooldownUntil = null;
        await card.save();
      }
      
      console.log('Periodic card check completed');
    } catch (error) {
      console.error('Periodic card check failed:', error);
    }
  });
};

export {
  scheduleDailyCardReset,
  schedulePeriodicCardCheck
};
