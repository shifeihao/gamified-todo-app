import { connectDB, closeDatabase, clearDatabase } from '../../setup.js';
import {
  ShopItem,
  WeaponItem,
  ArmorItem,
  ConsumableItem
} from '../../../models/ShopItem.js';
import {
  ShopInventory,
  UserInventory,
  UserEquipment
} from '../../../models/Inventory.js';
import User from '../../../models/User.js';
import mongoose from 'mongoose';

// 导入要测试的控制器函数
import {
  getShopItems,
  getItemByName,
  buyItem,
  sellItem
} from '../../../controllers/shopController.js';

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

describe('商店控制器测试', () => {
  let testUser;
  let testWeapon;
  let testArmor;
  let testConsumable;
  
  beforeEach(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'shopuser',
      email: 'shop@example.com',
      password: 'password123',
      gold: 1000, // 初始金币
      experience: 0,
      level: 1
    });
    
    // 创建测试武器
    testWeapon = await WeaponItem.create({
      name: '测试剑',
      type: 'weapon',
      price: 500,
      description: '一把测试用的剑',
      weaponType: 'sword',
      slot: 'mainHand',
      stats: {
        attack: 20,
        critRate: 5
      },
      requiredLevel: 1
    });
    
    // 添加到商店库存
    await ShopInventory.create({
      item: testWeapon._id,
      quantity: 10,
      price: 500,
      shopId: 'default'
    });
    
    // 创建测试护甲
    testArmor = await ArmorItem.create({
      name: '测试胸甲',
      type: 'armor',
      price: 300,
      description: '一件测试用的胸甲',
      armorType: 'plate',
      slot: 'chest',
      stats: {
        defense: 15
      },
      requiredLevel: 1
    });
    
    // 添加到商店库存
    await ShopInventory.create({
      item: testArmor._id,
      quantity: 5,
      price: 300,
      shopId: 'default'
    });
    
    // 创建测试消耗品
    testConsumable = await ConsumableItem.create({
      name: '测试药水',
      type: 'consumable',
      price: 50,
      description: '一瓶测试用的药水',
      effect: 'heal',
      potency: 30,
      trigger: 'manual'
    });
    
    // 添加到商店库存
    await ShopInventory.create({
      item: testConsumable._id,
      quantity: 20,
      price: 50,
      shopId: 'default'
    });
  });
  
  describe('getShopItems', () => {
    it('应该获取商店物品列表', async () => {
      // 创建请求和响应对象
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = mockResponse();
      
      // 调用函数
      await getShopItems(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];
      
      expect(result.data).toHaveLength(3); // 三个测试物品
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      
      // 验证物品信息
      const items = result.data.map(item => item.item.name);
      expect(items).toContain('测试剑');
      expect(items).toContain('测试胸甲');
      expect(items).toContain('测试药水');
    });
  });
  
  describe('getItemByName', () => {
    it('应该通过名称获取物品详情', async () => {
      // 创建请求和响应对象
      const req = {
        params: { name: '测试剑' }
      };
      const res = mockResponse();
      
      // 调用函数
      await getItemByName(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      const item = res.json.mock.calls[0][0];
      
      expect(item.name).toBe('测试剑');
      expect(item.type).toBe('weapon');
      expect(item.price).toBe(500);
    });
  });
  
  describe('buyItem', () => {
    it('应该购买物品', async () => {
      // 创建请求和响应对象
      const req = {
        user: testUser,
        body: { itemId: testWeapon._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await buyItem(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].message).toContain('购买成功');
      
      // 验证用户金币是否减少
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.gold).toBe(500); // 1000 - 500
      
      // 验证商店库存是否减少
      const shopEntry = await ShopInventory.findOne({ item: testWeapon._id });
      expect(shopEntry.quantity).toBe(9); // 原来10个，减1
      
      // 验证物品是否添加到用户背包
      const userInventory = await UserInventory.find({ userId: testUser._id });
      expect(userInventory).toHaveLength(1);
      expect(userInventory[0].item.toString()).toBe(testWeapon._id.toString());
      expect(userInventory[0].quantity).toBe(1);
    });
  });
  
  describe('sellItem', () => {
    it('应该出售物品', async () => {
      // 先给用户添加一个物品到背包
      await UserInventory.create({
        userId: testUser._id,
        item: testArmor._id,
        quantity: 1
      });
      
      // 创建请求和响应对象
      const req = {
        user: testUser,
        body: { itemId: testArmor._id }
      };
      const res = mockResponse();
      
      // 调用函数
      await sellItem(req, res);
      
      // 验证
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].message).toContain('成功售出');
      expect(res.json.mock.calls[0][0].message).toContain('150'); // 售价是原价的一半
      
      // 验证用户金币是否增加
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.gold).toBe(1150); // 1000 + 150
      
      // 验证物品是否从用户背包中移除
      const userInventory = await UserInventory.find({ userId: testUser._id });
      expect(userInventory).toHaveLength(0);
    });
  });
}); 