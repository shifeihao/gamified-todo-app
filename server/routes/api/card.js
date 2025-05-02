import express from "express";
const router = express.Router();

import { protect } from '../../middleware/auth.js';

import {consumeCard, getCardInventory, issueDailyCards, issueWeeklyCards, issueRewardCard, issueBlankCard,} from '../../controllers/cardController.js';

// 获取卡片库存
router.route('/inventory')
  .get(protect, getCardInventory);

// 定时发放短期普通卡片
router.route('/issue-daily')
  .post(protect, issueDailyCards);

// 定时发放长期普通卡片
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


export default router;