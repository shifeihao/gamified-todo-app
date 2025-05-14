import mongoose from 'mongoose';

// 连接MongoDB数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // 连接池配置
      maxPoolSize: 10,
      minPoolSize: 2,
      // 超时设置
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // 心跳检测
      heartbeatFrequencyMS: 10000,
    });

    console.log(`MongoDB Atlas 连接成功: ${conn.connection.host}`);

    // 监听连接事件
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 连接断开，尝试重连...');
      setTimeout(connectDB, 5000);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 连接错误:', err);
    });

  } catch (error) {
    console.error(`MongoDB 连接错误: ${error.message}`);
    console.error('错误详情:', error);
    // 重试连接
    console.log('5秒后尝试重新连接...');
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
