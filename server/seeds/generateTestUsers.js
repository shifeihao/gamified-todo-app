// server/seeds/generateTestUsers.js
import User from '../models/User.js';
import UserLevel from '../models/UserLevel.js';
import Level from '../models/Level.js';

export async function ensureTestUserWithLevel() {
  try {
    const email = 'test@example.com';

    // 1. 确保测试用户存在
    let user = await User.findOne({ email });
    if (!user) {
      console.log('🆕 测试用户不存在，正在创建...');
      user = new User({
        email,
        username: "testuser_" + Date.now(),
        password: '123456',
      });
      await user.save();
      console.log('✅ 已创建测试用户');
    } else {
      console.log('🧪 测试用户已存在');
    }

    // 2. 清空旧的 UserLevel
    await UserLevel.deleteOne({ userId: user._id });
    console.log('✅ 清空旧的 UserLevel');

    // 3. 获取等级表中的 LV2 门槛经验
    const level2 = await Level.findOne({ level: 2 });
    const nextLevelExp = level2?.expRequired || 155;

    // 4. 写入默认等级记录
    await UserLevel.create({
      userId: user._id,
      exp: 0,
      level: 1,
      nextLevelExp,
    });

    console.log('✅ UserLevel 等级记录写入完成');
  } catch (err) {
    console.error('❌ 初始化测试用户等级失败:', err);
  }
}
