import { SyncUserStats } from "../utils/userStatsSync.js";
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
