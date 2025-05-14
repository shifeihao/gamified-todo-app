import UserStats from "../models/UserStats.js";
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";
import { checkIfGodAchievementUnlocked } from "./userStatsSync.js";

export async function checkAndUnlockAchievements(userId) {
  try {
    const newlyUnlocked = [];
    // get UserStats and check if it exists
    const stats = await UserStats.findOne({ user: userId });
    if (!stats) {
      console.log("Can not find the user's stats, so canceling checking");
      return newlyUnlocked;
    }

    // get UserAchievement
    const unlocked = await UserAchievement.find({ user: userId });
    const unlockedName = unlocked.map((item) => item.achievementName);
    const allAchievements = await Achievement.find({ isEnabled: true });
    for (const ach of allAchievements) {
      if (unlockedName.includes(ach.name)) continue;
      const { type, value, op } = ach.logic || {};
      const statValue = stats[type];
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

        // give reward
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

        // Add to newly unlocked achievements
        newlyUnlocked.push({
          name: ach.name,
          description: ach.description,
          icon: ach.icon,
          reward: {
            exp: ach.reward.exp || 0,
            coins: ach.reward.coins || 0,
            task_short_slot: ach.reward.task_short_slot || 0,
            task_long_slot: ach.reward.task_long_slot || 0,
          }
        });

        console.log("experience+", ach.reward.exp);
        console.log("gold+", ach.reward.coins);
        console.log("shortCardSlot+", ach.reward.task_short_slot);
        console.log("longCardSlot+", ach.reward.task_long_slot);
      }
    }

    await checkIfGodAchievementUnlocked(userId);
    return newlyUnlocked;
  } catch (error) {
    console.error("❌ fail:", error);
    return [];
  }
}
