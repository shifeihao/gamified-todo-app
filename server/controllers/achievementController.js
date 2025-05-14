// controllers/achievementController.js
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import { checkAndUnlockAchievements } from "../utils/checkAchievements.js";

// Get all achievements (plus whether they are unlocked)
export async function getAllAchievements(req, res) {
  try {
    const userId = req.user?._id;
    const all = await Achievement.find({ isEnabled: true });
    const unlocked = await UserAchievement.find({ user: userId }).select(
      "achievementName unlockedAt"
    );
    //Turn unlocked into a Map with the achievement name as the key and the unlocking time as the value
    const unlockedTimeMap = {};
    for (const u of unlocked) {
      if (u.achievementName) {
        unlockedTimeMap[u.achievementName.toString()] = u.unlockedAt;
      }
    }
    const result = all.map((ach) => {
      const name = ach.name?.toString();
      const isUnlocked = name && unlockedTimeMap[name];

      return {
        _id: ach._id,
        name: ach.name,
        description: ach.description,
        category: ach.category,
        isHidden: ach.isHidden && !isUnlocked,
        unlocked: Boolean(isUnlocked),
        unlockedAt: isUnlocked ? unlockedTimeMap[name] : null,
        reward: ach.reward,
        points: ach.points,
        icon: ach.icon,
        condition: ach.condition,
        logic: ach.logic,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Failed to obtain achievement:", err);
    res
      .status(500)
      .json({ message: "Failed to obtain achievement", error: err.message });
  }
}

// Get the current user's unlocked achievements
export async function getUnlockedAchievements(req, res) {
  try {
    const userId = req.user?._id;
    const unlocked = await UserAchievement.find({ user: userId }).populate(
      "achievementId"
    );

    const result = unlocked.map((entry) => ({
      _id: entry.achievementId._id,
      name: entry.achievementId.name,
      description: entry.achievementId.description,
      unlockedAt: entry.unlockedAt,
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ Failed to obtain unlocked achievements:", err);
    res.status(500).json({
      message: "Failed to obtain unlocked achievements",
      error: err.message,
    });
  }
}

// Achievement Check Trigger
export async function triggerAchievementCheck(req, res) {
  const userId = req.user?._id;
  if (!userId)
    return res.status(400).json({ message: "Please provide userId" });
  try {
    const newlyUnlocked = await checkAndUnlockAchievements(userId);
    res.json({
      message: `✅ Achievement detection has been performed for userId=${userId}`,
      newlyUnlocked
    });
  } catch (err) {
    console.error("❌ Achievement detection failed:", err);
    res
      .status(500)
      .json({ message: "Achievement detection failed", error: err.message });
  }
}

// Clear the user's achievement record
export async function resetAchievementsForUser(req, res) {
  const userId = req.params.userId;
  try {
    const result = await UserAchievement.deleteMany({ user: userId });
    res.json({
      message: `🗑️ User ${userId} The achievement record of has been cleared`,
      deleted: result.deletedCount,
    });
  } catch (err) {
    console.error("❌ Achievement clear failed:", err);
    res
      .status(500)
      .json({ message: "Achievement clear failed:", error: err.message });
  }
}
