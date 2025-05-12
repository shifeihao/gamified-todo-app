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
      const result = await handleTaskCompletion({
        user: req.user,
        body: { taskId }
      });
      res.json(result);
    } catch (error) {
      console.error("完成长期任务失败:", error);
      res.status(500).json({ message: error.message || "Server error" });
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