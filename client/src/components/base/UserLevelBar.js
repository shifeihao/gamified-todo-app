import React from 'react';

/**
 * User level display component
 * @param {Object} data - Level Data Object
 * @param {number} data.level - Current level
 * @param {number} data.experience - Current total experience
 * @param {number} data.nextLevelExp - Experience required to advance to the next level
 * @param {number} data.expProgress - Experience gained within the current level
 * @param {number} data.expRemaining - Need more experience to reach the next level
 * @param {number} data.progressRate - Current upgrade progress（0 ~ 1）
 * @param {boolean} data.leveledUp - Upgrade
 * @param {number} data.gold - Number of gold coins owned
 */
const UserLevelBar = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <div className="h-2 w-8 bg-gray-300 rounded"></div>
        <div className="flex-1 h-2 bg-gray-300 rounded"></div>
        <div className="h-2 w-12 bg-gray-300 rounded"></div>
        <div className="h-2 w-16 bg-gray-300 rounded"></div>
      </div>
    );
  }

  const {
    level,
    experience,
    expProgress,
    nextLevelExp,
    progressRate,
    leveledUp,
    gold = 0, // The default value is 0
  } = data;

    // Get the correct experience value progress information
  const currentLevelExp = expProgress || 0;
  const totalExpNeeded = nextLevelExp - (experience - currentLevelExp);

  return (
    <div className="flex items-center space-x-2">
      {/* Level display */}
      <div className="flex items-center space-x-1 flex-1 min-w-0">
        <span className="text-sm font-medium whitespace-nowrap">Lv.{level}</span>
        <div className="flex-1 min-w-[50px]">
          <div className="w-full bg-[#0080d0]/30 h-2 rounded-full overflow-hidden">
            <div
              className="bg-yellow-300 h-full transition-all duration-500 ease-out"
              style={{ width: `${(progressRate * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium whitespace-nowrap truncate">
          {currentLevelExp}/{totalExpNeeded}
        </span>
        {leveledUp && (
          <span className="text-yellow-300 text-xs font-bold animate-bounce">
            ⭐
          </span>
        )}
      </div>

      {/* Coin display */}
      <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
        <span className="text-yellow-600 text-sm">🪙</span>
        <span className="text-yellow-700 font-medium">{gold}</span>
      </div>
    </div>
  );
};

export default UserLevelBar;
