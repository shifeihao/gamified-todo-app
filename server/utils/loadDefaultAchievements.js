// server/utils/loadDefaultAchievements.js

import Achievement from '../models/Achievement.js';
import defaultAchievements from '../config/defaultAchievements.js';

export async function loadDefaultAchievements() {
  try {
    for (const ach of defaultAchievements) {
      const existing = await Achievement.findOne({ name: ach.name });
      if (existing) {
        // ✅ 更新已有内容（例如描述、奖励）
        await Achievement.updateOne({ name: ach.name }, ach);
        console.log(`🔄 成就已更新：${ach.name}`);
      } else {
        // ✅ 新建成就
        await Achievement.create(ach);
        console.log(`✅ 成就已插入：${ach.name}`);
      }
    }
    console.log('🎉 默认成就数据同步完成');
  } catch (error) {
    console.error('❌ 导入默认成就失败:', error);
  }
}
