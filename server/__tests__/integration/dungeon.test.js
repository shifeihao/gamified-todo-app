import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { connectDB, closeDatabase, clearDatabase, generateTestToken } from '../setup.js';
import routes from '../../routes/routes.js';
import User from '../../models/User.js';
import { UserDungeonStats } from '../../models/UserDungeonStats.js';
import { Dungeon } from '../../models/Dungeon.js';
import { Monster } from '../../models/Monster.js';
import { Event } from '../../models/Event.js';
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

describe('地下城API测试', () => {
  let testUser;
  let testMonster;
  let testEvent;
  let testDungeon;
  let authToken;
  
  beforeEach(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'dungeonuser',
      email: 'dungeon@example.com',
      password: 'password123'
    });
    
    // 生成认证令牌
    authToken = await generateTestToken(testUser._id);
    
    // 创建测试怪物
    testMonster = await Monster.create({
      name: '测试怪物',
      description: '这是一个测试怪物',
      hp: 50,
      attack: 10,
      defense: 5,
      expReward: 20,
      goldReward: 10,
      imgUrl: 'monster.png'
    });
    
    // 创建测试事件
    testEvent = await Event.create({
      name: '测试事件',
      description: '这是一个测试事件',
      type: 'reward',
      triggerCondition: 'onEnter',
      effect: {
        gold: 20,
        dungenonExp: 15
      }
    });
    
    // 创建测试地下城
    testDungeon = await Dungeon.create({
      name: '测试地下城',
      description: '这是一个测试地下城',
      slug: 'echo-labyrinth',
      maxFloor: 5,
      environment: 'cave',
      isActive: true,
      floors: [
        {
          floorIndex: 1,
          name: '第一层',
          description: '测试地下城的第一层',
          monsters: [
            {
              monster: testMonster._id,
              spawnRate: 0.8
            }
          ],
          events: [testEvent._id],
          boss: null
        },
        {
          floorIndex: 2,
          name: '第二层',
          description: '测试地下城的第二层',
          monsters: [
            {
              monster: testMonster._id,
              spawnRate: 0.8
            }
          ],
          events: [testEvent._id],
          boss: testMonster._id
        }
      ]
    });
  });
  
  it('未选择职业时无法进入地下城', async () => {
    // 发送进入地下城请求
    const res = await request(app)
      .post('/api/dungeon/enter')
      .set('Authorization', `Bearer ${authToken}`);
      
    // 验证响应
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('select a class first');
    expect(res.body.needsClass).toBe(true);
  });
  
  it('应该成功进入地下城', async () => {
    // 创建用户地下城统计数据
    await UserDungeonStats.create({
      user: testUser._id,
      dungeonSlug: 'echo-labyrinth',
      dungeonLevel: 1,
      dungeonExp: 0,
      unspentStatPoints: 0,
      gold: 100,
      assignedStats: {
        hp: 100,
        attack: 15,
        defense: 10,
        critRate: 5
      },
      currentExploration: null
    });
    
    // 发送进入地下城请求
    const res = await request(app)
      .post('/api/dungeon/enter')
      .set('Authorization', `Bearer ${authToken}`);
      
    // 验证响应
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('entered');
    expect(res.body).toHaveProperty('dungeon');
    expect(res.body.dungeon.name).toBe('测试地下城');
    expect(res.body).toHaveProperty('currentFloor', 1);
    
    // 验证数据库中的用户状态已更新
    const updatedStats = await UserDungeonStats.findOne({ user: testUser._id });
    expect(updatedStats.currentExploration).toBeDefined();
    expect(updatedStats.currentExploration.dungeonSlug).toBe('echo-labyrinth');
    expect(updatedStats.currentExploration.floorIndex).toBe(1);
  });
  
  it('进入地下城后应能探索当前楼层', async () => {
    // 创建用户地下城统计数据并设置为已进入状态
    await UserDungeonStats.create({
      user: testUser._id,
      dungeonSlug: 'echo-labyrinth',
      dungeonLevel: 1,
      dungeonExp: 0,
      unspentStatPoints: 0,
      gold: 100,
      assignedStats: {
        hp: 100,
        attack: 15,
        defense: 10,
        critRate: 5
      },
      currentExploration: {
        dungeonSlug: 'echo-labyrinth',
        floorIndex: 1,
        currentHp: 100,
        activeMonsters: [],
        activeEvents: [],
        status: {
          inCombat: false,
          atCheckpoint: false
        },
        startTime: new Date()
      }
    });
    
    // 发送探索请求
    const res = await request(app)
      .post('/api/dungeon/explore')
      .set('Authorization', `Bearer ${authToken}`);
      
    // 探索结果可能是怪物遭遇或事件触发，无法完全预测
    // 但状态码应为200且返回探索结果
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });
  
  it('应该能总结探索结果', async () => {
    // 创建用户地下城统计数据并设置为已进入状态并有奖励
    await UserDungeonStats.create({
      user: testUser._id,
      dungeonSlug: 'echo-labyrinth',
      dungeonLevel: 1,
      dungeonExp: 0,
      unspentStatPoints: 0,
      gold: 100,
      assignedStats: {
        hp: 100,
        attack: 15,
        defense: 10,
        critRate: 5
      },
      currentExploration: {
        dungeonSlug: 'echo-labyrinth',
        floorIndex: 1,
        currentHp: 100,
        activeMonsters: [],
        activeEvents: [],
        status: {
          inCombat: false,
          atCheckpoint: false
        },
        startTime: new Date(),
        accumulatedRewards: {
          exp: 50,
          gold: 30,
          items: []
        }
      }
    });
    
    // 发送总结请求
    const res = await request(app)
      .post('/api/dungeon/summarize')
      .set('Authorization', `Bearer ${authToken}`);
      
    // 验证响应
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('exploration');
    expect(res.body).toHaveProperty('rewards');
    expect(res.body.rewards).toHaveProperty('exp', 50);
    expect(res.body.rewards).toHaveProperty('gold', 30);
    
    // 验证探索数据已重置
    const updatedStats = await UserDungeonStats.findOne({ user: testUser._id });
    expect(updatedStats.currentExploration).toBeNull();
    expect(updatedStats.dungeonExp).toBe(50); // 初始0 + 获得50
    expect(updatedStats.gold).toBe(130); // 初始100 + 获得30
  });
  
  it('无探索活动时总结应返回错误', async () => {
    // 创建用户地下城统计数据但不设置当前探索
    await UserDungeonStats.create({
      user: testUser._id,
      dungeonSlug: 'echo-labyrinth',
      dungeonLevel: 1,
      dungeonExp: 0,
      unspentStatPoints: 0,
      gold: 100,
      assignedStats: {
        hp: 100,
        attack: 15,
        defense: 10,
        critRate: 5
      },
      currentExploration: null
    });
    
    // 发送总结请求
    const res = await request(app)
      .post('/api/dungeon/summarize')
      .set('Authorization', `Bearer ${authToken}`);
      
    // 验证响应
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
  
  it('未授权访问应被拒绝', async () => {
    // 不提供认证令牌
    const res = await request(app)
      .post('/api/dungeon/enter');
      
    // 验证响应
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('未授权');
  });
}); 