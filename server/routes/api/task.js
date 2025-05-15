import express from "express";
const router = express.Router();

import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getEquippedTasks,
  equipTask,
  unequipTask,
  getTaskHistory,
} from "../../controllers/taskController.js";

import { protect } from "../../middleware/auth.js";
import { handleTaskCompletion } from "../../controllers/levelController.js";
import Task from "../../models/Task.js";

router.use(protect);

// Get the equipped tasks
router.route("/equipped").get(getEquippedTasks);
// Get the task history
router.route("/history").get(getTaskHistory);
// Get the task history by user ID
router.route("/:id/complete").post(async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        message: "cannot find task",
        success: false,
        reward: { expGained: 30, goldGained: 15 },
      });
    }
    // check if the task is already completed
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "no permission to complete this task",
        success: false,
        reward: { expGained: 30, goldGained: 15 },
      });
    }
    // check if the task is already completed
    const result = await handleTaskCompletion({
      user: req.user,
      body: { taskId },
    });

    // if the task is equipped, unequip it
    if (task.equipped) {
      task.equipped = false;
      task.slotPosition = -1;
      await task.save();
    }

    res.json(result);
  } catch (error) {
    let defaultReward = { expGained: 30, goldGained: 15 };
    try {
      const task = await Task.findById(req.params.id);
      if (task) {
        defaultReward = {
          expGained: task.experienceReward || 30,
          goldGained: task.goldReward || 15,
        };
      }
    } catch (findError) {
      console.error("fail to get long-term task:", findError);
    }

    res.status(500).json({
      message: error.message || "Server error",
      success: false,
      reward: defaultReward,
    });
  }
});

// get all tasks
router.route("/").get(getTasks).post(createTask);

// get task by id
router.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);

// equip a task
router.route("/:id/equip").put(equipTask);

// unequip a task
router.route("/:id/unequip").put(unequipTask);

export default router;
