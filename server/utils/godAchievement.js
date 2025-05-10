import UserStats from "../models/UserStats.js";
import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import User from "../models/User.js";

export async function checkIfGodAchievementUnlocked(userId) {
  // 1. 重新获取已解锁成就
  const unlockedAchievements = await UserAchievement.find({ user:userId });
  const unlockedCount = unlockedAchievements.length;

  // 2. 更新 UserStats 中的 achievements_total_unlocked 字段
  await UserStats.updateOne(
    { user:userId },
    { $set: { achievements_total_unlocked: unlockedCount } }
  );

  console.log(`🔢 用户 ${userId} 的成就总数已更新：${unlockedCount}`);

  // 3. 获取总启用成就数量（过滤掉未启用的）
  const allEnabledAchievements = await Achievement.find({ isEnabled: true });
  const totalAchievementsCount = allEnabledAchievements.length;

  // 4. 查找“成就之神”成就定义
  const godAchievement = await Achievement.findOne({
    logic: { type: "achievements_total_unlocked" },
    isEnabled: true,
  });

  // 5. 判断是否需要解锁“成就之神”
  const alreadyUnlocked = unlockedAchievements.some(
    (ua) => ua.achievementId.toString() === godAchievement?._id?.toString()
  );

  if (
    godAchievement &&
    !alreadyUnlocked &&
    unlockedCount >= totalAchievementsCount - 1
  ) {
    await UserAchievement.create({
      user:userId,
      achievementId: godAchievement._id,
      achievementName: godAchievement.name,
    });
    console.log(`🏆 用户 ${userId} 解锁成就之神：${godAchievement.name}`);

    await User.updateOne(
      { _id: userId },
      {
        $inc: {
          experience: godAchievement.reward.exp || 0,
          gold: godAchievement.reward.coins || 0,
        },
      }
    );
    console.log(
      `💰 奖励：${godAchievement.reward.exp || 0} EXP, ${
        godAchievement.reward.coins || 0
      } Gold`
    );
  }
}
