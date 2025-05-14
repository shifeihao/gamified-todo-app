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
    getTaskHistory
  } from '../../controllers/taskController.js';
  
import { protect } from '../../middleware/auth.js';
import { handleTaskCompletion } from '../../controllers/levelController.js';
import Task from '../../models/Task.js';

// 所有任务路由都需要认证
router.use(protect);

// 获取已装备的任务
// 注意：这个路由必须放在/:id路由之前，否则会被误认为是id为'equipped'的任务
router.route('/equipped')
  .get(getEquippedTasks);

// 获取历史记录（可分页）
router.route('/history')
    .get(getTaskHistory);

// 专门用于处理长期任务完成的路由
router.route('/:id/complete')
  .post(async (req, res) => {
    try {
      const taskId = req.params.id;
      
      // 先获取任务信息
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ 
          message: "任务未找到",
          success: false,
          reward: { expGained: 30, goldGained: 15 }
        });
      }
      
      // 检查任务是否属于当前用户
      if (task.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: "没有权限",
          success: false,
          reward: { expGained: 30, goldGained: 15 }
        });
      }
      
      // 执行任务完成逻辑
      const result = await handleTaskCompletion({
        user: req.user,
        body: { taskId }
      });
      
      // 如果任务处于已装备状态，自动卸下
      if (task.equipped) {
        task.equipped = false;
        task.slotPosition = -1;
        await task.save();
        console.log(`长期任务完成后自动卸下: ${taskId}`);
      }
      
      res.json(result);
    } catch (error) {
      console.error("完成长期任务失败:", error);
      // 获取尝试完成的任务信息，用于提供默认奖励
      let defaultReward = { expGained: 30, goldGained: 15 };
      try {
        const task = await Task.findById(req.params.id);
        if (task) {
          defaultReward = {
            expGained: task.experienceReward || 30,
            goldGained: task.goldReward || 15
          };
        }
      } catch (findError) {
        console.error("尝试获取默认奖励失败:", findError);
      }
      
      res.status(500).json({ 
        message: error.message || "Server error",
        success: false,
        reward: defaultReward
      });
    }
  });

// 获取所有任务和创建任务
router.route('/')
  .get(getTasks)
  .post(createTask);

// 获取、更新和删除单个任务
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// 装备任务到任务槽
router.route('/:id/equip')
  .put(equipTask);

// 卸下已装备的任务
router.route('/:id/unequip')
  .put(unequipTask);

export default router;