import express from "express";
const router = express.Router();
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
} from '../../controllers/userController.js';
  
import { protect } from '../../middleware/auth.js';
  
// 公开路由
router.post('/register', registerUser);
router.post('/login', loginUser);
  
// 需要认证的路由
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

export default router;