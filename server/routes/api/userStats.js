// routes/api/achievement.js
import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  syncUserStats,
} from "../../controllers/userStatsController.js";

const router = express.Router();

// ✅ 同步用户的所有统计信息
router.patch("/sync", protect, syncUserStats);

export default router;
