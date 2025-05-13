// server/controllers/levelController.js

import User from "../models/User.js";
import Level from "../models/Level.js";
import Task from "../models/Task.js";
import { calculateReward } from "../utils/TaskRewardCalcultor.js";
import { SyncTaskHistory, SyncUser } from "../utils/userStatsSync.js";

// 处理任务完成，给予经验和金币奖励
export const handleTaskCompletion = async (req) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.body;

    console.log(`开始处理任务完成 - 任务ID: ${taskId}, 用户ID: ${userId}`);

    const task = await Task.findById(taskId).populate("cardUsed");
    if (!task || task.user.toString() !== userId.toString()) {
      throw new Error("Task is invalid or does not belong to the current user");
    }

    console.log(
      `任务详情 - 标题: ${task.title}, 类型: ${task.type}, 状态: ${task.status}, 奖励已领取: ${task.rewardClaimed}`
    );

    // 检查任务是否已完成并且已经发放过奖励 (通过检查rewardClaimed字段)
    if (task.rewardClaimed === true) {
      console.log(`任务 ${taskId} 已经完成并领取过奖励，不再重复发放`);
      throw new Error("Task has already been completed and reward claimed");
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    console.log(
      `用户信息 - 等级: ${user.level}, 经验: ${user.experience}, 金币: ${user.gold}`
    );

    let totalExp = 0;
    let totalGold = 0;

    // 计算奖励（区分长期与short）
    if (task.type === "long") {
      // 检查子任务完成情况，但不再要求所有子任务必须完成
      const completedSubTasks = task.subTasks.filter(
        (st) => st.status === "completed"
      );

      console.log("Long-term task completion - Task ID:", task._id);
      console.log("Long-term task completion - Task title:", task.title);
      console.log(
        "Long-term task completion - Card used:",
        task.cardUsed?.type,
        "Bonus:",
        task.cardUsed?.bonus
      );
      console.log(
        "Long-term task completion - Total subtasks:",
        task.subTasks.length
      );
      console.log(
        "Long-term task completion - Completed subtasks:",
        completedSubTasks.length
      );

      // 如果任务之前未完成，设置完成状态
      if (task.status !== "completed") {
        task.status = "completed";
        console.log(`将任务 ${taskId} 状态设置为completed`);
      }

      // 记录完成时间（如果未设置）
      if (!task.completedAt) {
        task.completedAt = new Date();
        console.log(`设置任务 ${taskId} 完成时间为 ${task.completedAt}`);
      }

      // 主任务的奖励，尝试多种来源获取奖励值
      const bonusExp = task.experienceReward || task.finalBonusExperience || 30;
      const bonusGold = task.goldReward || task.finalBonusGold || 15;

      console.log("Long-term task bonus - XP:", bonusExp);
      console.log("Long-term task bonus - Gold:", bonusGold);

      // 应用卡片加成到额外奖励
      const { experience: finalExp, gold: finalGold } = calculateReward(
        bonusExp,
        bonusGold,
        task.cardUsed?.bonus
      );

      console.log("Long-term task bonus (with multiplier) - XP:", finalExp);
      console.log("Long-term task bonus (with multiplier) - Gold:", finalGold);

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

    // 设置已完成状态和完成时间（如果未设置）
    task.status = "completed";
    task.completedAt = task.completedAt || new Date();
    // 标记奖励已发放
    task.rewardClaimed = true;

    console.log(
      `将向用户 ${userId} 发放奖励: ${totalExp} XP, ${totalGold} Gold`
    );

    // 发放奖励
    user.experience += totalExp;
    user.gold += totalGold;

    console.log(
      `用户新状态 - 经验: ${user.experience} (+${totalExp}), 金币: ${user.gold} (+${totalGold})`
    );

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

    // ✅ 返回结果对象，由调用者决定是否发送给前端
    return {
      success: true,
      message: "Rewards and level updated successfully",
      task: {
        _id: task._id,
        title: task.title,
        type: task.type,
        status: task.status,
        completedAt: task.completedAt,
        rewardClaimed: true,
      },
      reward: {
        expGained: totalExp,
        goldGained: totalGold,
        leveledUp: leveledUp,
        newLevel: currentLevel.level,
        currentExp: newExp,
        nextLevelExp,
        expProgress,
        expRemaining,
        progressRate,
      },
    };
  } catch (error) {
    console.error("❌ Rewards and level update failed:", error);
    throw new Error("Rewards and level update failed: " + error.message);
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
    if (task.subTasks[subTaskIndex].status === "completed") {
      throw new Error("Subtask already completed");
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // 2. 设置子任务为已完成状态
    task.subTasks[subTaskIndex].status = "completed";
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
      (sub) => sub.status === "completed"
    );

    let longTaskReward = null;

    // 8. 如果所有子任务已完成，只将主任务标记为已完成，但不自动发放额外奖励
    if (allSubTasksCompleted && task.status !== "completed") {
      // 将任务状态标记为完成
      task.status = "completed";
      task.completedAt = new Date();

      console.log(
        "所有子任务已完成，长期任务标记为已完成状态，需手动点击完成按钮获取额外奖励"
      );
    }

    // 9. 保存更改
    await user.save();
    await task.save();

    // 11. 返回结果
    return {
      success: true,
      message: "Subtask completed successfully",
      task: {
        _id: task._id,
        title: task.title,
        type: task.type,
        status: task.status,
        subTasks: task.subTasks,
        completedAt: task.completedAt,
        equipped: task.equipped,
        slotPosition: task.slotPosition,
      },
      subTaskReward: {
        expGained: experience,
        goldGained: gold,
        subTaskIndex: subTaskIndex,
        subTaskTitle: task.subTasks[subTaskIndex].title,
      },
      longTaskReward,
      userInfo: {
        level: currentLevel.level,
        experience: newExp,
        nextLevelExp,
        expProgress,
        expRemaining,
        progressRate,
        leveledUp,
      },
      allSubTasksCompleted: task.subTasks.every(
        (sub) => sub.status === "completed"
      ),
    };
  } catch (error) {
    console.error("❌ Subtask completion failed:", error);
    throw new Error("Subtask completion failed: " + error.message);
  }
};

// 获取用户等级信息
export const getUserLevelBar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentLevel = await Level.findOne({
      expRequired: { $lte: user.experience },
    }).sort({ level: -1 });
    const nextLevel = await Level.findOne({ level: currentLevel.level + 1 });

    const nextLevelExp = nextLevel
      ? nextLevel.expRequired
      : currentLevel.expRequired;
    const expProgress = user.experience - currentLevel.expRequired;
    const expRemaining = nextLevelExp - user.experience;
    const progressRate =
      currentLevel.expToNext > 0
        ? Math.min(expProgress / currentLevel.expToNext, 1)
        : 1;

    return res.json({
      level: currentLevel.level,
      experience: user.experience,
      nextLevelExp,
      expProgress,
      expRemaining,
      progressRate,
      leveledUp: false, // 登录时一般不会升级，但你可以自定义逻辑
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "获取等级信息失败" });
  }
};

// 给用户加经验(测试)
export const addExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "用户不存在" });

    const { experience } = req.body;
    if (experience <= 0)
      return res.status(400).json({ message: "经验值必须大于0" });

    user.experience += experience;
    await user.save();
    return res.json({ message: "经验值增加成功", experience: user.experience });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "增加经验值失败" });
  }
};

// 更新用户卡槽（测试）
export const updateSlot = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shortCardSlot, longCardSlot } = req.body;

    // 校验输入值（允许设置为0，但不能为 undefined）
    const updateFields = {};
    if (typeof shortCardSlot === "number")
      updateFields.shortCardSlot = shortCardSlot;
    if (typeof longCardSlot === "number")
      updateFields.longCardSlot = longCardSlot;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "请输入要设置的卡槽数量" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "用户不存在" });
    }

    return res.json({
      message: "卡槽数量已更新",
      shortCardSlot: updatedUser.shortCardSlot,
      longCardSlot: updatedUser.longCardSlot,
    });
  } catch (err) {
    console.error("❌ 更新卡槽失败：", err);
    return res.status(500).json({ message: "服务器错误" });
  }
};
