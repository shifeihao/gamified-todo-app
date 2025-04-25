// models/UserAchievement.js
import mongoose from "mongoose";

const UserAchievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Achievement",
      required: true,
    },
    achievementName: {
      type: String,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// 确保同一个用户不会解锁同一个成就多次
UserAchievementSchema.index({ user: 1, achievementId: 1 }, { unique: true });

const UserAchievement = mongoose.model(
  "UserAchievement",
  UserAchievementSchema
);
export default UserAchievement;
