// utils/achievementEngine.js
import UserStats from "../models/UserStats.js";
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";
import { checkIfGodAchievementUnlocked } from "./godAchievement.js";

export async function checkAndUnlockAchievements(userId) {
  try {
    // 1. 获取UserStats统计
    const stats = await UserStats.findOne({ user: userId });
    if (!stats) return;

    // 2. 获取用户已解锁的成就 ID 列表
    const unlocked = await UserAchievement.find({ user: userId });
    const unlockedIds = unlocked.map((item) => item.achievementId.toString());

    // 3. 获取所有启用状态的成就模板
    const allAchievements = await Achievement.find({ isEnabled: true });

    for (const ach of allAchievements) {
      // 跳过已解锁成就
      if (unlockedIds.includes(ach._id.toString())) continue;

      const { type, value } = ach.logic || {};
      const statValue = stats[type];

      // 条件判断
      const isMet =
        typeof value === "number"
          ? statValue >= value
          : typeof value === "boolean"
          ? statValue === value
          : typeof value === "string"
          ? statValue === value
          : false;

      if (isMet) {
        await UserAchievement.create({
          user: userId,
          achievementId: ach._id,
          achievementName: ach.name,
        });
        console.log(`🏆 用户 ${userId} 解锁成就：${ach.name}`);

        // 4. 奖励发放(暂时就经验和金币)
        await User.updateOne(
          { _id: userId },
          {
            $inc: {
              experience: ach.reward.exp || 0,
              gold: ach.reward.coins || 0,
            },
          }
        );
        console.log(
          `💰 用户 ${userId} 获得奖励：${ach.reward.exp || 0} 经验，${
            ach.reward.coins || 0
          } 金币`
        );
      }
    }

    await checkIfGodAchievementUnlocked(userId);
  } catch (error) {
    console.error("❌ 检查并解锁成就失败:", error);
  }
}
