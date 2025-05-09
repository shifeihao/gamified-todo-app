import express from 'express';
import { getAvailableClasses, selectClass,getUserStats } from '../../controllers/characterController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.get('/classes', protect, getAvailableClasses);
router.post('/select-class', protect, selectClass);
router.get('/stats', protect, getUserStats);

export default router;