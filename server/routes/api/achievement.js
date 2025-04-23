// routes/api/achievement.js
import express from "express";
import Achievement from "../../models/Achievement.js";
import UserAchievement from "../../models/UserAchievement.js";
import { protect } from "../../middleware/auth.js";
import {
  getAllAchievements,
  getUnlockedAchievements,
  triggerAchievementCheck,
  resetAchievementsForUser,
  getUserStatistics,
} from "../../controllers/achievementController.js";

const router = express.Router();

// ✅ 获取所有成就 + 是否解锁
router.get("/", protect, getAllAchievements);
// ✅ 获取当前用户已解锁的成就
router.get("/unlocked", protect, getUnlockedAchievements);
// ✅ 获取当前用户记录信息
router.get("/stat", protect, getUserStatistics);

// ✅ 成就检测测试：调用 checkAndUnlockAchievements
router.post("/check/:userId", triggerAchievementCheck);
// ✅ 清空该用户的成就记录（测试用）
router.delete("/reset/:userId", resetAchievementsForUser);

export default router;
