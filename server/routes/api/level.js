import express from "express";
const router = express.Router();
import { protect } from "../../middleware/auth.js";
import {
  handleTaskCompletion,
  getUserLevelBar,
  addExperience,
  updateSlot,
} from "../../controllers/levelController.js";

// ✅ Query the current user level information after logging in
router.get("/userLevelBar", protect, getUserLevelBar);
router.post("/testAddExp", protect, addExperience);
router.post("/slot", protect, updateSlot);

export default router;
