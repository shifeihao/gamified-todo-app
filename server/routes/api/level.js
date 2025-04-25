import express from "express";
const router = express.Router();
import { protect } from '../../middleware/auth.js';
import { handleTaskCompletion } from '../../controllers/levelController.js';

router.post('/complete-task', protect, handleTaskCompletion); // 👈 新接口

export default router;