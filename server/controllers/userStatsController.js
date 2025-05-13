import { SyncUserStats } from "../utils/userStatsSync.js";
import UserStats from "../models/UserStats.js";
// Update user statistics
export const syncUserStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    await SyncUserStats(userId);
    res.status(200).json({ message: "User statistics synced" });
  } catch (error) {
    console.error("❌ Failed to synchronize user statistics:", error);
    res
      .status(500)
      .json({ message: "Synchronization failed", error: error.message });
  }
};

//Get the current user's achievement statistics
export async function getUserStatistics(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res
        .status(404)
        .json({ message: "No statistics found for this user" });
    }
    const result = await UserStats.findOne({ user: userId });
    res.json(result);
  } catch (err) {
    console.error("❌ Failed to obtain user statistics:", err);
    res.status(500).json({
      message: "Failed to obtain user statistics",
      error: err.message,
    });
  }
}
