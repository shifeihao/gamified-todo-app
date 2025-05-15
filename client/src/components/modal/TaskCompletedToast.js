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
    // Get card bonus multipliers if available
    const expMultiplier = task.cardUsed?.bonus?.experienceMultiplier || 1;
    const goldMultiplier = task.cardUsed?.bonus?.goldMultiplier || 1;
    
    if (finalXp === 0) {
      // Get base experience value
      const baseExp = task.experienceReward || 30;
      // Apply multiplier
      finalXp = Math.round(baseExp * expMultiplier);
      console.log(`Reward XP is 0, using base value: ${baseExp} XP × ${expMultiplier} = ${finalXp} XP`);
    }
    
    if (finalGold === 0) {
      // Get base gold value
      const baseGold = task.goldReward || 15;
      // Apply multiplier
      finalGold = Math.round(baseGold * goldMultiplier);
      console.log(`Reward Gold is 0, using base value: ${baseGold} Gold × ${goldMultiplier} = ${finalGold} Gold`);
    }
  }
  
  // Show Notifications
  toast.success(
    <div className="flex flex-col space-y-1">
      <span className="font-semibold text-sm">{isSubtask ? "Subtask Complete!" : "Task Complete!"}</span>
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

// Display detailed notifications for long-term task completions
export const showLongTaskCompletedToast = (response, task) => {
  // Use the longTaskInfo returned by the server to determine whether all subtasks have been completed
  const longTaskInfo = response.longTaskInfo || {};
  const allSubTasksCompleted = longTaskInfo.allSubTasksCompleted;
  
  // Get the reward returned by the server
  let totalXp = (response.reward?.expGained || 0);
  let totalGold = (response.reward?.goldGained || 0);
  
  // Get card bonus multipliers if available
  const expMultiplier = task?.cardUsed?.bonus?.experienceMultiplier || 1;
  const goldMultiplier = task?.cardUsed?.bonus?.goldMultiplier || 1;
  
  // If the reward is 0, use the default value with card multiplier
  if (totalXp === 0) {
    const baseExp = longTaskInfo.finalBonusExperience || task?.experienceReward || 30;
    totalXp = Math.round(baseExp * expMultiplier);
    console.log(`Total XP reward is 0, using base value: ${baseExp} XP × ${expMultiplier} = ${totalXp} XP`);
  }
  
  if (totalGold === 0) {
    const baseGold = longTaskInfo.finalBonusGold || task?.goldReward || 15;
    totalGold = Math.round(baseGold * goldMultiplier);
    console.log(`Total Gold reward is 0, using base value: ${baseGold} Gold × ${goldMultiplier} = ${totalGold} Gold`);
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
        <span className="font-semibold text-sm">Long Task & Subtasks Completed!</span>
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
        <span className="font-semibold text-sm">Long Task Complete!</span>
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