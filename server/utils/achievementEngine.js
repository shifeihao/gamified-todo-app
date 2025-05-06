// utils/achievementEngine.js
import UserStats from "../models/UserStats.js";
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";
import { checkIfGodAchievementUnlocked } from "./godAchievement.js";
import { SyncUserStats } from "./userStatsSync.js";

export async function checkAndUnlockAchievements(userId) {
  try {
    //同步用户和统计信息
    await SyncUserStats(userId);

    // 获取UserStats表

    // 1. 将累计经验、等级、当前金币更新进user统计表
    const stats = await UserStats.findOne({ user_id: userId });
    if (!stats) {
      console.log("Can not find the user's stats, so canceling checking");
      return;
    }
    console.log("Get the user's stats, user_id is:", stats.user_id);

    // 2. 获取用户已解锁的成就 ID 列表
    const unlocked = await UserAchievement.find({ user_id: userId });
    console.log(
      "The number of the user's unlocked achievements is:",
      unlocked.length
    );

    // 将解锁的成就里的名字提取出来，方便后续对比
    const unlockedName = unlocked.map((item) => item.achievementName);

    // 3. 获取所有启用状态的成就模板
    const allAchievements = await Achievement.find({ isEnabled: true });
    console.log(
      "The number of the all achievements is:",
      allAchievements.length
    );

    for (const ach of allAchievements) {
      // 跳过已解锁成就
      if (unlockedName.includes(ach.name)) continue;

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
          user_id: userId,
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
