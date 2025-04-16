import express from "express";
import userRoutes from "./user.js";
import cardRoutes from "./card.js";
import taskRoutes from "./task.js";


const router = express.Router();

router.use("/users",userRoutes);
router.use("/cards",cardRoutes);
router.use("/tasks",taskRoutes);



export default router;