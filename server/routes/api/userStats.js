// routes/api/achievement.js
import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  syncUserStats,
  getUserStatistics,
} from "../../controllers/userStatsController.js";

const router = express.Router();

// ✅ 获取当前用户记录信息
router.get("/", protect, getUserStatistics);
// ✅ 同步用户的所有统计信息
router.patch("/sync", protect, syncUserStats);

export default router;
