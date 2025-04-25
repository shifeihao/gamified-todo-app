import express from "express";
const router = express.Router();

import {
  getShopItems,
  buyItem,
  getItemByName,
  sellItem
} from '../../controllers/shopController.js';

import { protect } from '../../middleware/auth.js';

// 获取商店物品（公开或可选加认证）
router.get('/items', getShopItems);

// 购买商品（需要登录）
router.post('/buy', protect, buyItem);

// 通过物品名称获取物品（仅内部使用，用于获取任务奖励或者成就奖励）
router.get('/item/:name', getItemByName);

// 卖掉物品（需要登录）
router.post('/sell', protect, sellItem);

export default router;
