import express from "express";
const router = express.Router();
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
} from '../../controllers/userController.js';

import{getUserInventory} from '../../controllers/inventoryController.js';
  
import { protect } from '../../middleware/auth.js';
  
// Public Routing
router.post('/register', registerUser);
router.post('/login', loginUser);
  
// Routes that require authentication
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);


router.route('/inventory')
    .get(protect,getUserInventory);

export default router;

