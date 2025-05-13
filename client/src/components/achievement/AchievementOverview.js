// src/components/AchievementOverview.js
import React from "react";

const AchievementOverview = ({
  recentUnlocked = [],
  unlockedCount,
  totalCount,
}) => {
  const percent =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="mb-10">
      {/* Title */}
      <h2 className="text-xl font-semibold mb-4">Achievements Overview</h2>

      {/* Recently unlocked achievements */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Recently Acquired</h3>
      </div>

      {/* Overall progress bar */}
      <div>
        <h3 className="text-md font-medium mb-2">Unlock Progress</h3>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-green-500"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 text-right">
          {unlockedCount} / {totalCount}（{percent}%）
        </p>
      </div>
    </div>
  );
};

export default AchievementOverview;
