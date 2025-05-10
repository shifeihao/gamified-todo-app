// server/utils/loadDefaultAchievements.js

import Achievement from "../models/Achievement.js";
import defaultAchievements from "./defaultAchievements.js";

// 插入默认成就数据（先清空再插入）
export async function loadDefaultAchievements() {
  try {
    await Achievement.deleteMany({});
    console.log("🧹 The original achievement data has been cleared");
    for (const ach of defaultAchievements) {
      // ✅ 跳过缺失 logic 的成就（容错处理）
      if (
        !ach.logic ||
        ach.logic.value === undefined ||
        ach.logic.type === undefined
      ) {
        console.warn(
          `⚠️ Achievement Skip：${ach.name}，Reason: Missing logic.value Or type`
        );
        continue;
      }

      await Achievement.create(ach);
      console.log(`✅ Achievement inserted：${ach.name}`);
    }

    console.log("🎉 Default achievement data re-import completed");
  } catch (error) {
    console.error("❌ Importing default achievements failed:", error);
  }
}
