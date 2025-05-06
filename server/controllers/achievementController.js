// controllers/achievementController.js
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import UserStats from "../models/UserStats.js";
import { checkAndUnlockAchievements } from "../utils/checkAchievements.js";

// ✅ 获取所有成就（附加是否解锁）
export async function getAllAchievements(req, res) {
  try {
    const userId = req.user?._id;
    const all = await Achievement.find({ isEnabled: true });
    const unlocked = await UserAchievement.find({ user_id: userId }).select(
      "achievementId"
    );
    const unlockedSet = new Set(
      unlocked.map((u) => u.achievementId?.toString()).filter(Boolean)
    );

    const result = all.map((ach) => ({
      _id: ach._id,
      name: ach.name,
      description: ach.description,
      category: ach.category,
      isHidden: ach.isHidden && !unlockedSet.has(ach._id.toString()),
      unlocked: unlockedSet.has(ach._id.toString()),
      reward: ach.reward,
      points: ach.points,
      icon: ach.icon,
      condition: ach.condition,
      logic: ach.logic,
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ 获取成就失败:", err);
    res.status(500).json({ message: "获取成就失败", error: err.message });
  }
}

// ✅ 获取当前用户已解锁成就
export async function getUnlockedAchievements(req, res) {
  try {
    const userId = req.user?._id;
    const unlocked = await UserAchievement.find({ user_id: userId }).populate(
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
    console.error("❌ 获取已解锁成就失败:", err);
    res.status(500).json({ message: "获取已解锁成就失败", error: err.message });
  }
}

// ✅ 成就检查触发器(测试用)
export async function triggerAchievementCheck(req, res) {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ message: "请提供 userId" });
  try {
    await checkAndUnlockAchievements(userId);
    res.json({ message: `✅ 成就检测已执行 for userId=${userId}` });
  } catch (err) {
    console.error("❌ 成就检测失败:", err);
    res.status(500).json({ message: "成就检测失败", error: err.message });
  }
}

// ✅ 清空该用户的成就记录
export async function resetAchievementsForUser(req, res) {
  const userId = req.params.userId;
  try {
    const result = await UserAchievement.deleteMany({ user_id: userId });
    res.json({
      message: `🗑️ 用户 ${userId} 的成就记录已清空`,
      deleted: result.deletedCount,
    });
  } catch (err) {
    console.error("❌ 成就清空失败:", err);
    res.status(500).json({ message: "成就清空失败", error: err.message });
  }
}

// ✅ 获取当前用户的成就统计信息
export async function getUserStatistics(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(404).json({ message: "未找到该用户的统计信息" });
    }
    const result = await UserStats.findOne({ user_id: userId });
    res.json(result);
  } catch (err) {
    console.error("❌ 获取用户统计信息失败:", err);
    res
      .status(500)
      .json({ message: "获取用户统计信息失败", error: err.message });
  }
}
