import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { connectDB, closeDatabase, clearDatabase, generateTestToken } from '../setup.js';
import routes from '../../routes/routes.js';
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 设置测试JWT密钥
process.env.JWT_SECRET = 'test_secret_key';

// 创建Express应用实例
const app = express();
app.use(express.json());
app.use('/', routes);

// 在测试开始前连接数据库
beforeAll(async () => {
  await connectDB();
});

// 每次测试后清除数据库
afterEach(async () => {
  await clearDatabase();
});

// 在所有测试完成后关闭数据库连接
afterAll(async () => {
  await closeDatabase();
});

describe('用户API测试', () => {
  it('应该注册新用户', async () => {
    // 准备测试数据
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    // 发送注册请求
    const res = await request(app)
      .post('/api/users/register')
      .send(userData);
      
    // 验证响应
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.username).toBe(userData.username);
    expect(res.body.email).toBe(userData.email);
    expect(res.body).toHaveProperty('token');
  });
  
  it('注册时应拒绝重复的邮箱', async () => {
    // 先创建一个用户
    const userData = {
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'password123'
    };
    
    await User.create(userData);
    
    // 尝试使用相同邮箱注册
    const res = await request(app)
      .post('/api/users/register')
      .send(userData);
      
    // 验证响应
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('用户已存在');
  });
  
  it('应该登录用户并返回令牌', async () => {
    // 先创建一个用户
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'loginuser',
      email: 'login@example.com',
      password: hashedPassword
    });
    
    // 发送登录请求
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });
      
    // 验证响应
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.username).toBe('loginuser');
  });
  
  it('登录时应拒绝错误的密码', async () => {
    // 先创建一个用户
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'wrongpassuser',
      email: 'wrong@example.com',
      password: hashedPassword
    });
    
    // 发送错误密码的登录请求
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });
      
    // 验证响应
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('邮箱或密码不正确');
  });
  
  it('应该获取用户个人资料', async () => {
    // 先创建一个用户
    const user = await User.create({
      username: 'profileuser',
      email: 'profile@example.com',
      password: await bcrypt.hash('password123', 10)
    });
    
    // 创建一个用于测试的JWT令牌
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'mern_demo_secret_key', 
      { expiresIn: '1h' }
    );
    
    // 发送获取个人资料请求
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
      
    // 验证响应
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('profileuser');
    expect(res.body.email).toBe('profile@example.com');
  });
  
  it('未授权访问应被拒绝', async () => {
    // 发送无令牌的请求
    const res = await request(app)
      .get('/api/users/profile');
      
    // 验证响应
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('未授权');
  });
  
  it('应该更新用户信息', async () => {
    // 先创建一个用户
    const user = await User.create({
      username: 'updateprofileuser',
      email: 'updateprofile@example.com',
      password: await bcrypt.hash('password123', 10)
    });
    
    // 创建一个用于测试的JWT令牌
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'mern_demo_secret_key', 
      { expiresIn: '1h' }
    );
    
    // 准备更新数据
    const updateData = {
      username: 'updatedusername',
      email: 'updated@example.com'
    };
    
    // 发送更新个人资料请求
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);
      
    // 验证响应
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe(updateData.username);
    expect(res.body.email).toBe(updateData.email);
  });
}); 