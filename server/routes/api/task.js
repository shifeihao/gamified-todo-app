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
    unequipTask
  } from '../../controllers/taskController.js';
  
import { protect } from '../../middleware/auth.js';
  

// 所有任务路由都需要认证
router.use(protect);

// 获取已装备的任务
// 注意：这个路由必须放在/:id路由之前，否则会被误认为是id为'equipped'的任务
router.route('/equipped')
  .get(getEquippedTasks);

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