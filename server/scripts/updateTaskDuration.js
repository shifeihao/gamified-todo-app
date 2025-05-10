// scripts/updateTaskDuration.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Card from '../models/Card.js';
import Task from '../models/Task.js';

dotenv.config();

async function main() {
    // 1. 连接 Atlas（云端）
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('✅ 已连接到 MongoDB Atlas');

    // 2. 找出还没 taskDuration 的卡片
    const cards = await Card.find({ taskDuration: { $exists: false } });
    console.log(`共找到 ${cards.length} 条需要更新的卡片`);

    // 3. 遍历更新
    for (const card of cards) {
        // 这里按类型决定默认值，你也可以改逻辑
        card.taskDuration = card.type === 'special' ? '长期' : '短期';
        await card.save();
        console.log(`✔ 卡片 ${card._id} → ${card.taskDuration}`);
    }

    // 4. 完成并断开
    console.log('🎉 全部更新完毕');
    await mongoose.disconnect();
    console.log('🛑 已断开数据库连接');
}

main().catch(err => {
    console.error('❌ 更新失败:', err);
    process.exit(1);
});
