import express from "express";
const router = express.Router();
import { protect } from "../../middleware/auth.js";
import {
  handleTaskCompletion,
  getUserLevelBar,
  addExperience,
  updateSlot,
} from "../../controllers/levelController.js";

// ✅ 登录后查询当前用户等级信息
router.get("/userLevelBar", protect, getUserLevelBar);
router.post("/testAddExp", protect, addExperience);
router.post("/slot", protect, updateSlot);

export default router;
