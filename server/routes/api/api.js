import express from "express";
import userRoutes from "./user.js";
import cardRoutes from "./card.js";
import taskRoutes from "./task.js";
import levelRoutes from "./level.js";
import shopRoutes from "./shop.js";
import achievementRoutes from "./achievement.js";
import dungeonRoutes from "./dungeon.js"
import characterRoutes from './character.js';
import templateRoutes from './template.js';

const router = express.Router();

router.use("/users", userRoutes);
router.use("/cards", cardRoutes);
router.use("/tasks", taskRoutes);
router.use("/levels", levelRoutes);
router.use("/shop", shopRoutes);
router.use("/achievements", achievementRoutes);
router.use("/dungeon", dungeonRoutes); // 确保 dungeonRoutes 已经定义并导入
router.use('/character', characterRoutes);
router.use('/templates', templateRoutes);

export default router;
