import { SyncUserStats } from "../utils/userStatsSync.js";
import UserStats from "../models/UserStats.js";
// 更新用户统计信息
export const syncUserStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    await SyncUserStats(userId);
    res.status(200).json({ message: "用户统计信息已同步" });
  } catch (error) {
    console.error("❌ 同步用户统计信息失败:", error);
    res.status(500).json({ message: "同步失败", error: error.message });
  }
};

//获取当前用户的成就统计信息
export async function getUserStatistics(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(404).json({ message: "未找到该用户的统计信息" });
    }
    const result = await UserStats.findOne({ user:userId });
    res.json(result);
  } catch (err) {
    console.error("❌ 获取用户统计信息失败:", err);
    res
      .status(500)
      .json({ message: "获取用户统计信息失败", error: err.message });
  }
}