import Task from "../models/Task.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import {
  addDeletedTasksNum,
  addEditedTasksNum,
} from "../utils/userStatsSync.js";
import eventBus from "../events/eventBus.js";


// @desc    get all tasks from the current user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    create new tasks
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
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

    const Card = (await import("../models/Card.js")).default;
    const card = await Card.findOne({
      _id: req.body.cardUsed,
      user: req.user._id,
      used: false, 
    });

    if (!card) {
      return res.status(400).json({
        message: "The specified card does not exist or has already been used",
      });
    }

    if (
      card.taskDuration !== "general" &&
      card.taskDuration !== req.body.type
    ) {
      return res.status(400).json({
        message: `This card only supports ${card.taskDuration} type tasks and cannot be used for ${req.body.type} type tasks`,
      });
    }

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

    let taskDueDate = req.body.dueDate;
    if (req.body.type === "short") {
      const now = new Date();
      now.setHours(now.getHours() + 24);
      taskDueDate = now.toISOString();
    }

    const task = await Task.create({
      user: req.user._id,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      category: req.body.category,
      dueDate: taskDueDate, 
      experienceReward: req.body.experienceReward,
      goldReward: req.body.goldReward,
      subTasks: req.body.subTasks || [],
      cardUsed: req.body.cardUsed,
    });

    card.used = true;
    await card.save();

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

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No permission" });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("cardUsed");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No permission" });
    }

    if (req.body.subTasks) {
      if (
        task.type === "long" &&
        (!Array.isArray(req.body.subTasks) || req.body.subTasks.length === 0)
      ) {
        return res
          .status(400)
          .json({ message: "Long tasks must contain at least one subtask" });
      }

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

    const { subTaskIndex } = req.body;
    if (subTaskIndex !== undefined) {
      if (!task.subTasks[subTaskIndex]) {
        return res.status(404).json({ message: "Subtask does not exist" });
      }

      if (task.subTasks[subTaskIndex].status === "completed") {
        return res
          .status(400)
          .json({ message: "Subtask has already been completed" });
      }

      const { handleSubTaskCompletion } = await import("./levelController.js");
      const result = await handleSubTaskCompletion({
        user: req.user,
        body: {
          taskId: task._id.toString(),
          subTaskIndex,
        },
      });

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

    const oldStatus = task.status; 

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.type = req.body.type || task.type;
    task.status = req.body.status ? req.body.status.toLowerCase() : task.status;
    task.category = req.body.category || task.category;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.experienceReward = req.body.experienceReward || task.experienceReward;
    task.goldReward = req.body.goldReward || task.goldReward;

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

      task.completedAt = task.completedAt || Date.now();
      
      if (task.equipped) {
        task.equipped = false;
        task.slotPosition = -1; 
        console.log(`已自动将完成的任务 ${task._id} 卸下装备`);
      }
      
      await task.save(); 
      
      try {
        console.log("Task ID:", task._id); 
        console.log("ID passed to handleTaskCompletion:", task._id?.toString());
        const { handleTaskCompletion } = await import("./levelController.js");

        rewardResult = await handleTaskCompletion({
          user: req.user,
          body: { taskId: task._id.toString() },
        });

        console.log("Results of dealing with awards from finishing tasks:", rewardResult);
        if (rewardResult && !rewardResult.reward) {
          rewardResult.reward = {
            expGained:
              task.experienceReward || (task.type === "long" ? 30 : 10),
            goldGained: task.goldReward || (task.type === "long" ? 15 : 5),
          };
        }
      } catch (err) {
        console.error("Failed to deal with task finish:", err);
        rewardResult = {
          success: false,
          message: err.message || "Failed to deal with task finish",
          task: task.toObject(),
          reward: {
            expGained:
              task.experienceReward || (task.type === "long" ? 30 : 10),
            goldGained: task.goldReward || (task.type === "long" ? 15 : 5),
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
      task: updatedTask.toObject(), 
      reward: rewardResult,
      success: rewardResult ? rewardResult.success !== false : true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("cardUsed");
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "No permission" });

    if (task.cardUsed) {
      await User.findByIdAndUpdate(task.user, {
        $pull: { cardInventory: task.cardUsed._id },
      });
      await task.cardUsed.deleteOne();
    }

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

const getTaskHistory = asyncHandler(async (req, res) => {
  const TaskHistory = (await import("../models/TaskHistory.js")).default;
  const records = await TaskHistory.find({ user: req.user.id }).sort({
    completedAt: -1,
  });
  res.json(records);
});

const getEquippedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      equipped: true,
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const equipTask = async (req, res) => {
  try {
    const { slotPosition, slotType } = req.body;
    if (slotPosition === undefined || slotPosition < 0 || slotPosition > 2) {
      return res.status(400).json({ message: "Invalid task slot position" });
    }
    if (!["short", "long"].includes(slotType)) {
      return res.status(400).json({ message: "Invalid slot type" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No permission" });
    }
    const expectedType = slotType === "long" ? "long" : "short";
    if (task.type !== expectedType) {
      return res
        .status(400)
        .json({ message: `Can only equip ${expectedType} tasks to this slot` });
    }

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
    task.equipped = true;
    task.slotPosition = slotPosition;
    task.slotEquippedAt = Date.now();
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

const unequipTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No permission" });
    }

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
