import { jest } from '@jest/globals';
import { connectDB, closeDatabase, clearDatabase } from '../../setup.js';
import Achievement from '../../../models/Achievement.js';
import UserAchievement from '../../../models/UserAchievement.js';
import UserStats from '../../../models/UserStats.js';
import User from '../../../models/User.js';
import mongoose from 'mongoose';

// 导入要测试的控制器函数
import {
  getAllAchievements,
  getUnlockedAchievements,
  triggerAchievementCheck,
  resetAchievementsForUser,
  getUserStatistics
} from '../../../controllers/achievementController.js';

// 模拟checkAchievements.js中的函数
jest.mock('../../../utils/checkAchievements.js', () => ({
  checkAndUnlockAchievements: jest.fn().mockImplementation(async (userId) => {
    // 简单模拟成就解锁逻辑
    const stats = await UserStats.findOne({ user: userId });
    const achievements = await Achievement.find({ isEnabled: true });
    const newlyUnlocked = [];
    
    for (const ach of achievements) {
      const { type, value, op } = ach.logic || {};
      const statValue = stats[type];
      
      let isMet = false;
      if (op === 'gte' && statValue >= value) {
        isMet = true;
      }
      
      if (isMet) {
        // 检查是否已经解锁
        const existing = await UserAchievement.findOne({ 
          user: userId, 
          achievementId: ach._id 
        });
        
        if (!existing) {
          // 创建成就记录
          await UserAchievement.create({
            user: userId,
            achievementId: ach._id,
            achievementName: ach.name,
            unlockedAt: new Date()
          });
          
          // 发放奖励
          await User.updateOne(
            { _id: userId },
            {
              $inc: {
                experience: ach.reward.exp || 0,
                gold: ach.reward.coins || 0
              }
            }
          );
          
          newlyUnlocked.push({
            name: ach.name,
            reward: ach.reward
          });
        }
      }
    }
    
    return newlyUnlocked;
  })
}));

// 模拟userStatsSync.js中的函数
jest.mock('../../../utils/userStatsSync.js', () => ({
  checkIfGodAchievementUnlocked: jest.fn()
}));

// 测试用的mock请求和响应对象
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// 测试前连接测试数据库
beforeAll(async () => await connectDB());
// 每次测试后清除数据
afterEach(async () => await clearDatabase());
// 所有测试后关闭数据库
afterAll(async () => await closeDatabase());

describe('成就控制器测试', () => {
  let testUser;
  let testAchievement;
  
  beforeEach(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'achievementuser',
      email: 'achievement@example.com',
      password: 'password123',
      experience: 100,
      gold: 200
    });
    
    // 创建用户统计
    await UserStats.create({
      user: testUser._id,
      level_reach: 1,
      exp_total: 100,
      task_completed_total: 15, // 超过成就要求的10个任务
      task_edited_total: 2,
      task_deleted_total: 1,
      card_slot_total: 8,
      max_maze_level: 3
    });
    
    // 创建测试成就
    testAchievement = await Achievement.create({
      name: '任务达人',
      description: '完成10个任务',
      condition: '完成任务数量达到10个',
      points: 5,
      category: 'Cumulative',
      isHidden: false,
      reward: {
        exp: 100,
        coins: 50
      },
      isEnabled: true,
      logic: {
        type: 'task_completed_total',
        value: 10,
        op: 'gte'
      }
    });
    
    // 创建另一个成就
    await Achievement.create({
      name: '初级学者',
      description: '达到2级',
      condition: '达到2级',
      points: 10,
      category: 'Growth',
      isHidden: false,
      reward: {
        exp: 200,
        coins: 100
      },
      isEnabled: true,
      logic: {
        type: 'level_reach',
        value: 2,
        op: 'gte'
      }
    });
  });
  
  describe('getAllAchievements', () => {
    it('应该获取所有成就', async () => {
      // 先解锁一个成就
      await UserAchievement.create({
        user: testUser._id,
        achievementId: testAchievement._id,
        achievementName: testAchievement.name,
        unlockedAt: new Date()
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getAllAchievements(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const achievements = res.json.mock.calls[0][0];
      expect(achievements).toHaveLength(2);
      
      // 验证第一个成就已解锁
      const unlockedAchievement = achievements.find(a => a.name === '任务达人');
      expect(unlockedAchievement).toBeDefined();
      expect(unlockedAchievement.unlocked).toBe(true);
      expect(unlockedAchievement.unlockedAt).toBeDefined();
      
      // 验证第二个成就未解锁
      const lockedAchievement = achievements.find(a => a.name === '初级学者');
      expect(lockedAchievement).toBeDefined();
      expect(lockedAchievement.unlocked).toBe(false);
      expect(lockedAchievement.unlockedAt).toBeNull();
    });
  });
  
  describe('getUnlockedAchievements', () => {
    it('应该获取用户已解锁的成就', async () => {
      // 解锁成就
      await UserAchievement.create({
        user: testUser._id,
        achievementId: testAchievement._id,
        achievementName: testAchievement.name,
        unlockedAt: new Date()
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getUnlockedAchievements(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const unlockedAchievements = res.json.mock.calls[0][0];
      expect(unlockedAchievements).toHaveLength(1);
      expect(unlockedAchievements[0].name).toBe('任务达人');
      expect(unlockedAchievements[0].unlockedAt).toBeDefined();
    });
  });
  
  describe('triggerAchievementCheck', () => {
    it('应该检查并解锁符合条件的成就', async () => {
      // 创建请求和响应对象
      const req = {
        params: { userId: testUser._id }
      };
      const res = mockResponse();
      
      // 获取初始经验和金币
      const initialUser = await User.findById(testUser._id);
      const initialExp = initialUser.experience;
      const initialGold = initialUser.gold;
      
      // 调用函数
      await triggerAchievementCheck(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      
      // 验证用户成就已添加
      const userAchievement = await UserAchievement.findOne({
        user: testUser._id,
        achievementId: testAchievement._id
      });
      expect(userAchievement).toBeDefined();
      
      // 验证奖励已发放
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.experience).toBe(initialExp + testAchievement.reward.exp);
      expect(updatedUser.gold).toBe(initialGold + testAchievement.reward.coins);
    });
  });
  
  describe('getUserStatistics', () => {
    it('应该获取用户的统计信息', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getUserStatistics(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const statistics = res.json.mock.calls[0][0];
      expect(statistics.level_reach).toBe(1);
      expect(statistics.exp_total).toBe(100);
      expect(statistics.task_completed_total).toBe(15);
      expect(statistics.task_edited_total).toBe(2);
      expect(statistics.task_deleted_total).toBe(1);
      expect(statistics.card_slot_total).toBe(8);
      expect(statistics.max_maze_level).toBe(3);
    });
  });
}); 