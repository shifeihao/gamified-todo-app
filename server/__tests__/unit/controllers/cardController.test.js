import { jest } from '@jest/globals';
import { connectDB, closeDatabase, clearDatabase } from '../../setup.js';
import Card from '../../../models/Card.js';
import User from '../../../models/User.js';
import mongoose from 'mongoose';

// 导入要测试的控制器函数
import { getCardInventory, issueDailyCards, issueWeeklyCards } from '../../../controllers/cardController.js';

// 模拟asyncHandler
jest.mock('express-async-handler', () => (fn) => fn);

// 测试用的mock请求和响应对象
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// 禁用控制台输出
beforeAll(() => {
  // 保存原始控制台方法
  global.originalConsoleLog = console.log;
  global.originalConsoleError = console.error;
  
  // 替换为空函数
  console.log = jest.fn();
  console.error = jest.fn();
  
  // 连接测试数据库
  return connectDB();
});

// 每次测试后清除数据
afterEach(async () => await clearDatabase());

// 所有测试后关闭数据库并恢复控制台输出
afterAll(async () => {
  // 恢复原始控制台方法
  console.log = global.originalConsoleLog;
  console.error = global.originalConsoleError;
  
  // 关闭数据库连接
  await closeDatabase();
});

describe('卡片控制器测试', () => {
  // 创建测试用户和相关数据
  let testUser;
  
  beforeEach(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'carduser',
      email: 'card@example.com',
      password: 'password123',
      cardInventory: [],
      dailyCards: {
        blank: 0,
        lastIssued: null
      },
      weeklyCards: {
        lastIssued: null
      }
    });
  });
  
  describe('getCardInventory', () => {
    it('首次访问应自动发放每日卡片', async () => {
      // 不再mock Card.create，直接使用真实的方法
      
      // 创建请求和响应对象
      const req = {
        user: { id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getCardInventory(req, res);
      
      // 验证响应
      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      
      // 验证每日卡片发放状态
      expect(responseData.dailyCards.blank).toBe(3);
      expect(responseData.dailyCards.lastIssued).toBeDefined();
      
      // 验证库存中包含卡片
      expect(responseData.inventory.length).toBeGreaterThan(0);
      
      // 验证数据库中已创建卡片
      const cards = await Card.find({ user: testUser._id });
      expect(cards.length).toBeGreaterThan(0);
    });
    
    it('同一天再次访问不应重复发放每日卡片', async () => {
      // 先设置用户已经领取过每日卡片
      const today = new Date();
      await User.findByIdAndUpdate(testUser._id, {
        'dailyCards.lastIssued': today,
        'dailyCards.blank': 3
      });
      
      // 创建几张已有的短期卡片
      const existingCards = await Promise.all([...Array(3)].map(() => 
        Card.create({
          user: testUser._id,
          type: 'blank',
          title: '现有短期卡片',
          taskDuration: 'short',
          issuedAt: today
        })
      ));
      
      // 更新用户卡片库存
      await User.findByIdAndUpdate(testUser._id, {
        cardInventory: existingCards.map(card => card._id)
      });
      
      // 创建请求和响应对象
      const req = {
        user: { id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getCardInventory(req, res);
      
      // 验证响应
      expect(res.json).toHaveBeenCalled();
      
      // 验证没有创建新卡片
      const cards = await Card.find({ user: testUser._id });
      expect(cards).toHaveLength(3); // 仍然只有3张初始卡片
    });
    
    it('周一访问应自动发放每周卡片', async () => {
      // 模拟今天是周一
      const mockMonday = new Date();
      mockMonday.setDate(mockMonday.getDate() - mockMonday.getDay() + 1); // 设置为本周一
      const originalDate = Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate(mockMonday);
          }
          return new originalDate(...args);
        }
        getDay() {
          if (this.toString() === new originalDate(mockMonday).toString()) {
            return 1; // 周一
          }
          return super.getDay();
        }
      };
      
      // 创建请求和响应对象
      const req = {
        user: { id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getCardInventory(req, res);
      
      // 验证响应
      const responseData = res.json.mock.calls[0][0];
      
      // 验证每周卡片发放状态
      expect(responseData.weeklyCards.lastIssued).toBeDefined();
      
      // 恢复原始Date方法
      global.Date = originalDate;
      
      // 验证数据库中已创建卡片
      const cards = await Card.find({ user: testUser._id });
      expect(cards.length).toBeGreaterThan(0);
    });
  });
  
  describe('issueDailyCards', () => {
    it('应该发放每日卡片', async () => {
      // 创建请求和响应对象
      const req = {
        user: { id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await issueDailyCards(req, res);
      
      // 验证响应
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].message).toContain('每日卡片发放成功');
      expect(res.json.mock.calls[0][0].cards.length).toBeGreaterThan(0);
      
      // 验证数据库中已创建卡片
      const cards = await Card.find({ user: testUser._id });
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0].type).toBe('blank');
      
      // 验证用户数据已更新
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.dailyCards.blank).toBe(3);
      expect(updatedUser.dailyCards.lastIssued).toBeDefined();
      expect(updatedUser.cardInventory.length).toBeGreaterThan(0);
    });
    
    it('同一天重复请求应返回错误', async () => {
      // 先设置用户已经领取过每日卡片
      const today = new Date();
      await User.findByIdAndUpdate(testUser._id, {
        'dailyCards.lastIssued': today,
        'dailyCards.blank': 3
      });
      
      // 创建请求和响应对象
      const req = {
        user: { id: testUser._id }
      };
      const res = mockResponse();
      
      // 模拟抛出异常
      const errorFn = jest.fn();
      try {
        await issueDailyCards(req, res);
      } catch (error) {
        errorFn(error.message);
      }
      
      // 验证状态码和异常
      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorFn).toHaveBeenCalledWith('今日卡片已发放');
    });
  });
  
  describe('issueWeeklyCards', () => {
    it('非周一请求应返回错误', async () => {
      // 模拟今天不是周一
      const mockTuesday = new Date();
      mockTuesday.setDate(mockTuesday.getDate() - mockTuesday.getDay() + 2); // 设置为本周二
      const originalDate = Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate(mockTuesday);
          }
          return new originalDate(...args);
        }
        getDay() {
          if (this.toString() === new originalDate(mockTuesday).toString()) {
            return 2; // 周二
          }
          return super.getDay();
        }
      };
      
      // 创建请求和响应对象
      const req = {
        user: { id: testUser._id }
      };
      const res = mockResponse();
      
      // 模拟抛出异常
      const errorFn = jest.fn();
      try {
        await issueWeeklyCards(req, res);
      } catch (error) {
        errorFn(error.message);
      }
      
      // 验证状态码和异常 - 使用实际的错误消息
      expect(res.status).toHaveBeenCalledWith(400);
      expect(errorFn).toHaveBeenCalledWith('Today is not the time to send Long-term cards (Monday only).');
      
      // 恢复原始Date对象
      global.Date = originalDate;
    });
    
    it('周一访问应发放每周卡片', async () => {
      // 模拟今天是周一
      const mockMonday = new Date();
      mockMonday.setDate(mockMonday.getDate() - mockMonday.getDay() + 1); // 设置为本周一
      const originalDate = Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate(mockMonday);
          }
          return new originalDate(...args);
        }
        getDay() {
          if (this.toString() === new originalDate(mockMonday).toString()) {
            return 1; // 周一
          }
          return super.getDay();
        }
      };
      
      // 创建请求和响应对象
      const req = {
        user: { id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await issueWeeklyCards(req, res);
      
      // 验证响应
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      // 使用实际的消息
      expect(res.json.mock.calls[0][0].message).toContain('本周长期空白卡片发放成功');
      expect(res.json.mock.calls[0][0].cards.length).toBeGreaterThan(0);
      
      // 验证数据库中已创建卡片
      const cards = await Card.find({ user: testUser._id });
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0].type).toBe('blank');
      
      // 验证用户数据已更新
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.weeklyCards.lastIssued).toBeDefined();
      expect(updatedUser.cardInventory.length).toBeGreaterThan(0);
      
      // 恢复原始方法
      global.Date = originalDate;
    });
  });
}); 