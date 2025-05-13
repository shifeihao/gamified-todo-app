import express from "express";
const router = express.Router();

import { protect } from '../../middleware/auth.js';

import {
  consumeCard, 
  getCardInventory, 
  issueDailyCards, 
  issueWeeklyCards, 
  issueRewardCard, 
  issueBlankCard,
  getCardById
} from '../../controllers/cardController.js';

// 注意：路由的顺序非常重要
// 具体路径必须放在参数路径(如:id)之前，否则Express会将所有请求匹配到参数路由

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

// 获取单张卡片 - 必须放在所有特定路由之后
router.route('/:id')
  .get(protect, getCardById);

export default router;