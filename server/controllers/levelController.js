// server/controllers/levelController.js

import UserLevel from '../models/UserLevel.js';
import Level from '../models/Level.js';
import Task from '../models/Task.js';

export const handleTaskCompletion = async (req, res) => {
  try {
    const userId = req.user._id;            // 从 token 中获取的用户 ID
    const { taskId } = req.body;            // 从请求体中获取前端传回的任务 ID
    console.log('收到任务 ID：', taskId);

    // 1. 基本校验：是否提供任务 ID
    if (!taskId) {
      return res.status(400).json({ message: '缺少任务ID' });
    }

    // 2. 查询任务
    const task = await Task.findById(taskId);
    console.log('查询到的任务：', task);
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }

    // 3. 校验任务归属
    if (task.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: '无权处理该任务' });
    }

    // 4. 校验任务状态
    if (task.status !== '已完成') {
      return res.status(400).json({ message: '任务尚未完成，无法结算奖励' });
    }

    // 5. 获取奖励值（经验与金币）
    const expGained = task.experienceReward || 0;
    const goldGained = task.goldReward || 0;

    // 6. 查询用户当前等级数据
    const userLevel = await UserLevel.findOne({ userId });
    if (!userLevel) {
      return res.status(404).json({ message: '用户等级数据未找到' });
    }

    const newExp = userLevel.exp + expGained;
    console.log('新的经验值：', newExp);

   
    // 7. 查等级表中的当前等级
    const currentLevel = await Level.findOne({ expRequired: { $lte: newExp } }).sort({ level: -1 });
    console.log('当前等级数据：', currentLevel);

    // 8. 查下一级等级的数据（用于确定经验门槛）
    const nextLevel = await Level.findOne({ level: currentLevel.level + 1 });
    console.log('下一级等级数据：', nextLevel);
    const nextLevelExp = nextLevel ? nextLevel.expRequired : currentLevel.expRequired;
    console.log('下一级经验门槛：', nextLevelExp);
    // 9. 计算经验条相关字段
    const expProgress = newExp - currentLevel.expRequired;
    const expRemaining = nextLevelExp - newExp;
    const progressRate = currentLevel.expToNext > 0
      ? Math.min(expProgress / currentLevel.expToNext, 1)
      : 1;

    // 10. 判断是否升级
    const leveledUp = currentLevel.level > userLevel.level;

    // 11. 更新数据库中的 userLevel 数据
    userLevel.exp = newExp;
    userLevel.level = currentLevel.level;
    userLevel.nextLevelExp = nextLevelExp;
    userLevel.lastUpdate = new Date();
    await userLevel.save();

    // 12. 返回等级更新后的数据给前端
    return res.status(200).json({
      message: '经验更新成功',
      exp: newExp,
      level: currentLevel.level,
      nextLevelExp,
      expProgress,
      expRemaining,
      progressRate,
      leveledUp,
      expGained,
      goldGained
    });

  } catch (error) {
    console.error('❌ 任务完成经验结算失败:', error);
    res.status(500).json({ message: '服务器错误', error });
  }
};
