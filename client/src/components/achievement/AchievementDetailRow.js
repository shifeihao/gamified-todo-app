// src/components/AchievementDetailRow.js
import React from "react";
import { motion } from "framer-motion";

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

  // Determine whether the time format is "HH:mm:ss"
  const isTimeString =
    typeof total === "string" && /^\d{2}:\d{2}:\d{2}$/.test(total);

  const isValidTimeValue =
    current !== undefined && current !== null && current !== 0;

  // Time class: format current value
  const formattedCurrent =
    isTimeString && typeof current === "string"
      ? current
      : typeof current === "number" && isValidTimeValue
      ? new Date(current).toTimeString().slice(0, 8)
      : "—";

  return (
    <div
      className={`flex items-start gap-4 p-5 rounded-xl ${
        isUnlocked ? "bg-white" : "bg-achievementPage-100"
      } shadow-sm`}
    >
      <motion.img
        whileHover={{ scale: 1.1 }}
        src={iconUrl}
        alt={achievement.name}
        className={`w-16 h-16 flex-shrink-0 rounded border ${
          isUnlocked ? "" : "grayscale opacity-50"
        }`}
      />

      <div className="flex-1 space-y-1">
        {/* Title + Time */}
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-achievementPage-600">
            {achievement.name}
          </h3>
          {isUnlocked && showUnlockTime && (
            <span className="text-xs text-gray-500">
              Unlocked on:{" "}
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700">{achievement.description}</p>

        {/* Condition */}
        <p className="text-xs text-gray-500">
          Condition:{achievement.condition || "—"}
        </p>

        {/* Unlocked: Show progress */}
        {!isUnlocked && (
          <div className="mt-2 space-y-1">
            {!isTimeString ? (
              <>
                <div className="w-full h-2 bg-achievementPage-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-achievementPage-500 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right text-gray-500">
                  {current} / {total}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-right text-gray-500">
                  Current recording time: {formattedCurrent}
                </p>
                <p className="text-xs text-right text-gray-500">
                  Request time:{total}
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
