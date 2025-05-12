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
      throw new Error("任务无效或不属于当前用户");
    }
    
    // 只检查任务存在性，不再检查状态
    // 任务状态可能已被设置为Completed

    const user = await User.findById(userId);
    if (!user) throw new Error("用户未找到");

    let totalExp = 0;
    let totalGold = 0;

    // 计算奖励（区分长期与short）
    if (task.type === "long") {
      // 检查子任务完成情况
      const completedSubTasks = task.subTasks.filter(st => st.status === 'Completed');
      const allSubTasksCompleted = completedSubTasks.length === task.subTasks.length;
      
      console.log("长期任务手动完成 - 任务ID:", task._id);
      console.log("长期任务手动完成 - 任务标题:", task.title);
      console.log("长期任务手动完成 - 使用卡片:", task.cardUsed?.type, "加成:", task.cardUsed?.bonus);
      console.log("长期任务手动完成 - 子任务总数:", task.subTasks.length);
      console.log("长期任务手动完成 - 已完成子任务数:", completedSubTasks.length);
      
      // 确保所有子任务都标记为已完成
      let anySubTaskCompleted = false;
      task.subTasks.forEach(subTask => {
        if (subTask.status !== 'Completed') {
          subTask.status = 'Completed';
          subTask.completedAt = new Date();
        } else {
          anySubTaskCompleted = true;
        }
      });
      
      // 如果任务之前未完成，设置完成状态
      if (task.status !== "Completed") {
        task.status = "Completed";
        task.completedAt = new Date();
      }
      
      // 主任务的额外奖励
      const bonusExp = task.finalBonusExperience || 10;
      const bonusGold = task.finalBonusGold || 5;
      
      console.log("长期任务额外奖励 - 经验:", bonusExp);
      console.log("长期任务额外奖励 - 金币:", bonusGold);
      
      // 应用卡片加成到额外奖励
      const { experience: finalExp, gold: finalGold } = calculateReward(
        bonusExp,
        bonusGold,
        task.cardUsed?.bonus
      );
      
      console.log("长期任务额外奖励(加成后) - 经验:", finalExp);
      console.log("长期任务额外奖励(加成后) - 金币:", finalGold);
      
      // 设置总奖励为额外奖励
      totalExp = finalExp;
      totalGold = finalGold;
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
      message: '奖励与等级更新成功',
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
    console.error("❌ 奖励与等级更新失败:", error);
    throw new Error("奖励与等级更新失败: " + error.message);
  }
};

// 处理子任务完成，给予经验和金币奖励
export const handleSubTaskCompletion = async (req) => {
  try {
    const userId = req.user._id;
    const { taskId, subTaskIndex } = req.body;

    // 1. 查找主任务和用户
    const task = await Task.findById(taskId).populate("cardUsed");
    if (!task || task.user.toString() !== userId.toString()) {
      throw new Error("Task is invalid or does not belong to the current user");
    }

    // 确保是长期任务并且子任务索引有效
    if (task.type !== "long" || !task.subTasks[subTaskIndex]) {
      throw new Error("Invalid task type or subtask index");
    }

    // 如果子任务已经完成，返回错误
    if (task.subTasks[subTaskIndex].status === "Completed") {
      throw new Error("Subtask already completed");
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // 2. 设置子任务为已完成状态
    task.subTasks[subTaskIndex].status = "Completed";
    task.subTasks[subTaskIndex].completedAt = new Date();
    
    // 3. 计算子任务的奖励（与短期任务相同）
    const subTaskExp = task.subTasks[subTaskIndex].experience || 10;
    const subTaskGold = task.subTasks[subTaskIndex].gold || 5;
    
    // 4. 应用卡片加成（如果有）
    const { experience, gold } = calculateReward(
      subTaskExp,
      subTaskGold,
      task.cardUsed?.bonus
    );
    
    // 5. 发放奖励
    user.experience += experience;
    user.gold += gold;
    
    // 6. 计算等级和经验进度
    const newExp = user.experience;
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

    // 7. 检查主任务是否全部子任务都已完成
    const allSubTasksCompleted = task.subTasks.every(
      (sub) => sub.status === "Completed"
    );
    
    let longTaskReward = null;
    
    // 8. 如果所有子任务已完成，只将主任务标记为已完成，但不自动发放额外奖励
    if (allSubTasksCompleted && task.status !== "Completed") {
      // 将任务状态标记为完成
      task.status = "Completed";
      task.completedAt = new Date();
      
      console.log("所有子任务已完成，长期任务标记为已完成状态，需手动点击完成按钮获取额外奖励");
    }

    // 9. 保存更改
    await user.save();
    await task.save();
    
    // 10. 同步用户状态
    await SyncUser(userId);
    await SyncTaskHistory(userId);

    // 11. 返回结果
    return {
      success: true,
      message: 'Subtask completed successfully',
      task,
      subTaskReward: {
        expGained: experience,
        goldGained: gold
      },
      longTaskReward,
      level: currentLevel.level,
      experience: newExp,
      nextLevelExp,
      expProgress,
      expRemaining,
      progressRate,
      leveledUp
    };
  } catch (error) {
    console.error("❌ Subtask completion failed:", error);
    throw new Error("Subtask completion failed: " + error.message);
  }
};

export const getUserLevelBar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    const currentLevel = await Level.findOne({ expRequired: { $lte: user.experience } }).sort({ level: -1 });
    const nextLevel = await Level.findOne({ level: currentLevel.level + 1 });

    const nextLevelExp = nextLevel ? nextLevel.expRequired : currentLevel.expRequired;
    const expProgress = user.experience - currentLevel.expRequired;
    const expRemaining = nextLevelExp - user.experience;
    const progressRate = currentLevel.expToNext > 0
      ? Math.min(expProgress / currentLevel.expToNext, 1)
      : 1;

    return res.json({
      level: currentLevel.level,
      experience: user.experience,
      nextLevelExp,
      expProgress,
      expRemaining,
      progressRate,
      leveledUp: false // 登录时一般不会升级，但你可以自定义逻辑
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '获取等级信息失败' });
  }
};
