// server/controllers/levelController.js

import User from "../models/User.js";
import Level from "../models/Level.js";
import Task from "../models/Task.js";
import { calculateReward } from "../utils/TaskRewardCalculator.js";
import eventBus from "../events/eventBus.js";
import { SyncTaskHistory, SyncUser } from "../path/to/sync/functions.js";

export const handleTaskCompletion = async (req) => {
  try {
    const { taskId } = req.body;
    const userId = req.user._id;

    console.log(
      `Processing task completion - Task ID: ${taskId}, userID: ${userId}`
    );

    const task = await Task.findById(taskId).populate("cardUsed");
    if (!task || task.user.toString() !== userId.toString()) {
      console.error(
        `Task is invalid or does not belong to the current user – Task ID: ${taskId}, User ID: ${userId}`
      );
      return {
        success: false,
        message: "Task is invalid or does not belong to the current user",
        reward: { expGained: 0, goldGained: 0 },
      };
    }

    console.log(
      `Task details - Title:: ${task.title}, type: ${task.type}, status: ${task.status}, The award is already claimed: ${task.rewardClaimed}`
    );

    if (task.rewardClaimed === true) {
      console.log(
        `Task ${taskId} already completed and reward claimed; skipping`
      );
      throw new Error("Task has already been completed and reward claimed");
    }

    // Find user information
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found – User ID: ${userId}`);
      return {
        success: false,
        message: "User not found",
        reward: { expGained: 0, goldGained: 0 },
      };
    }

    console.log(
      `User info - Level: ${user.level}, EXP: ${user.experience}, Gold: ${user.gold}`
    );

    let totalExp = 0;
    let totalGold = 0;
    let pendingSubTasks = [];
    let pendingSubTasksExp = 0;
    let pendingSubTasksGold = 0;
    let finalExp = 0;
    let finalGold = 0;

    if (task.type === "long") {
      const completedSubTasks = task.subTasks.filter(
        (st) => st.status === "completed"
      );
      pendingSubTasks = task.subTasks.filter((st) => st.status !== "completed");

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
      console.log(
        "Long-term task completion - Pending subtasks:",
        pendingSubTasks.length
      );

      pendingSubTasksExp = 0;
      pendingSubTasksGold = 0;

      for (const subTask of pendingSubTasks) {
        subTask.status = "completed";
        subTask.completedAt = new Date();

        const subTaskExp = subTask.experience || 10;
        const subTaskGold = subTask.gold || 5;

        const { experience, gold } = calculateReward(
          subTaskExp,
          subTaskGold,
          task.cardUsed?.bonus
        );

        pendingSubTasksExp += experience;
        pendingSubTasksGold += gold;

        console.log(
          `Automatically completed subtask: ${subTask.title}, gained ${experience} XP, ${gold} Gold`
        );
      }

      if (task.status !== "completed") {
        task.status = "completed";
        console.log(`Setting task ${taskId} status to "completed"`);
      }

      if (!task.completedAt) {
        task.completedAt = new Date();
        console.log(
          `Setting task ${taskId} completedAt to ${task.completedAt}`
        );
      }

      // Calculate extra rewards for long-term tasks
      const bonusExp = task.experienceReward || task.finalBonusExperience || 30;
      const bonusGold = task.goldReward || task.finalBonusGold || 15;

      console.log("Long-term task bonus - XP:", bonusExp);
      console.log("Long-term task bonus - Gold:", bonusGold);

      const { experience: calculatedFinalExp, gold: calculatedFinalGold } =
        calculateReward(bonusExp, bonusGold, task.cardUsed?.bonus);

      finalExp = calculatedFinalExp;
      finalGold = calculatedFinalGold;

      console.log("Long-term task bonus (with multiplier) - XP:", finalExp);
      console.log("Long-term task bonus (with multiplier) - Gold:", finalGold);

      // If all subtasks are already completed, only give the bonus reward; otherwise give the sum of unfinished-subtask rewards + bonus reward
      if (pendingSubTasks.length === 0 && completedSubTasks.length > 0) {
        // All subtasks have been completed, only give the bonus reward (long-term task completion reward)
        console.log("All subtasks have been completed, only give the bonus reward");
        totalExp = finalExp;
        totalGold = finalGold;
        console.log("Final reward (only bonus) – XP:", totalExp, "Gold:", totalGold);
      } else {
        totalExp = pendingSubTasksExp + finalExp;
        totalGold = pendingSubTasksGold + finalGold;
        console.log("Total reward – XP:", totalExp, "(subtasks:", pendingSubTasksExp, "+ task bonus:", finalExp, ")");
        console.log("Total reward – Gold:", totalGold, "(subtasks:", pendingSubTasksGold, "+ task bonus:", finalGold, ")");
      }
    } else if (task.type === "short") {
      if (task.status !== "completed") {
        task.status = "completed";
        console.log(`Setting short task ${taskId} status to "completed"`);
      }

      if (!task.completedAt) {
        task.completedAt = new Date();
        console.log(
          `Setting short task ${taskId} completedAt to ${task.completedAt}`
        );
      }

      const baseExp = task.experienceReward || 10;
      const baseGold = task.goldReward || 5;

      console.log("Short task reward - XP:", baseExp);
      console.log("Short task reward - Gold:", baseGold);

      const { experience, gold } = calculateReward(
        baseExp,
        baseGold,
        task.cardUsed?.bonus
      );

      totalExp = experience;
      totalGold = gold;

      console.log("Final short task reward - XP:", totalExp);
      console.log("Final short task reward - Gold:", totalGold);
    }

    user.experience += totalExp;
    user.gold += totalGold;

    task.rewardClaimed = true;

    await user.save();
    await task.save();

    await SyncTaskHistory({ user, task, exp: totalExp, gold: totalGold });
    await SyncUser(user);

    console.log(
      `Reward has been issued – User: ${userId}, gained ${totalExp} XP, ${totalGold} Gold`
    );

    const newExp = user.experience;
    const currentLevel = await Level.findOne({
      expRequired: { $lte: newExp },
    }).sort({ level: -1 });

    if (!currentLevel) {
      console.log("Warning: Could not find current level for user");
      return {
        success: false,
        message: "Could not find level information",
        reward: { expGained: totalExp, goldGained: totalGold },
      };
    }

    const leveledUp = currentLevel.level > user.level;

    if (leveledUp) {
      user.level = currentLevel.level;
      await user.save();
      console.log(`Level up！New Level: ${currentLevel.level}`);
    }

    // to calculate required EXP to the next level
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
    eventBus.emit("checkAchievements", userId);

    const responseData = {
      success: true,
      message: "Rewards and level updated successfully",
      task: {
        _id: task._id,
        title: task.title,
        type: task.type,
        status: task.status,
        completedAt: task.completedAt,
        rewardClaimed: true,
        experienceReward: task.experienceReward,
        goldReward: task.goldReward,
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

    if (task.type === "long") {
      const allSubTasksCompleted = pendingSubTasks.length === 0;
      const alreadyCompletedSubTasksCount = task.subTasks.filter(
        (st) => st.status === "completed" && st.completedAt < task.completedAt
      ).length;

      responseData.longTaskInfo = {
        totalSubTasks: task.subTasks.length,
        allSubTasksCompleted,
        alreadyCompletedSubTasksCount,
        finalBonusExperience: finalExp,
        finalBonusGold: finalGold,
      };

      if (pendingSubTasks && pendingSubTasks.length > 0) {
        responseData.autoCompletedSubTasks = pendingSubTasks.map((st) => ({
          title: st.title,
          completedAt: st.completedAt,
        }));
        responseData.pendingSubTasksExp = pendingSubTasksExp || 0;
        responseData.pendingSubTasksGold = pendingSubTasksGold || 0;
      }
    }

    return responseData;
  } catch (error) {
    console.error("❌ Rewards and level update failed:", error);
    return {
      success: false,
      message: "Rewards and level update failed: " + error.message,
      reward: {
        expGained: task?.experienceReward || 30,
        goldGained: task?.goldReward || 15,
      },
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
      console.log(
        "All subtasks completed. The user must manually click the 'complete' button to finish the task and claim the bonus reward."
      );
    }

    // 9. Save changes to user and task
    await user.save();
    await task.save();
    eventBus.emit("checkAchievements", userId);

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
        experienceReward: task.experienceReward,
        goldReward: task.goldReward,
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
    throw error; // Re-throw to be handled by the calling route
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
    return res
      .status(500)
      .json({ message: "Failed to retrieve level information" });
  }
};

// Grant user experience (for testing)
export const addExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { experience } = req.body;
    if (experience <= 0)
      return res
        .status(400)
        .json({ message: "Experience value must be greater than 0" });

    user.experience += experience;
    await user.save();
    return res.json({
      message: "Experience increased successfully",
      experience: user.experience,
    });
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
      return res
        .status(400)
        .json({ message: "Please specify slot values to update" });
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
