// routes/api/achievement.js
import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  syncUserStats,
  getUserStatistics,
} from "../../controllers/userStatsController.js";

const router = express.Router();

// ✅ Get the current user record information
router.get("/", protect, getUserStatistics);
// ✅ Synchronize all statistics of users
router.patch("/sync", protect, syncUserStats);

export default router;
