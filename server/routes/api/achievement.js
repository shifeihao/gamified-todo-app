// routes/api/achievement.js
import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  getAllAchievements,
  getUnlockedAchievements,
  triggerAchievementCheck,
  resetAchievementsForUser,
} from "../../controllers/achievementController.js";

const router = express.Router();

// ✅ Get all achievements + unlocked
router.get("/", protect, getAllAchievements);
// ✅ Get the achievements that the current user has unlocked
router.get("/unlocked", protect, getUnlockedAchievements);
// ✅ Achievement Detection Test
router.post("/check", protect, triggerAchievementCheck);
// ✅ Clear the user's achievement record (for testing)
router.delete("/reset/:userId", resetAchievementsForUser);

export default router;
