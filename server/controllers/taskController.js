import Task from "../models/Task.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import {
  addDeletedTasksNum,
  addEditedTasksNum,
} from "../utils/userStatsSync.js";
import eventBus from "../events/eventBus.js";


// @desc    Get all tasks for the current user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).populate("cardUsed");
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    // Verify required fields
    console.log(req.body);
    if (!req.body.title || !req.body.experienceReward || !req.body.goldReward) {
      return res
        .status(400)
        .json({ message: "Missing required task information" });
    }
    if (!req.body.cardUsed) {
      return res
        .status(400)
        .json({ message: "Must specify a card to use (cardUsed)" });
    }

    // Verify that the card exists and is usable
    const Card = (await import("../models/Card.js")).default;
    const card = await Card.findOne({
      _id: req.body.cardUsed,
      user: req.user._id,
      used: false, // Make sure the card has not been used
    });

    if (!card) {
      return res.status(400).json({
        message: "The specified card does not exist or has already been used",
      });
    }

    // Verify that the card type matches the task type
    if (
      card.taskDuration !== "general" &&
      card.taskDuration !== req.body.type
    ) {
      return res.status(400).json({
        message: `This card only supports ${card.taskDuration} type tasks and cannot be used for ${req.body.type} type tasks`,
      });
    }

    // If it is a long-term task, verify the subtask
    if (req.body.type === "long") {
      if (
        !req.body.subTasks ||
        !Array.isArray(req.body.subTasks) ||
        req.body.subTasks.length === 0
      ) {
        return res.status(400).json({
          message: "Long-term tasks must include at least one subtask",
        });
      }

      // Verify each subtask
      for (const subTask of req.body.subTasks) {
        if (!subTask.title || !subTask.title.trim()) {
          return res
            .status(400)
            .json({ message: "Subtasks must include a title" });
        }
        if (!subTask.dueDate) {
          return res
            .status(400)
            .json({ message: "Subtasks must have a deadline" });
        }
      }
    }

    // Automatically set the deadline for short-term tasks to the creation time + 24 hours
    let taskDueDate = req.body.dueDate;
    if (req.body.type === "short") {
      const now = new Date();
      now.setHours(now.getHours() + 24);
      taskDueDate = now.toISOString();
    }

    // Create tasks using task data from the front end
    const task = await Task.create({
      user: req.user._id,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      category: req.body.category,
      dueDate: taskDueDate, // Use automatically calculated or front-end passed deadline
      experienceReward: req.body.experienceReward,
      goldReward: req.body.goldReward,
      subTasks: req.body.subTasks || [],
      cardUsed: req.body.cardUsed,
    });

    // Mark card as used
    card.used = true;
    await card.save();

    // If it is a blank card, decrement the count from the user's inventory
    if (card.type === "blank") {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { "dailyCards.blank": -1 },
      });
    }

    //update user stats
    eventBus.emit("checkAchievements", req.user._id);

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get a single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // Check if the task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the task belongs to the current user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No permission" });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update task or subtask status
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("cardUsed");
    // Check if the task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    // Check if the task belongs to the current user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No permission" });
    }

    // If the update contains a list of subtasks, verify
    if (req.body.subTasks) {
      if (
        task.type === "long" &&
        (!Array.isArray(req.body.subTasks) || req.body.subTasks.length === 0)
      ) {
        return res
          .status(400)
          .json({ message: "Long tasks must contain at least one subtask" });
      }

      // Verify each subtask
      for (const subTask of req.body.subTasks) {
        if (!subTask.title || !subTask.title.trim()) {
          return res
            .status(400)
            .json({ message: "Subtask must contain a title" });
        }
        if (!subTask.dueDate) {
          return res
            .status(400)
            .json({ message: "Subtask must have a deadline" });
        }
      }
    }

    // Handle subtask completion
    const { subTaskIndex } = req.body;
    if (subTaskIndex !== undefined) {
      // Check if a subtask exists
      if (!task.subTasks[subTaskIndex]) {
        return res.status(404).json({ message: "Subtask does not exist" });
      }

      // Check if a subtask is completed
      if (task.subTasks[subTaskIndex].status === "completed") {
        return res
          .status(400)
          .json({ message: "Subtask has already been completed" });
      }

      // Call the subtask completion processing function
      const { handleSubTaskCompletion } = await import("./levelController.js");
      const result = await handleSubTaskCompletion({
        user: req.user,
        body: {
          taskId: task._id.toString(),
          subTaskIndex,
        },
      });

      // Check if all subtasks are completed
      const allSubTasksCompleted = task.subTasks.every(
        (st) => st.status === "completed" || st === task.subTasks[subTaskIndex]
      );

      return res.json({
        message: allSubTasksCompleted
          ? "Subtask completed! All subtasks have been completed, click the Complete Task button to get additional rewards"
          : "Subtask completed",
        task: result.task,
        subTaskReward: result.subTaskReward,
        longTaskReward: result.longTaskReward,
        allSubTasksCompleted: allSubTasksCompleted,
      });
    }

    // Prioritize subtask status updates
    const { subTaskId, status } = req.body;
    if (subTaskId && status) {
      const sub = task.subTasks.id(subTaskId);
      if (!sub) {
        return res.status(404).json({ message: "Subtask not found" });
      }
      sub.status = status.toLowerCase();
      await task.save();
      return res.json(sub);
    }

    const oldStatus = task.status; // Record original status
    // Update the main task field

    // Update Task Fields
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.type = req.body.type || task.type;
    task.status = req.body.status ? req.body.status.toLowerCase() : task.status;
    task.category = req.body.category || task.category;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.experienceReward = req.body.experienceReward || task.experienceReward;
    task.goldReward = req.body.goldReward || task.goldReward;

    // Update subtask list (if provided)
    if (req.body.subTasks) {
      task.subTasks = req.body.subTasks;
    }

    if (req.body.equipped !== undefined) {
      task.equipped = req.body.equipped;
    }

    if (req.body.slotPosition !== undefined) {
      task.slotPosition = req.body.slotPosition;
    }

    let rewardResult = null;

    if (
      req.body.status &&
      req.body.status.toLowerCase() === "completed" &&
      oldStatus !== "completed"
    ) {
      // If the main task becomes completed, process the reward and history
      if (
        task.type === "short" &&
        task.slotEquippedAt &&
        Date.now() - new Date(task.slotEquippedAt).getTime() >
          24 * 60 * 60 * 1000
      ) {
        task.status = "expired";
        await task.save();
        return res.status(400).json({
          message: "The short-term task has expired and cannot be completed",
        });
      }

      // Only set the completion time, but do not mark the reward as received, and let handleTaskCompletion handle the reward distribution
      task.completedAt = task.completedAt || Date.now();
      
      // Automatically remove after task is completed
      if (task.equipped) {
        task.equipped = false;
        task.slotPosition = -1;
        console.log(`Automatically unequipped completed task ${task._id}`);
      }
      
      await task.save(); // ✅ Save updates (including status field and equipment status)
      
      try {
        console.log("Task ID:", task._id); // Should be ObjectId type
        console.log("ID passed to handleTaskCompletion:", task._id?.toString());
        // ✅ Call handleTaskCompletion and receive the return value
        const { handleTaskCompletion } = await import("./levelController.js");

        rewardResult = await handleTaskCompletion({
          user: req.user,
          body: { taskId: task._id.toString() },
        });

        console.log("Task completion reward processing results:", rewardResult);
        if (rewardResult && !rewardResult.reward) {
          // Make sure the reward object exists
          rewardResult.reward = {
            expGained:
              task.experienceReward || (task.type === "long" ? 30 : 30),
            goldGained: task.goldReward || (task.type === "long" ? 15 : 15),
          };
        }
      } catch (err) {
        console.error("Failed to process task completion reward:", err);
        // Don't prevent updating task status even if it fails, provide default reward value
        rewardResult = {
          success: false,
          message: err.message || "Failed to process task completion reward",
          task: task.toObject(),
          reward: {
            expGained:
              task.experienceReward || (task.type === "long" ? 30 : 30),
            goldGained: task.goldReward || (task.type === "long" ? 15 : 15),
          },
        };
      }
    }

    const updatedTask = await task.save();

    // addEditedTasksNum
    await addEditedTasksNum(req.user._id);
    //update user stats
    eventBus.emit("checkAchievements", req.user._id);


    return res.json({
      message: "Task updated",
      task: updatedTask.toObject(), // 👈 Make sure _id exists as a string
      reward: rewardResult,
      success: rewardResult ? rewardResult.success !== false : true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc Delete the task (and archive it to history)
// @route DELETE /api/tasks/:id
// @access Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("cardUsed");
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "No permission" });

    // Remove from user card inventory
    if (task.cardUsed) {
      await User.findByIdAndUpdate(task.user, {
        $pull: { cardInventory: task.cardUsed._id },
      });
      await task.cardUsed.deleteOne();
    }

    // Delete the task itself
    await task.deleteOne();
    res.json({ message: "Task archived and deleted" });

    // addDeletedTasksNum
    await addDeletedTasksNum(req.user._id);
    //update user stats
    eventBus.emit("checkAchievements", req.user._id);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get user task history
// @route GET /api/tasks/history
// @access Private
const getTaskHistory = asyncHandler(async (req, res) => {
  const TaskHistory = (await import("../models/TaskHistory.js")).default;
  const records = await TaskHistory.find({ user: req.user.id }).sort({
    completedAt: -1,
  });
  res.json(records);
});

// @desc    Get equipped tasks
// @route   GET /api/tasks/equipped
// @access  Private
const getEquippedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      equipped: true,
    }).populate("cardUsed");
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Equip the task to the task slot
// @route   PUT /api/tasks/:id/equip
// @access  Private
const equipTask = async (req, res) => {
  try {
    const { slotPosition, slotType } = req.body;
    // Verify slot location
    if (slotPosition === undefined || slotPosition < 0 || slotPosition > 2) {
      return res.status(400).json({ message: "Invalid task slot position" });
    }
    // Verify slot type
    if (!["short", "long"].includes(slotType)) {
      return res.status(400).json({ message: "Invalid slot type" });
    }

    // Find quests to equip
    const task = await Task.findById(req.params.id);
    // Check if the task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    // Check if the task belongs to the current user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No permission" });
    }
    // Check if the task type matches the slot type
    const expectedType = slotType === "long" ? "long" : "short";
    if (task.type !== expectedType) {
      return res
        .status(400)
        .json({ message: `Can only equip ${expectedType} tasks to this slot` });
    }

    // Check if there is a task of the same type in this slot
    const existingTask = await Task.findOne({
      user: req.user._id,
      equipped: true,
      slotPosition,
      type: expectedType,
    });

    if (existingTask && existingTask._id.toString() !== task._id.toString()) {
      return res
        .status(400)
        .json({ message: "This slot is occupied by a task of the same type" });
    }
    // New quests for equipment
    task.equipped = true;
    task.slotPosition = slotPosition;
      // Record equipment time
    task.slotEquippedAt = Date.now();
    // If the task status is pending, it will automatically be updated to in progress.
    if (task.status === "pending") {
      task.status = "in-progress";
    }
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Remove equipped tasks
// @route   PUT /api/tasks/:id/unequip
// @access  Private
const unequipTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // Check if the task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if the task belongs to the current user
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No permission" });
    }

    // Unload Task
    task.equipped = false;
    task.slotPosition = -1;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getEquippedTasks,
  equipTask,
  unequipTask,
  getTaskHistory,
};
