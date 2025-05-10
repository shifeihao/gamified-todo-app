// server/controllers/levelController.js

import User from "../models/User.js";
import Level from "../models/Level.js";
import Task from "../models/Task.js";
import { calculateReward } from "../utils/TaskRewardCalcultor.js";
import { SyncUser, SyncTaskHistory } from "../utils/userStatsSync.js";

export const handleTaskCompletion = async (req) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.body;

    const task = await Task.findById(taskId).populate("cardUsed");
    if (!task || task.user.toString() !== userId.toString()) {
      throw new Error("The task is invalid or does not belong to the current user");
    }
    if (task.status !== "Finished") {
      throw new Error("The task has not been completed yet, and the reward cannot be settled.");
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    let totalExp = 0;
    let totalGold = 0;

    // 计算奖励（区分长期与短期）
    if (task.type === "Long") {
      const subExp = task.subTasks.reduce(
        (sum, s) => sum + (s.experience || 0),
        0
      );
      const subGold = task.subTasks.reduce((sum, s) => sum + (s.gold || 0), 0);
      const bonusExp = task.finalBonusExperience || 0;
      const bonusGold = task.finalBonusGold || 0;
      const baseExp = subExp + bonusExp;
      const baseGold = subGold + bonusGold;
      const { experience, gold } = calculateReward(
        baseExp,
        baseGold,
        task.cardUsed?.bonus
      );

      totalExp = experience;
      totalGold = gold;
    } else {
      task.finalBonusExperience = 0;
      task.finalBonusGold = 0;
      const { experience, gold } = calculateReward(
        task.experienceReward || 0,
        task.goldReward || 0,
        task.cardUsed?.bonus
      );
      totalExp = experience;
      totalGold = gold;
    }

    // 发放奖励
    user.experience += totalExp;
    user.gold += totalGold;

    const newExp = user.experience;

    // 查等级配置
    const currentLevel = await Level.findOne({
      expRequired: { $lte: newExp },
    }).sort({ level: -1 });
    const nextLevel = await Level.findOne({ level: currentLevel.level + 1 });

    const nextLevelExp = nextLevel
      ? nextLevel.expRequired
      : currentLevel.expRequired;
    const expProgress = newExp - currentLevel.expRequired;
    const expRemaining = nextLevelExp - newExp;
    const progressRate =
      currentLevel.expToNext > 0
        ? Math.min(expProgress / currentLevel.expToNext, 1)
        : 1;
    const leveledUp = currentLevel.level > user.level;

    user.level = currentLevel.level;
    user.nextLevelExp = nextLevelExp;

    await user.save();
    await task.save();

    // 写入历史记录
    const TaskHistory = (await import("../models/TaskHistory.js")).default;
    const duration = task.slotEquippedAt
      ? Math.floor((task.completedAt - new Date(task.slotEquippedAt)) / 60000)
      : null;

    await TaskHistory.create({
      user: task.user,
      title: task.title,
      type: task.type,
      status: task.status,
      completedAt: task.completedAt,
      duration,
      experienceGained: totalExp,
      goldGained: totalGold,
      cardType: task.cardUsed?.type || null,
      cardBonus: task.cardUsed?.bonus || null,
    });

    //完成任务，将User自己的经验、等级等情况同步到UserStats里面去
    await SyncUser(userId);
    await SyncTaskHistory(userId);

    // ✅ 返回结果对象，由调用者决定是否发送给前端
    return {
      success: true,
      message: 'Rewards and levels updated successfully',
      experience: newExp,

      level: currentLevel.level,
      nextLevelExp,
      expProgress,
      expRemaining,
      progressRate,
      leveledUp,
      expGained: totalExp,
      goldGained: totalGold,
    };
  } catch (error) {
    console.error("❌ Reward and level update failed:", error);
    throw new Error("Reward and level update failed: " + error.message);
  }
};







export const getUserLevelBar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User does not exist' });

    const currentLevel = await Level.findOne({ expRequired: { $lte: user.experience } }).sort({ level: -1 });
    const nextLevel = await Level.findOne({ level: currentLevel.level + 1 });

    const nextLevelExp = nextLevel ? nextLevel.expRequired : currentLevel.expRequired;
    const expProgress = user.experience - currentLevel.expRequired;
    const expRemaining = nextLevelExp - user.experience;
    const progressRate = currentLevel.expToNext > 0
        ? Math.min(expProgress / currentLevel.expToNext, 1)
        : 1;

    user.level = currentLevel.level;
    user.nextLevelExp = nextLevelExp;
    await user.save();

    return res.json({
      level: currentLevel.level,
      experience: user.experience,
      nextLevelExp,
      expProgress,
      expRemaining,
      progressRate,
      leveledUp: false,
      coins: user.gold  // 添加金幣數據
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to obtain level information' });
  }
};