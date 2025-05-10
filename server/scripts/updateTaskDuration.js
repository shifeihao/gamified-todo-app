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
    console.log('✅ Connect to MongoDB Atlas');

    // 2. 找出还没 taskDuration 的卡片
    const cards = await Card.find({ taskDuration: { $exists: false } });
    console.log(`Found ${cards.length} cards that need to be updated`);

    // 3. 遍历更新
    for (const card of cards) {
        // 这里按类型决定默认值，你也可以改逻辑
        card.taskDuration = card.type === 'special' ? 'Long' : 'Short';
        await card.save();
        console.log(`✔ Card ${card._id} → ${card.taskDuration}`);
    }

    // 4. 完成并断开
    console.log('🎉 All updated');
    await mongoose.disconnect();
    console.log('🛑 Database connection disconnected');
}

main().catch(err => {
    console.error('❌ Update failed:', err);
    process.exit(1);
});
