import React, { useState } from "react";
import AchievementTooltip from "./AchievementTooltip";

const AchievementIcon = ({ achievement, userStats }) => {
  const [hovered, setHovered] = useState(false);

  const iconUrl = `/achievement-icons/${
    achievement.icon || "default_icon_unlocked.png"
  }`;
  const isUnlocked = achievement.unlocked;

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 图标本体 */}
      <img
        src={iconUrl}
        alt={achievement.name}
        className={`w-12 h-12 transition-transform duration-200 ${
          isUnlocked ? "" : "grayscale opacity-50"
        }`}
      />

      {/* 悬浮提示框 */}
      {hovered && (
        <AchievementTooltip achievement={achievement} userStats={userStats} />
      )}
    </div>
  );
};

export default AchievementIcon;
