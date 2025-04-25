// server/utils/loadDefaultAchievements.js

import Achievement from "../models/Achievement.js";
import defaultAchievements from "../config/defaultAchievements.js";

// 插入默认成就数据（先清空再插入）
export async function loadDefaultAchievements() {
  try {
    await Achievement.deleteMany({});
    console.log("🧹 已清空原有成就数据");

    for (const ach of defaultAchievements) {
      // ✅ 跳过缺失 logic 的成就（容错处理）
      if (
        !ach.logic ||
        ach.logic.value === undefined ||
        ach.logic.type === undefined
      ) {
        console.warn(
          `⚠️ 成就跳过：${ach.name}，原因：缺少 logic.value 或 type`
        );
        continue;
      }

      await Achievement.create(ach);
      console.log(`✅ 成就已插入：${ach.name}`);
    }

    console.log("🎉 默认成就数据重新导入完成");
  } catch (error) {
    console.error("❌ 导入默认成就失败:", error);
  }
}
