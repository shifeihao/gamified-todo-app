// src/components/AchievementDetailRow.js
import React from "react";

const AchievementDetailRow = ({
  achievement,
  userStats,
  showUnlockTime = true,
}) => {
  const isUnlocked = achievement.unlocked;
  const iconUrl = `/achievement-icons/${
    achievement.icon || "default_icon_unlocked.png"
  }`;
  const logicType = achievement.logic?.type;
  const total = achievement.logic?.value ?? 10;
  const current = isUnlocked ? total : userStats?.[logicType] ?? 0;
  const percent =
    !isNaN(current) && !isNaN(total)
      ? Math.min((current / total) * 100, 100)
      : 0;

  // 判断是否为时间格式 "HH:mm:ss"
  const isTimeString =
    typeof total === "string" && /^\d{2}:\d{2}:\d{2}$/.test(total);

  const isValidTimeValue =
    current !== undefined && current !== null && current !== 0;

  // 时间类：格式化 current 值
  const formattedCurrent =
    isTimeString && typeof current === "string"
      ? current
      : typeof current === "number" && isValidTimeValue
      ? new Date(current).toTimeString().slice(0, 8)
      : "—";

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-200">
      <img
        src={iconUrl}
        alt={achievement.name}
        className={`w-14 h-14 flex-shrink-0 rounded-md border ${
          isUnlocked ? "" : "grayscale opacity-50"
        }`}
      />
      <div className="flex-1">
        <div className="flex justify-between">
          <h3 className="font-semibold text-base">{achievement.name}</h3>
          {isUnlocked && showUnlockTime && (
            <p className="text-xs text-gray-500">
              解锁于：{new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <p className="text-sm text-gray-600">{achievement.description}</p>
        <p className="text-xs text-gray-500 mt-1">
          条件：{achievement.condition || "—"}
        </p>

        {!isUnlocked && (
          <div className="mt-1">
            {!isTimeString ? (
              <>
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div
                    className="h-full bg-blue-400"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right text-gray-500">
                  {current}/{total}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-right text-gray-500">
                  当前记录时间：{formattedCurrent}
                </p>
                <p className="text-xs text-right text-gray-500">
                  要求时间：{total}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementDetailRow;
