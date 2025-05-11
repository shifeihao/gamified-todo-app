import express from 'express';
const router = express.Router();

import {
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate
} from '../../controllers/taskTemplateController.js';

import { protect } from '../../middleware/auth.js';
import TaskTemplate from '../../models/TaskTemplate.js';

// 测试路由 - 获取所有模板（不需要认证）
router.get('/test', async (req, res) => {
  try {
    const templates = await TaskTemplate.find({});
    console.log('Test route - Found templates:', templates);
    res.json(templates);
  } catch (error) {
    console.error('Test route - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 所有模板路由都需要认证
router.use(protect);

// 获取所有模板和创建模板
router.route('/')
  .get(getTemplates)
  .post(createTemplate);

// 获取、更新和删除单个模板
router.route('/:id')
  .get(getTemplateById)
  .put(updateTemplate)
  .delete(deleteTemplate);

export default router; 