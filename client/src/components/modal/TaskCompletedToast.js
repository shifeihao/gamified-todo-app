import React from 'react';
import { toast } from 'react-hot-toast';

/**
 * Display task completion notification
 * @param {string} title Task Title
 * @param {number} expGained Experience Points Gained
 * @param {number} goldGained Gold coins obtained
 * @param {boolean} isSubtask Is it a subtask?
 * @param {object} task Task object, used to get the default reward value
 */
export const showTaskCompletedToast = (title, expGained, goldGained, isSubtask = false, task = null) => {
  // Make sure the reward value is not zero, if it is zero use the task itself or the default value
  let finalXp = expGained;
  let finalGold = goldGained;
  
  if ((finalXp === 0 || finalGold === 0) && task) {
    if (finalXp === 0) {
      finalXp = task.experienceReward || (task.type === 'long' ? 30 : 10);
      console.log(`Reward XP is 0, use the mission default value: ${finalXp} XP`);
    }
    
    if (finalGold === 0) {
      finalGold = task.goldReward || (task.type === 'long' ? 15 : 5);
      console.log(`The reward Gold is 0, using the task default value: ${finalGold} Gold`);
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
  // Use the longTaskInfo returned by the server to determine whether all subtasks have been completed
  const longTaskInfo = response.longTaskInfo || {};
  const allSubTasksCompleted = longTaskInfo.allSubTasksCompleted;
  
  // 获取服务器返回的奖励
  let totalXp = (response.reward?.expGained || 0);
  let totalGold = (response.reward?.goldGained || 0);
  
  // 如果奖励为0，使用默认值
  if (totalXp === 0) {
    totalXp = longTaskInfo.finalBonusExperience || task?.experienceReward || 30;
    console.log(`Total XP reward is 0, using the mission defined value: ${totalXp}`);
  }
  
  if (totalGold === 0) {
    totalGold = longTaskInfo.finalBonusGold || task?.goldReward || 15;
    console.log(`The total gold reward is 0, using the task definition value: ${totalGold}`);
  }
  
  // If there are unfinished subtasks, they will be automatically completed.
  if (response.autoCompletedSubTasks && response.autoCompletedSubTasks.length > 0) {
    // Get subtask rewards
    const subTaskCount = response.autoCompletedSubTasks.length;
    const subTaskExp = response.pendingSubTasksExp || 0;
    const subTaskGold = response.pendingSubTasksGold || 0;
    
    // Calculate the additional reward for the main task (total reward minus subtask reward)
    const mainTaskExp = longTaskInfo.finalBonusExperience || (totalXp - subTaskExp);
    const mainTaskGold = longTaskInfo.finalBonusGold || (totalGold - subTaskGold);
    
    // Show detailed reward distribution
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
    // All sub-tasks have been completed, only the extra rewards for long-term tasks are displayed
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
    // In other cases, simply display the total reward received
    showTaskCompletedToast(task?.title || "Long Quest", totalXp, totalGold, false, task);
  }
}; 