import express from "express";
import userRoutes from "./user.js";
import cardRoutes from "./card.js";
import taskRoutes from "./task.js";
import shopRoutes from "./shop.js";


const router = express.Router();

router.use("/users",userRoutes);
router.use("/cards",cardRoutes);
router.use("/tasks",taskRoutes);
router.use("/shop",shopRoutes);



export default router;