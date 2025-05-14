// server/controllers/levelController.js

import User from "../models/User.js";
import Level from "../models/Level.js";
import Task from "../models/Task.js";
import { calculateReward } from "../utils/TaskRewardCalculator.js";
import { SyncTaskHistory, SyncUser } from "../utils/userStatsSync.js";

export const handleTaskCompletion = async (req) => {
  try {
    const { taskId } = req.body;
    const userId = req.user._id;

    console.log(`Processing task completion - Task ID: ${taskId}, userID: ${userId}`);

    const task = await Task.findById(taskId).populate("cardUsed");
    if (!task || task.user.toString() !== userId.toString()) {
      console.error(`任务无效或不属于当前用户 - 任务ID: ${taskId}, 用户ID: ${userId}`);
      return {
        success: false,
        message: "Task is invalid or does not belong to the current user",
        reward: { expGained: 0, goldGained: 0 }
      };
    }

    console.log(
      `Task details - Title:: ${task.title}, type: ${task.type}, status: ${task.status}, The award is already claimed: ${task.rewardClaimed}`
    );

    if (task.rewardClaimed === true) {
      console.log(`Task ${taskId} already completed and reward claimed; skipping`);
      throw new Error("Task has already been completed and reward claimed");
    }

    // 查找用户信息
    const user = await User.findById(userId);
    if (!user) {
      console.error(`用户不存在 - 用户ID: ${userId}`);
      return {
        success: false,
        message: "User not found",
        reward: { expGained: 0, goldGained: 0 }
      };
    }

    console.log(
      `User info - Level: ${user.level}, EXP: ${user.experience}, Gold: ${user.gold}`
    );

    let totalExp = 0;
    let totalGold = 0;

    if (task.type === "long") {
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

      if (task.status !== "completed") {
        task.status = "completed";
        console.log(`Setting task ${taskId} status to "completed"`);
      }

      if (!task.completedAt) {
        task.completedAt = new Date();
        console.log(`Setting task ${taskId} completedAt to ${task.completedAt}`);
      }

      const bonusExp = task.experienceReward || task.finalBonusExperience || 30;
      const bonusGold = task.goldReward || task.finalBonusGold || 15;

      console.log("Long-term task bonus - XP:", bonusExp);
      console.log("Long-term task bonus - Gold:", bonusGold);

      const { experience: finalExp, gold: finalGold } = calculateReward(
        bonusExp,
        bonusGold,
        task.cardUsed?.bonus
      );

      console.log("Long-term task bonus (with multiplier) - XP:", finalExp);
      console.log("Long-term task bonus (with multiplier) - Gold:", finalGold);

      totalExp = finalExp;
      totalGold = finalGold;
    } else {
      task.finalBonusExperience = 0;
      task.finalBonusGold = 0;
      const baseExp = task.experienceReward || 10; // 默认短期任务经验为10
      const baseGold = task.goldReward || 5; // 默认短期任务金币为5
      
      console.log("Short-term task base reward - XP:", baseExp, "Gold:", baseGold);
      
      const { experience, gold } = calculateReward(
        baseExp,
        baseGold,
        task.cardUsed?.bonus
      );
      
      console.log("Short-term task final reward (with multiplier) - XP:", experience, "Gold:", gold);
      
      totalExp = experience;
      totalGold = gold;
    }

    task.status = "completed";
    task.completedAt = task.completedAt || new Date();
    task.rewardClaimed = true;

    console.log(
      `Issuing rewards to user ${userId} : ${totalExp} XP, ${totalGold} Gold`
    );

    user.experience += totalExp;
    user.gold += totalGold;

    console.log(
      `Updated user state - EXP: ${user.experience} (+${totalExp}), Gold: ${user.gold} (+${totalGold})`
    );

    const newExp = user.experience;

    const currentLevel = await Level.findOne({
      expRequired: { $lte: newExp },
    }).sort({ level: -1 });
    const nextLevel = await Level.findOne({ level: currentLevel.level + 1 });

    const nextLevelExp = nextLevel
      ? nextLevel.expRequired
      : currentLevel.expRequired + (currentLevel.expToNext || 100);
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
    return {
      success: false,
      message: "Rewards and level update failed: " + error.message,
      reward: { expGained: 0, goldGained: 0 }
    };
  }
};

export const handleSubTaskCompletion = async (req) => {
  try {
    const userId = req.user._id;
    const { taskId, subTaskIndex } = req.body;

    const task = await Task.findById(taskId).populate("cardUsed");
    if (!task || task.user.toString() !== userId.toString()) {
      throw new Error("Task is invalid or does not belong to the current user");
    }

    if (task.type !== "long" || !task.subTasks[subTaskIndex]) {
      throw new Error("Invalid task type or subtask index");
    }

    // Return error if subtask is already completed
    if (task.subTasks[subTaskIndex].status === "completed") {
      throw new Error("Subtask already completed");
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // 2.  Mark the subtask as completed
    task.subTasks[subTaskIndex].status = "completed";
    task.subTasks[subTaskIndex].completedAt = new Date();

    // 3. Calculate subtask reward (same as short task)
    const subTaskExp = task.subTasks[subTaskIndex].experience || 10;
    const subTaskGold = task.subTasks[subTaskIndex].gold || 5;

    // 4. Apply card bonus if available
    const { experience, gold } = calculateReward(
      subTaskExp,
      subTaskGold,
      task.cardUsed?.bonus
    );

    // 5. Grant rewards to the user
    user.experience += experience;
    user.gold += gold;

    // 6. Calculate level and experience progress
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

    // 7. Check whether all subtasks are completed
    const allSubTasksCompleted = task.subTasks.every(
      (sub) => sub.status === "completed"
    );

    let longTaskReward = null;

    // 8. If all subtasks are done, mark the main task as completed without granting bonus rewards
    if (allSubTasksCompleted && task.status !== "completed") {
      // Mark the main task status as completed
      task.status = "completed";
      task.completedAt = new Date();

      console.log(
  "All subtasks completed. Marking long task as completed. User must manually claim the bonus reward."
);
    }

    // 9. Save changes to user and task
    await user.save();
    await task.save();

    // 10. Return result to caller
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

// Retrieve user level progress bar data
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
      leveledUp: false, // Usually not leveled up at login, but you can customize this logic
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to retrieve level information" });
  }
};

// Grant user experience (for testing)
export const addExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { experience } = req.body;
    if (experience <= 0)
      return res.status(400).json({ message: "Experience value must be greater than 0"  });

    user.experience += experience;
    await user.save();
    return res.json({ message: "Experience increased successfully", experience: user.experience });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add experience" });
  }
};

// Update user card slots (for testing)
export const updateSlot = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shortCardSlot, longCardSlot } = req.body;

    // Validate input (0 is allowed, but undefined is not)
    const updateFields = {};
    if (typeof shortCardSlot === "number")
      updateFields.shortCardSlot = shortCardSlot;
    if (typeof longCardSlot === "number")
      updateFields.longCardSlot = longCardSlot;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "Please specify slot values to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "Card slot count updated successfully",
      shortCardSlot: updatedUser.shortCardSlot,
      longCardSlot: updatedUser.longCardSlot,
    });
  } catch (err) {
    console.error(" Failed to update card slots:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
