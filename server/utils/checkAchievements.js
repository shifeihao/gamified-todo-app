import UserStats from "../models/UserStats.js";
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";
import { checkIfGodAchievementUnlocked } from "./userStatsSync.js";

export async function checkAndUnlockAchievements(userId) {
  try {
    // 获取UserStats表
    // 1. 将累计经验、等级、当前金币更新进user统计表
    const stats = await UserStats.findOne({ user:userId });
    if (!stats) {
      console.log("Can not find the user's stats, so canceling checking");
      return;
    }
    console.log("Get the user's stats, user_id is:", stats.user);

    // 2. 获取用户已解锁的成就 ID 列表
    const unlocked = await UserAchievement.find({ user: userId });
    console.log(
      "The number of the user's unlocked achievements is:",
      unlocked.length
    );

    // 将解锁的成就里的名字提取出来，方便后续对比
    const unlockedName = unlocked.map((item) => item.achievementName);
    console.log("The unlockedName", unlockedName);

    // 3. 获取所有启用状态的成就模板
    const allAchievements = await Achievement.find({ isEnabled: true });
    console.log(
      "The number of the all achievements is:",
      allAchievements.length
    );

    for (const ach of allAchievements) {
      // 跳过已解锁成就
      if (unlockedName.includes(ach.name)) continue;
      const { type, value, op } = ach.logic || {};
      const statValue = stats[type];
      console.log("achname", ach.name);

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

      console.log("isMet", isMet);
      console.log("userId", userId);
      console.log("achievementName", ach.name);

      if (isMet) {
        await UserAchievement.create({
          user: userId,
          achievementId: ach._id,
          achievementName: ach.name,
        });
        console.log(`🏆 User ${userId} unlock achievements：${ach.name}`);

        // 4. 奖励发放
        await User.updateOne(
          { _id: userId },
          {
            $inc: {
              experience: ach.reward.exp || 0,
              gold: ach.reward.coins || 0,
              shortCardSlot: ach.task_short_slot || 0,
              longCardSlot: ach.task_long_slot || 0,
            },
          }
        );
        console.log(
          `💰 User ${userId} Get rewards：${ach.reward.exp || 0} experience，${
            ach.reward.coins || 0
          } Coins`
        );
      }
    }

    await checkIfGodAchievementUnlocked(userId);
  } catch (error) {
    console.error("❌ Failed to check and unlock achievement:", error);
  }
}
