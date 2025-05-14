import { jest } from '@jest/globals';
import { connectDB, closeDatabase, clearDatabase } from '../../setup.js';
import User from '../../../models/User.js';
import UserStats from '../../../models/UserStats.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 导入要测试的控制器函数
import { registerUser, loginUser, getUserProfile, updateUserProfile } from '../../../controllers/userController.js';

// 模拟auth中间件的generateToken函数
jest.mock('../../../middleware/auth.js', () => ({
  generateToken: jest.fn().mockReturnValue('test-token')
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

describe('用户控制器测试', () => {
  describe('registerUser', () => {
    it('应该成功注册新用户', async () => {
      // 创建请求和响应对象
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await registerUser(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].username).toBe('testuser');
      expect(res.json.mock.calls[0][0].email).toBe('test@example.com');
      expect(res.json.mock.calls[0][0]).toHaveProperty('token');
      
      // 验证用户是否已保存到数据库
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      
      // 验证是否创建了用户统计
      const stats = await UserStats.findOne({ user: user._id });
      expect(stats).toBeDefined();
    });
    
    it('已存在的用户应返回400错误', async () => {
      // 先创建一个用户
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      });
      
      // 创建请求和响应对象
      const req = {
        body: {
          username: 'existinguser2',
          email: 'existing@example.com', // 使用相同的邮箱
          password: 'password123'
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await registerUser(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '用户已存在' });
    });
    
    it('无效数据应返回500错误', async () => {
      // 创建请求和响应对象
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };
      const res = mockResponse();
      
      // 模拟User.create抛出错误，但不会在控制台显示
      const originalCreate = User.create;
      User.create = jest.fn().mockImplementation(() => {
        throw new Error('模拟的数据库错误');
      });
      
      // 临时禁用console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 调用函数
      await registerUser(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: '服务器错误' });
      
      // 恢复原始实现
      User.create = originalCreate;
      console.error = originalConsoleError;
    });
  });
  
  describe('loginUser', () => {
    it('应该成功登录用户', async () => {
      // 先创建一个用户
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'loginuser',
        email: 'login@example.com',
        password: hashedPassword
      });
      
      // 确保User模型有matchPassword方法
      User.prototype.matchPassword = async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      };
      
      // 模拟User.findOne方法
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockImplementation(function() {
        return {
          select: jest.fn().mockImplementation(() => {
            return {
              _id: new mongoose.Types.ObjectId(),
              username: 'loginuser',
              email: 'login@example.com',
              password: hashedPassword,
              role: 'user',
              experience: 0,
              gold: 0,
              shortCardSlot: 2,
              longCardSlot: 2,
              matchPassword: async (password) => {
                return await bcrypt.compare(password, hashedPassword);
              }
            };
          })
        };
      });
      
      // 创建请求和响应对象
      const req = {
        body: {
          email: 'login@example.com',
          password: 'password123'
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await loginUser(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].username).toBe('loginuser');
      expect(res.json.mock.calls[0][0].email).toBe('login@example.com');
      expect(res.json.mock.calls[0][0]).toHaveProperty('token');
      
      // 恢复原始实现
      User.findOne = originalFindOne;
    });
    
    it('错误的密码应返回401错误', async () => {
      // 先创建一个用户
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'loginuser',
        email: 'login@example.com',
        password: hashedPassword
      });
      
      // 确保User模型有matchPassword方法
      User.prototype.matchPassword = async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      };
      
      // 创建请求和响应对象
      const req = {
        body: {
          email: 'login@example.com',
          password: 'wrongpassword' // 错误的密码
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await loginUser(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '邮箱或密码不正确' });
    });
  });
  
  describe('getUserProfile', () => {
    it('应该获取用户个人资料', async () => {
      // 创建测试用户
      const user = await User.create({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'password123',
        experience: 100,
        gold: 200,
        shortCardSlot: 2,
        longCardSlot: 1
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: user._id.toString() } // 确保_id是字符串或有效的ObjectId
      };
      const res = mockResponse();
      
      // 调用函数
      await getUserProfile(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].username).toBe('profileuser');
      expect(res.json.mock.calls[0][0].email).toBe('profile@example.com');
      expect(res.json.mock.calls[0][0].experience).toBe(100);
      expect(res.json.mock.calls[0][0].gold).toBe(200);
      expect(res.json.mock.calls[0][0].shortCardSlot).toBe(2);
      expect(res.json.mock.calls[0][0].longCardSlot).toBe(1);
    });
    
    it('用户不存在应返回404错误', async () => {
      // 创建请求和响应对象，使用不存在的用户ID
      const req = {
        user: { _id: new mongoose.Types.ObjectId().toString() }
      };
      const res = mockResponse();
      
      // 临时禁用console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 调用函数
      await getUserProfile(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '用户不存在' });
      
      // 恢复console.error
      console.error = originalConsoleError;
    });
  });
  
  describe('updateUserProfile', () => {
    it('应该更新用户信息', async () => {
      // 创建测试用户
      const user = await User.create({
        username: 'updateuser',
        email: 'update@example.com',
        password: await bcrypt.hash('password123', 10)
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: user._id.toString() },
        body: {
          username: 'newusername',
          email: 'newemail@example.com'
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await updateUserProfile(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].username).toBe('newusername');
      expect(res.json.mock.calls[0][0].email).toBe('newemail@example.com');
      expect(res.json.mock.calls[0][0]).toHaveProperty('token');
      
      // 验证数据库中的用户是否已更新
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.username).toBe('newusername');
      expect(updatedUser.email).toBe('newemail@example.com');
    });
    
    it('应该更新密码', async () => {
      // 创建测试用户
      const initialPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        username: 'passworduser',
        email: 'password@example.com',
        password: initialPassword
      });
      
      // 创建请求和响应对象
      const req = {
        user: { _id: user._id.toString() },
        body: {
          password: 'newpassword123'
        }
      };
      const res = mockResponse();
      
      // 调用函数
      await updateUserProfile(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].username).toBe('passworduser');
      
      // 验证密码是否已更改（需要再次查询用户并比较密码哈希）
      const updatedUser = await User.findById(user._id).select('+password');
      const passwordMatches = await bcrypt.compare('newpassword123', updatedUser.password);
      expect(passwordMatches).toBe(true);
    });
    
    it('用户不存在应返回404错误', async () => {
      // 创建请求和响应对象，使用不存在的用户ID
      const req = {
        user: { _id: new mongoose.Types.ObjectId().toString() },
        body: {
          username: 'nonexistentuser'
        }
      };
      const res = mockResponse();
      
      // 临时禁用console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 调用函数
      await updateUserProfile(req, res);
      
      // 验证
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '用户不存在' });
      
      // 恢复console.error
      console.error = originalConsoleError;
    });
  });
}); 