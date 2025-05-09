import express from 'express';
import { enterDungeon } from '../../controllers/dungeonController.js';
import { exploreCurrentFloor, monsterCombat,summarizeExploration,interactWithShopEvent,continueExploration} from '../../controllers/dungeonController.js';

import { protect } from '../../middleware/auth.js';

const router = express.Router();

// ✅ 添加认证中间件（如果有）
router.post('/enter', protect, enterDungeon);
router.post('/explore', protect, exploreCurrentFloor);
router.post('/fight', protect, monsterCombat);
router.post('/summarize', protect, summarizeExploration);
router.post('/shop-interaction', protect, interactWithShopEvent);
router.post('/continue', protect, continueExploration);
export default router;