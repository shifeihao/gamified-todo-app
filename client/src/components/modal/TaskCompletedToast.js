import React from 'react';
import { toast } from 'react-hot-toast';

/**
 * 显示任务完成通知
 * @param {string} title 任务标题
 * @param {number} expGained 获得的经验值
 * @param {number} goldGained 获得的金币
 * @param {boolean} isSubtask 是否为子任务
 * @param {object} task 任务对象，用于获取默认奖励值
 */
export const showTaskCompletedToast = (title, expGained, goldGained, isSubtask = false, task = null) => {
  // 确保奖励值不为零，如果为零使用任务本身或默认值
  let finalXp = expGained;
  let finalGold = goldGained;
  
  if ((finalXp === 0 || finalGold === 0) && task) {
    if (finalXp === 0) {
      finalXp = task.experienceReward || (task.type === 'long' ? 30 : 10);
      console.log(`奖励XP为0，使用任务默认值: ${finalXp} XP`);
    }
    
    if (finalGold === 0) {
      finalGold = task.goldReward || (task.type === 'long' ? 15 : 5);
      console.log(`奖励Gold为0，使用任务默认值: ${finalGold} Gold`);
    }
  }
  
  // 显示通知
  toast.success(
    <div className="flex flex-col space-y-1">
      <span className="font-semibold text-sm">{isSubtask ? "Subtask Complete!" : "Quest Complete!"}</span>
      <div className="flex items-center">
        <span className="text-yellow-500 mr-1">🏅</span>
        <span className="text-xs">
          Gain <span className="font-bold text-yellow-600">{finalXp} XP</span> and
          <span className="font-bold text-amber-500"> {finalGold} Gold</span>
        </span>
      </div>
    </div>,
    { duration: 5000, position: 'top-center' }
  );
};

// 显示长期任务完成的详细通知
export const showLongTaskCompletedToast = (response, task) => {
  // 使用服务器返回的longTaskInfo判断是否所有子任务已完成
  const longTaskInfo = response.longTaskInfo || {};
  const allSubTasksCompleted = longTaskInfo.allSubTasksCompleted;
  
  // 获取服务器返回的奖励
  let totalXp = (response.reward?.expGained || 0);
  let totalGold = (response.reward?.goldGained || 0);
  
  // 如果奖励为0，使用默认值
  if (totalXp === 0) {
    totalXp = longTaskInfo.finalBonusExperience || task?.experienceReward || 30;
    console.log(`总XP奖励为0，使用任务定义值: ${totalXp}`);
  }
  
  if (totalGold === 0) {
    totalGold = longTaskInfo.finalBonusGold || task?.goldReward || 15;
    console.log(`总Gold奖励为0，使用任务定义值: ${totalGold}`);
  }
  
  // 如果有未完成的子任务被自动完成
  if (response.autoCompletedSubTasks && response.autoCompletedSubTasks.length > 0) {
    // 获取子任务奖励
    const subTaskCount = response.autoCompletedSubTasks.length;
    const subTaskExp = response.pendingSubTasksExp || 0;
    const subTaskGold = response.pendingSubTasksGold || 0;
    
    // 计算主任务额外奖励（总奖励减去子任务奖励）
    const mainTaskExp = longTaskInfo.finalBonusExperience || (totalXp - subTaskExp);
    const mainTaskGold = longTaskInfo.finalBonusGold || (totalGold - subTaskGold);
    
    // 显示详细的奖励分布
    toast.success(
      <div className="flex flex-col space-y-1">
        <span className="font-semibold text-sm">Long Quest & Subtasks Completed!</span>
        {subTaskCount > 0 && (
          <div className="flex items-center">
            <span className="text-yellow-500 mr-1">🏅</span>
            <span className="text-xs">
              Completed <span className="font-bold text-blue-600">{subTaskCount} subtasks</span>,
              earned <span className="font-bold text-yellow-600">{subTaskExp} XP</span> and 
              <span className="font-bold text-amber-500"> {subTaskGold} Gold</span>
            </span>
          </div>
        )}
        {mainTaskExp > 0 || mainTaskGold > 0 ? (
          <div className="flex items-center">
            <span className="text-yellow-500 mr-1">🏆</span>
            <span className="text-xs">
              Bonus reward: <span className="font-bold text-yellow-600">{mainTaskExp} XP</span> and 
              <span className="font-bold text-amber-500"> {mainTaskGold} Gold</span>
            </span>
          </div>
        ) : null}
        
        <div className="flex items-center">
          <span className="text-green-500 mr-1">✅</span>
          <span className="text-xs">
            Total: <span className="font-bold text-yellow-600">{totalXp} XP</span> and 
            <span className="font-bold text-amber-500"> {totalGold} Gold</span>
          </span>
        </div>
      </div>,
      { duration: 6000, position: 'top-center' }
    );
  } else if (allSubTasksCompleted) {
    // 所有子任务已完成，只显示长期任务额外奖励
    const finalExp = longTaskInfo.finalBonusExperience || totalXp;
    const finalGold = longTaskInfo.finalBonusGold || totalGold;
    
    toast.success(
      <div className="flex flex-col space-y-1">
        <span className="font-semibold text-sm">Long Quest Complete!</span>
        <div className="flex items-center">
          <span className="text-yellow-500 mr-1">🏆</span>
          <span className="text-xs">
            Bonus reward: <span className="font-bold text-yellow-600">{finalExp} XP</span> and 
            <span className="font-bold text-amber-500"> {finalGold} Gold</span>
          </span>
        </div>
      </div>,
      { duration: 5000, position: 'top-center' }
    );
  } else {
    // 其他情况，简单显示获得的总奖励
    showTaskCompletedToast(task?.title || "Long Quest", totalXp, totalGold, false, task);
  }
}; 