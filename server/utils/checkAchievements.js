import UserStats from "../models/UserStats.js";
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";
import { checkIfGodAchievementUnlocked } from "./userStatsSync.js";

export async function checkAndUnlockAchievements(userId) {
  try {
    // 获取UserStats表
    // 1. 将累计经验、等级、当前金币更新进user统计表
    const stats = await UserStats.findOne({ user: userId });
    if (!stats) {
      console.log("Can not find the user's stats, so canceling checking");
      return;
    }

    // 2. 获取用户已解锁的成就 ID 列表
    const unlocked = await UserAchievement.find({ user: userId });
    // 将解锁的成就里的名字提取出来，方便后续对比
    const unlockedName = unlocked.map((item) => item.achievementName);
    // 3. 获取所有启用状态的成就模板
    const allAchievements = await Achievement.find({ isEnabled: true });
    for (const ach of allAchievements) {
      // 跳过已解锁成就
      if (unlockedName.includes(ach.name)) continue;
      const { type, value, op } = ach.logic || {};
      const statValue = stats[type];
      // 条件判断
      let isMet = false;
      switch (op) {
        case "gte":
          isMet = statValue >= value;
          break;
        case "lte":
          isMet = statValue <= value;
          break;
        case "eq":
          isMet = statValue === value;
          break;
        case "lt":
          isMet = statValue < value;
          break;
        case "gt":
          isMet = statValue > value;
          break;
        case "ne":
          isMet = statValue !== value;
          break;
        default:
          isMet = false;
      }
      if (isMet) {
        await UserAchievement.create({
          user: userId,
          achievementId: ach._id,
          achievementName: ach.name,
        });

        // 4. 奖励发放
        await User.updateOne(
          { _id: userId },
          {
            $inc: {
              experience: ach.reward.exp || 0,
              gold: ach.reward.coins || 0,
              shortCardSlot: ach.reward.task_short_slot || 0,
              longCardSlot: ach.reward.task_long_slot || 0,
            },
          }
        );
        // 5. 成就解锁通知
        console.log("experience+", ach.reward.exp);
        console.log("gold+", ach.reward.coins);
        console.log("shortCardSlot+", ach.reward.task_short_slot);
        console.log("longCardSlot+", ach.reward.task_long_slot);
      }
    }

    await checkIfGodAchievementUnlocked(userId);
  } catch (error) {
    console.error("❌ 检查并解锁成就失败:", error);
  }
}
