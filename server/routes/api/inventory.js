import express from "express";
const router = express.Router();
import { protect } from "../../middleware/auth.js";
import {
  equipItem,
  unequipItem,
  getUserEquipment,
  getBackpack,
} from "../../controllers/inventoryController.js";

// 装备某个物品
router.route("/equip").post(protect, equipItem);

// 卸下某个槽位的装备
router.route("/unequip").post(protect, unequipItem);

// 可选：获取当前玩家所有已穿戴装备
router.route("/equipment").get(protect, getUserEquipment);

// 获取玩家背包中所有物品（不论是否装备）
router.route("/backpack").get(protect, getBackpack);

export default router;
