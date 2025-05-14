import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// 导入Jest全局对象并设置到全局环境
import { jest } from '@jest/globals';
global.jest = jest;

// 连接到内存数据库
let mongod;

export const connectDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  await mongoose.connect(uri, mongooseOpts);
};

// 清空数据库中的所有集合
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

// 关闭数据库连接并停止服务器
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

// 生成测试JWT令牌
export const generateTestToken = async (userId) => {
  const jwt = await import('jsonwebtoken');
  return jwt.default.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'testsecret', 
    { expiresIn: '1h' }
  );
}; 