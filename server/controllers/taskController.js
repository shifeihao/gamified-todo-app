import Task from "../models/Task.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import {
  addDeletedTasksNum,
  addEditedTasksNum,
  checkTaskNumber,
  SyncUserStats,
} from "../utils/userStatsSync.js";

// @desc    获取当前用户的所有任务
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc    创建新任务
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    // 校验必要字段
    console.log(req.body);
    if (!req.body.title || !req.body.experienceReward || !req.body.goldReward) {
      return res.status(400).json({ message: "缺少必要的任务信息" });
    }
    if (!req.body.cardUsed) {
      return res
        .status(400)
        .json({ message: "必须指定使用的卡片（cardUsed）" });
    }

    // 如果是长期任务，验证子任务
    if (req.body.type === "长期") {
      if (
        !req.body.subTasks ||
        !Array.isArray(req.body.subTasks) ||
        req.body.subTasks.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "长期任务必须包含至少一个子任务" });
      }

      // 验证每个子任务
      for (const subTask of req.body.subTasks) {
        if (!subTask.title || !subTask.title.trim()) {
          return res.status(400).json({ message: "子任务必须包含标题" });
        }
        if (!subTask.dueDate) {
          return res.status(400).json({ message: "子任务必须设置截止时间" });
        }
      }
    }

    // 使用前端传来的任务数据创建任务
    const task = await Task.create({
      user: req.user._id,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      category: req.body.category,
      dueDate: req.body.dueDate,
      experienceReward: req.body.experienceReward,
      goldReward: req.body.goldReward,
      subTasks: req.body.subTasks || [],
      cardUsed: req.body.cardUsed,
    });

    res.status(201).json(task);

    //触发task表检查，将表记录同步到Userstats
    SyncUserStats(req.user._id);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc    获取单个任务
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // 检查任务是否存在
    if (!task) {
      return res.status(404).json({ message: "任务不存在" });
    }

    // 检查任务是否属于当前用户
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "没有权限" });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc    更新任务或子任务状态
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("cardUsed");
    // 检查任务是否存在
    if (!task) {
      return res.status(404).json({ message: "任务不存在" });
    }
    // 检查任务是否属于当前用户
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "没有权限" });
    }

    // 如果更新包含子任务列表，进行验证
    if (req.body.subTasks) {
      if (
        task.type === "long" &&
        (!Array.isArray(req.body.subTasks) || req.body.subTasks.length === 0)
      ) {
        return res
          .status(400)
          .json({ message: "Long tasks must contain at least one subtask" });
      }

      // 验证每个子任务
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

    // 处理子任务完成
    const { subTaskIndex } = req.body;
    if (subTaskIndex !== undefined) {
      // 检查子任务是否存在
      if (!task.subTasks[subTaskIndex]) {
        return res.status(404).json({ message: "Subtask does not exist" });
      }

      // 检查子任务是否已完成
      if (task.subTasks[subTaskIndex].status === "Completed") {
        return res
          .status(400)
          .json({ message: "Subtask has already been completed" });
      }

      // 调用子任务完成处理函数
      const { handleSubTaskCompletion } = await import("./levelController.js");
      const result = await handleSubTaskCompletion({
        user: req.user,
        body: {
          taskId: task._id.toString(),
          subTaskIndex,
        },
      });

      // 检查是否所有子任务都已完成
      const allSubTasksCompleted = task.subTasks.every(
        (st) => st.status === "Completed" || st === task.subTasks[subTaskIndex]
      );

      return res.json({
        message: allSubTasksCompleted
          ? "子任务完成！所有子任务已完成，点击完成长期任务按钮可获得额外奖励"
          : "子任务完成",
        task: result.task,
        subTaskReward: result.subTaskReward,
        longTaskReward: result.longTaskReward,
        allSubTasksCompleted: allSubTasksCompleted,
      });
    }

    // 优先处理子任务状态更新
    const { subTaskId, status } = req.body;
    if (subTaskId && status) {
      const sub = task.subTasks.id(subTaskId);
      if (!sub) {
        return res.status(404).json({ message: "Subtask not found" });
      }
      sub.status = status;
      await task.save();
      return res.json(sub);
    }

    const oldStatus = task.status; // 记录原始状态
    // 更新主任务字段

    // 更新任务字段
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.type = req.body.type || task.type;
    task.status = req.body.status || task.status;
    task.category = req.body.category || task.category;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.experienceReward = req.body.experienceReward || task.experienceReward;
    task.goldReward = req.body.goldReward || task.goldReward;

    // 更新子任务列表（如果提供）
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

    if (req.body.status === "Completed") {
      // 如果主任务变为已完成，处理奖励与历史记录
      if (
        task.type === "short" &&
        task.slotEquippedAt &&
        Date.now() - new Date(task.slotEquippedAt).getTime() >
          24 * 60 * 60 * 1000
      ) {
        task.status = "Overdue";
        await task.save();
        return res
          .status(400)
          .json({
            message: "The short-term task has expired and cannot be completed",
          });
      }

      task.completedAt = task.completedAt || Date.now();
      await task.save(); // ✅ 保存更新（包括 status 字段）
      console.log("任务ID:", task._id); // 应该是 ObjectId 类型
      console.log("传入 handleTaskCompletion 的 ID:", task._id?.toString());
      // ✅ 调用 handleTaskCompletion 并接收返回值
      const { handleTaskCompletion } = await import("./levelController.js");

      rewardResult = await handleTaskCompletion({
        user: req.user,
        body: { taskId: task._id.toString() },
      });
    }

    const updatedTask = await task.save();

    // 每编辑一次任务，userStats里面计数器+1
    await SyncUserStats(req.user._id);
    await addEditedTasksNum(req.user._id);

    // ✅ 最终统一响应
    return res.json({
      message: "任务已更新",
      task: updatedTask.toObject(), // 👈 确保 _id 是字符串存在的
      reward: rewardResult,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "服务器错误" });
  }
};
// @desc 删除任务（并归档到历史记录）
// @route DELETE /api/tasks/:id
// @access Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("cardUsed");
    if (!task) return res.status(404).json({ message: "任务不存在" });
    if (task.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "没有权限" });

    // 从用户卡片库存中移除
    if (task.cardUsed) {
      await User.findByIdAndUpdate(task.user, {
        $pull: { cardInventory: task.cardUsed._id },
      });
      await task.cardUsed.deleteOne();
    }

    // 删除任务本身
    await task.deleteOne();
    res.json({ message: "任务已归档并删除" });

    //删除一个任务，计数一次
    await SyncUserStats(req.user._id);
    await addDeletedTasksNum(req.user._id);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc 获取用户任务历史记录
// @route GET /api/tasks/history
// @access Private
const getTaskHistory = asyncHandler(async (req, res) => {
  const TaskHistory = (await import("../models/TaskHistory.js")).default;
  const records = await TaskHistory.find({ user: req.user.id }).sort({
    completedAt: -1,
  });
  res.json(records);
});

// @desc    获取已装备的任务
// @route   GET /api/tasks/equipped
// @access  Private
const getEquippedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      equipped: true,
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc    装备任务到任务槽
// @route   PUT /api/tasks/:id/equip
// @access  Private
const equipTask = async (req, res) => {
  try {
    const { slotPosition, slotType } = req.body;
    // 验证槽位位置
    if (slotPosition === undefined || slotPosition < 0 || slotPosition > 2) {
      return res.status(400).json({ message: "无效的任务槽位置" });
    }
    // 验证槽位类型
    if (!["short", "long"].includes(slotType)) {
      return res.status(400).json({ message: "无效的槽位类型" });
    }

    // 查找要装备的任务
    const task = await Task.findById(req.params.id);
    // 检查任务是否存在
    if (!task) {
      return res.status(404).json({ message: "任务不存在" });
    }
    // 检查任务是否属于当前用户
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "没有权限" });
    }
    // 检查任务类型是否匹配槽位类型
    const expectedType = slotType === "long" ? "long" : "short";
    if (task.type !== expectedType) {
      return res
        .status(400)
        .json({ message: `只能装备${expectedType}任务到该槽位` });
    }

    // 检查该槽位是否已有同类型任务
    const existingTask = await Task.findOne({
      user: req.user._id,
      equipped: true,
      slotPosition,
      type: expectedType,
    });

    if (existingTask && existingTask._id.toString() !== task._id.toString()) {
      return res.status(400).json({ message: "该槽位已被同类型任务占用" });
    }
    // 装备新任务
    task.equipped = true;
    task.slotPosition = slotPosition;
    // 记录装备时间
    task.slotEquippedAt = Date.now();
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc    卸下已装备的任务
// @route   PUT /api/tasks/:id/unequip
// @access  Private
const unequipTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // 检查任务是否存在
    if (!task) {
      return res.status(404).json({ message: "任务不存在" });
    }

    // 检查任务是否属于当前用户
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "没有权限" });
    }

    // 卸下任务
    task.equipped = false;
    task.slotPosition = -1;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
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
