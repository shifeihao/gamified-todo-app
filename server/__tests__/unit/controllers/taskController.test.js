import { jest } from '@jest/globals';
import { connectDB, closeDatabase, clearDatabase } from '../../setup.js';
import Task from '../../../models/Task.js';
import User from '../../../models/User.js';
import Card from '../../../models/Card.js';
import mongoose from 'mongoose';

// 导入要测试的控制器函数
import { getTasks, createTask, getTaskById, updateTask, deleteTask } from '../../../controllers/taskController.js';

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

describe('任务控制器测试', () => {
  // 创建测试用户和相关数据
  let testUser;
  let testCard;
  
  beforeEach(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'taskuser',
      email: 'task@example.com',
      password: 'password123',
      dailyCards: {
        blank: 3,
        lastIssued: new Date()
      }
    });
    
    // 创建测试卡片
    testCard = await Card.create({
      user: testUser._id,
      type: 'blank',
      title: '空白短期卡片',
      description: '每日自动发放的短期卡片',
      taskDuration: 'short',
      used: false
    });
  });
  
  describe('getTasks', () => {
    it('应该获取当前用户的所有任务', async () => {
      // 创建一些测试任务
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        tasks.push(await Task.create({
          user: testUser._id,
          title: `任务${i+1}`,
          description: `描述${i+1}`,
          type: 'short',
          category: 'work',
          experienceReward: 10,
          goldReward: 5,
          cardUsed: testCard._id
        }));
      }
      
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getTasks(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveLength(3);
      expect(res.json.mock.calls[0][0][0].title).toBe('任务1');
    });
  });
  
  describe('createTask', () => {
    it('应该创建新任务', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        body: {
          title: '新任务',
          description: '这是一个新任务',
          type: 'short',
          category: 'work',
          experienceReward: 10,
          goldReward: 5,
          cardUsed: testCard._id
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await createTask(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].title).toBe('新任务');
      
      // 验证卡片是否标记为已使用
      const updatedCard = await Card.findById(testCard._id);
      expect(updatedCard.used).toBe(true);
      
      // 验证用户的空白卡片数量是否减少
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.dailyCards.blank).toBe(2); // 原来3张，减1
    });
  });
  
  describe('getTaskById', () => {
    it('应该获取指定任务', async () => {
      // 创建测试任务
      const task = await Task.create({
        user: testUser._id,
        title: '测试任务',
        description: '这是一个测试任务',
        type: 'short',
        category: 'work',
        experienceReward: 10,
        goldReward: 5,
        cardUsed: testCard._id
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        params: { id: task._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getTaskById(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].title).toBe('测试任务');
    });
  });
  
  describe('deleteTask', () => {
    it('应该删除任务', async () => {
      // 创建测试任务
      const task = await Task.create({
        user: testUser._id,
        title: '待删除任务',
        description: '这是一个将被删除的任务',
        type: 'short',
        category: 'work',
        experienceReward: 10,
        goldReward: 5,
        cardUsed: testCard._id
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        params: { id: task._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await deleteTask(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalledWith({ message: "Task archived and deleted" });
      
      // 验证任务确实已删除
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });
  });
}); 