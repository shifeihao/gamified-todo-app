// src/components/AchievementTooltip.js
import React from "react";

const AchievementTooltip = ({ achievement, userStats }) => {
  const iconUrl = `/achievement-icons/${
    achievement.icon || "default_icon_unlocked.png"
  }`;
  const isUnlocked = achievement.unlocked;
  // 逻辑字段
  const logicType = achievement.logic?.type;
  const total = achievement.logic?.value || 10;
  // 模拟进度值（真实项目中请从后端获取）
  const currentMath = isUnlocked ? total : userStats?.[logicType] ?? 0;
  const currentDisplay = userStats?.[logicType] ?? 0;

  const percent = Math.min((currentMath / total) * 100, 100);

  return (
    <div className="absolute z-10 top-14 left-1/2 -translate-x-1/2 w-64 p-4 bg-white shadow-lg border border-gray-300 rounded-xl text-sm">
      <div className="flex items-center mb-2">
        <img src={iconUrl} alt="" className="w-10 h-10 mr-3" />
        <div>
          <h3 className="font-semibold">{achievement.name}</h3>
          <p className="text-gray-500">{achievement.description}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-1">
        条件：{achievement.condition || "—"}
      </p>

      {/* 进度条 */}
      <div className="w-full h-2 bg-gray-200 rounded overflow-hidden mb-1">
        <div
          className="h-full bg-green-400"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className="text-xs text-right text-gray-500">
        {currentDisplay}/{total}
      </p>
    </div>
  );
};

export default AchievementTooltip;
