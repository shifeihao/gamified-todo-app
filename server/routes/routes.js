import express from "express";
import apiRoutes from "./api/api.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.json({ message: "API运行正常" });
});

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 将所有API路由直接挂载到根路径
router.use("/", apiRoutes);

export default router;
