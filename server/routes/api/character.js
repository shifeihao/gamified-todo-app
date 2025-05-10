import express from 'express';
import { selectClass,
  getAvailableClasses,
  getUserStats,
  allocateStatPoints,
  getStatAllocation } from '../../controllers/characterController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.get('/classes', protect, getAvailableClasses);
router.post('/select-class', protect, selectClass);
router.get('/stats', protect, getUserStats);
router.post('/allocate-stats', protect, allocateStatPoints);
router.get('/stat-allocation', protect, getStatAllocation);

export default router;