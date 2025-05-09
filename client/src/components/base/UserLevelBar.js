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
 */
const UserLevelBar = ({ data }) => {
  if (!data) return null;
  console.log('等级组件接收到的数据:', data);

  const {
    level,
    experience,
    nextLevelExp,
    expProgress,
    expRemaining,
    progressRate,
    leveledUp,
  } = data;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-md">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">等级 {level}</h2>
        <span className="text-sm text-gray-500">
          {experience} / {nextLevelExp} XP
        </span>
      </div>

      <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
        <div
          className="bg-green-500 h-full transition-all duration-500"
          style={{ width: `${(progressRate * 100).toFixed(1)}%` }}
        />
      </div>

      <p className="text-sm text-gray-600 mt-1">
        距离下一级还需 <strong>{expRemaining}</strong> 经验
      </p>

      {leveledUp && (
        <p className="text-green-600 font-semibold mt-2 animate-pulse">
          🎉 恭喜升级！
        </p>
      )}
    </div>
  );
};

export default UserLevelBar;
