import React from 'react';

const AchievementUnlockNotification = ({ achievement }) => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-lg border-l-4 border-yellow-500">
      <div className="flex-shrink-0">
        {achievement.icon ? (
          <img 
            src={`/achievement-icons/${achievement.icon}`} 
            alt="Achievement Icon" 
            className="w-12 h-12"
          />
        ) : (
          <span className="text-3xl">🏆</span>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">成就解锁!</h3>
        <p className="text-yellow-600 font-medium">{achievement.name}</p>
        <p className="text-sm text-gray-600">{achievement.description}</p>
        {(achievement.reward.exp > 0 || 
          achievement.reward.coins > 0 || 
          achievement.reward.task_short_slot > 0 || 
          achievement.reward.task_long_slot > 0) && (
          <div className="mt-2 text-sm">
            <p className="text-gray-700 font-medium">获得奖励:</p>
            <div className="flex space-x-3 text-gray-600">
              {achievement.reward.exp > 0 && (
                <span>经验 +{achievement.reward.exp}</span>
              )}
              {achievement.reward.coins > 0 && (
                <span>金币 +{achievement.reward.coins}</span>
              )}
              {achievement.reward.task_short_slot > 0 && (
                <span>短期任务槽 +{achievement.reward.task_short_slot}</span>
              )}
              {achievement.reward.task_long_slot > 0 && (
                <span>长期任务槽 +{achievement.reward.task_long_slot}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementUnlockNotification; 