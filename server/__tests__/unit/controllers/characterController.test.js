import { jest } from '@jest/globals';
import { connectDB, closeDatabase, clearDatabase } from '../../setup.js';
import { UserDungeonStats } from '../../../models/UserDungeonStats.js';
import User from '../../../models/User.js';
import { CharacterClass } from '../../../models/CharacterClass.js';
import mongoose from 'mongoose';

// 导入要测试的控制器函数
import { 
  selectClass, 
  getUserStats, 
  getAvailableClasses 
} from '../../../controllers/characterController.js';

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

describe('角色控制器测试', () => {
  let testUser;
  
  beforeEach(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'characteruser',
      email: 'character@example.com',
      password: 'password123'
    });
  });
  
  describe('selectClass', () => {
    it('应该选择职业并创建角色', async () => {
      // 模拟CharacterClass.findOne的行为
      const originalFindOne = CharacterClass.findOne;
      CharacterClass.findOne = jest.fn().mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            name: '战士',
            slug: 'warrior',
            description: '强壮的战士',
            baseStats: {
              hp: 100,
              attack: 10,
              defense: 15
            },
            defaultSkills: []
          })
        };
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        body: { 
          classSlug: 'warrior'
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await selectClass(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
      
      // 验证数据库中创建了角色
      const character = await UserDungeonStats.findOne({ 
        user: testUser._id
      });
      expect(character).toBeDefined();
      expect(character.classSlug).toBe('warrior');
      expect(character.className).toBe('战士');
      
      // 恢复原始实现
      CharacterClass.findOne = originalFindOne;
    });
    
    it('缺少职业slug应返回错误', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id },
        body: { } // 缺少classSlug
      };
      const res = mockResponse();
      
      // 调用函数
      await selectClass(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].error).toContain('required');
    });
  });
  
  describe('getUserStats', () => {
    it('应该获取角色信息', async () => {
      // 创建一个角色
      await UserDungeonStats.create({
        user: testUser._id,
        dungeonSlug: 'test-dungeon',
        classSlug: 'warrior',
        className: '战士',
        dungeonLevel: 3,
        dungeonExp: 250,
        assignedStats: {
          hp: 150,
          attack: 25,
          defense: 15
        },
        Skills: []
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getUserStats(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const stats = res.json.mock.calls[0][0];
      expect(stats.hasClass).toBe(true);
      expect(stats.name).toBe('战士');
      expect(stats.level).toBe(3);
      expect(stats.exp).toBe(250);
      expect(stats.baseStats.hp).toBe(150);
    });
    
    it('未选择职业应返回hasClass=false', async () => {
      // 创建请求和响应对象
      const req = {
        user: { _id: testUser._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await getUserStats(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].hasClass).toBe(false);
    });
  });
  
  describe('getAvailableClasses', () => {
    it('应该列出可用职业', async () => {
      // 模拟CharacterClass.find的行为
      const originalFind = CharacterClass.find;
      CharacterClass.find = jest.fn().mockImplementation(() => {
        return {
          populate: jest.fn().mockReturnValue([
            {
              _id: new mongoose.Types.ObjectId(),
              name: '战士',
              slug: 'warrior',
              icon: 'warrior.png',
              description: '强壮的战士',
              baseStats: {
                hp: 100,
                attack: 10,
                defense: 15
              },
              defaultSkills: []
            },
            {
              _id: new mongoose.Types.ObjectId(),
              name: '法师',
              slug: 'mage',
              icon: 'mage.png',
              description: '强大的法师',
              baseStats: {
                hp: 80,
                attack: 15,
                defense: 5
              },
              defaultSkills: []
            }
          ])
        };
      });
      
      // 创建请求和响应对象
      const req = {};
      const res = mockResponse();
      
      // 调用函数
      await getAvailableClasses(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const classes = res.json.mock.calls[0][0].classes;
      expect(classes.length).toBe(2);
      
      // 验证职业信息正确
      const warrior = classes.find(c => c.slug === 'warrior');
      const mage = classes.find(c => c.slug === 'mage');
      
      expect(warrior).toBeDefined();
      expect(warrior.name).toBe('战士');
      expect(warrior.description).toBe('强壮的战士');
      
      expect(mage).toBeDefined();
      expect(mage.name).toBe('法师');
      expect(mage.description).toBe('强大的法师');
      
      // 恢复原始实现
      CharacterClass.find = originalFind;
    });
  });
}); 