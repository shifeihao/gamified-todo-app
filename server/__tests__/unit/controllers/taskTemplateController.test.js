import { connectDB, closeDatabase, clearDatabase } from '../../setup.js';
import TaskTemplate from '../../../models/TaskTemplate.js';
import User from '../../../models/User.js';
import Task from '../../../models/Task.js';
import Card from '../../../models/Card.js';
import mongoose from 'mongoose';

// 导入要测试的控制器函数
import {
  getAllTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  applyTemplate
} from '../../../controllers/taskTemplateController.js';

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

describe('任务模板控制器测试', () => {
  let testUser;
  let testCard;
  let testTemplate;
  
  beforeEach(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'templateuser',
      email: 'template@example.com',
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
    
    // 创建测试模板
    testTemplate = await TaskTemplate.create({
      userId: testUser._id,
      title: '测试模板',
      description: '这是一个测试用的任务模板',
      type: 'short',
      category: 'work',
      experienceReward: 10,
      goldReward: 5,
      isPublic: true
    });
  });
  
  describe('getAllTemplates', () => {
    it('应该获取所有公开模板和用户自己的模板', async () => {
      // 创建另一个用户的公开模板
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@example.com',
        password: 'password123'
      });
      
      const publicTemplate = await TaskTemplate.create({
        userId: anotherUser._id,
        title: '公开模板',
        description: '这是另一个用户的公开模板',
        type: 'short',
        category: 'study',
        experienceReward: 15,
        goldReward: 7,
        isPublic: true
      });
      
      // 创建另一个用户的私有模板
      const privateTemplate = await TaskTemplate.create({
        userId: anotherUser._id,
        title: '私有模板',
        description: '这是另一个用户的私有模板',
        type: 'long',
        category: 'personal',
        experienceReward: 20,
        goldReward: 10,
        isPublic: false
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getAllTemplates(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const templates = res.json.mock.calls[0][0];
      
      // 验证返回了公开模板和自己的模板，但不包括他人的私有模板
      expect(templates).toHaveLength(2);
      
      const templateTitles = templates.map(t => t.title);
      expect(templateTitles).toContain('测试模板'); // 自己的模板
      expect(templateTitles).toContain('公开模板'); // 他人的公开模板
      expect(templateTitles).not.toContain('私有模板'); // 他人的私有模板
    });
  });
  
  describe('createTemplate', () => {
    it('应该创建新模板', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        body: {
          title: '新模板',
          description: '这是一个新创建的模板',
          type: 'long',
          category: 'study',
          experienceReward: 20,
          goldReward: 10,
          isPublic: true,
          subTasks: ['子任务1', '子任务2']
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await createTemplate(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      
      // 验证模板是否已保存到数据库
      const createdTemplate = await TaskTemplate.findOne({ title: '新模板' });
      expect(createdTemplate).toBeDefined();
      expect(createdTemplate.userId.toString()).toBe(testUser._id.toString());
      expect(createdTemplate.description).toBe('这是一个新创建的模板');
      expect(createdTemplate.type).toBe('long');
      expect(createdTemplate.category).toBe('study');
      expect(createdTemplate.experienceReward).toBe(20);
      expect(createdTemplate.goldReward).toBe(10);
      expect(createdTemplate.isPublic).toBe(true);
      expect(createdTemplate.subTasks).toEqual(['子任务1', '子任务2']);
    });
  });
  
  describe('getTemplateById', () => {
    it('应该获取指定模板', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        params: { id: testTemplate._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getTemplateById(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const template = res.json.mock.calls[0][0];
      
      expect(template._id.toString()).toBe(testTemplate._id.toString());
      expect(template.title).toBe('测试模板');
      expect(template.description).toBe('这是一个测试用的任务模板');
    });
  });
  
  describe('updateTemplate', () => {
    it('应该更新模板', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        params: { id: testTemplate._id },
        body: {
          title: '更新的模板',
          description: '这是更新后的描述',
          experienceReward: 15
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await updateTemplate(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const updatedTemplate = res.json.mock.calls[0][0];
      
      expect(updatedTemplate.title).toBe('更新的模板');
      expect(updatedTemplate.description).toBe('这是更新后的描述');
      expect(updatedTemplate.experienceReward).toBe(15);
      
      // 验证原有字段保持不变
      expect(updatedTemplate.type).toBe('short');
      expect(updatedTemplate.category).toBe('work');
      expect(updatedTemplate.goldReward).toBe(5);
    });
  });
  
  describe('deleteTemplate', () => {
    it('应该删除模板', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        params: { id: testTemplate._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await deleteTemplate(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].message).toContain('模板已删除');
      
      // 验证模板已从数据库中删除
      const deletedTemplate = await TaskTemplate.findById(testTemplate._id);
      expect(deletedTemplate).toBeNull();
    });
  });
  
  describe('applyTemplate', () => {
    it('应该使用模板创建新任务', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        params: { id: testTemplate._id },
        body: {
          cardUsed: testCard._id,
          dueDate: new Date().toISOString()
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await applyTemplate(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      
      // 验证任务是否使用模板信息创建
      const task = await Task.findOne({ title: testTemplate.title });
      expect(task).toBeDefined();
      expect(task.description).toBe(testTemplate.description);
      expect(task.type).toBe(testTemplate.type);
      expect(task.category).toBe(testTemplate.category);
      expect(task.experienceReward).toBe(testTemplate.experienceReward);
      expect(task.goldReward).toBe(testTemplate.goldReward);
      expect(task.cardUsed.toString()).toBe(testCard._id.toString());
      
      // 验证卡片是否标记为已使用
      const updatedCard = await Card.findById(testCard._id);
      expect(updatedCard.used).toBe(true);
    });
  });
});