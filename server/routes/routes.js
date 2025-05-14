import express from "express";
import apiRoutes from "./api/api.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.json({ message: "Hello, world!" });
});

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

router.use("/api", apiRoutes);

export default router;
