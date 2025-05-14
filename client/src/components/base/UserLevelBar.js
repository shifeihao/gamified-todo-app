import React from 'react';

/**
 * 用户等级显示组件
 * @param {Object} data - 等级数据对象
 * @param {number} data.level - 当前等级
 * @param {number} data.experience - 当前总经验
 * @param {number} data.nextLevelExp - 升到下一级所需经验
 * @param {number} data.expProgress - 当前等级内获得的经验
 * @param {number} data.expRemaining - 距离下一级还需经验
 * @param {number} data.progressRate - 当前升级进度（0 ~ 1）
 * @param {boolean} data.leveledUp - 是否升级
 * @param {number} data.gold - 拥有的金币数
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
    gold = 0, // 默认值为0
  } = data;

  // 获取正确的经验值进度信息
  const currentLevelExp = expProgress || 0;
  const totalExpNeeded = nextLevelExp - (experience - currentLevelExp);

  return (
    <div className="flex items-center space-x-2">
      {/* 等级显示 */}
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

      {/* 金币显示 */}
      <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
        <span className="text-yellow-600 text-sm">🪙</span>
        <span className="text-yellow-700 font-medium">{gold}</span>
      </div>
    </div>
  );
};

export default UserLevelBar;
