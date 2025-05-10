// server/seeds/generateTestUsers.js
import UserLevel from "../models/UserLevel.js";
import Level from "../models/Level.js";

export async function creatLevel(userId) {
  try {
    // 1. 清空旧的 UserLevel
    await UserLevel.deleteOne({ userId: userId });
    console.log("✅ Clear the old UserLevel");

    // 2. 获取等级表中的 LV2 门槛经验
    const level2 = await Level.findOne({ level: 2 });
    console.log("✅ Get Success");
    const nextLevelExp = level2?.expRequired || 155;

    // 3. 写入默认等级记录
    await UserLevel.create({
      userId: userId,
      exp: 0,
      level: 1,
      nextLevelExp,
    });

    console.log("✅ UserLevel Level record writing completed");
  } catch (err) {
    console.error("❌ Failed to initialize test user level:", err);
  }
}
