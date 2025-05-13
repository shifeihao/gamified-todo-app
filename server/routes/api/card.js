import express from "express";
const router = express.Router();

import { protect } from '../../middleware/auth.js';

import {consumeCard,processDrops,getCardInventory, issueDailyCards, issueWeeklyCards, issueRewardCard, issueBlankCard,getCardById} from '../../controllers/cardController.js';

// 获取卡片库存
router.route('/inventory')
  .get(protect, getCardInventory);

// 每日卡片
router.route('/issue-daily')
  .post(protect, issueDailyCards);

// 每周长期卡片
router.route('/issue-weekly')
  .post(protect, issueWeeklyCards);

// 发放奖励卡片
router.route('/issue-reward')
  .post(protect, issueRewardCard);

// 卡片消耗接口
router.route('/consume')
  .post(protect, consumeCard);

// 发放空白卡片（用于postman测试）
router.route('/issue-blank')
  .post(protect, issueBlankCard);

router.route('/process-drops')
  .post(protect, processDrops);    

router.route('/:id')
  .get(protect, getCardById);



export default router;  