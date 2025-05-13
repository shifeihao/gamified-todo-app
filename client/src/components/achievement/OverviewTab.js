// src/components/OverviewTab.js
import React from "react";
import AchievementCategoryProgress from "./AchievementCategoryProgress";
import AchievementDetailRow from "./AchievementDetailRow";

const OverviewTab = ({
  recentUnlocked = [],
  unlockedCount,
  totalCount,
  categoryStats,
  userStats,
}) => {
  const percent =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-10">
      {/* Title */}
      <div className="bg-achievementPage-100 border-l-4 border-achievementPage-500 pl-4 py-1 rounded">
        <h2 className="text-lg font-semibold text-achievementPage-600">
          Recently Acquired
        </h2>
      </div>

      {/* Recent achievements*/}
      <div>
        {recentUnlocked.length === 0 ? (
          <p className="text-sm text-gray-500">No achievements unlocked yet</p>
        ) : (
          <div className="space-y-4">
            {recentUnlocked.map((a) => (
              <AchievementDetailRow
                key={a._id}
                achievement={a}
                userStats={userStats}
                showUnlockTime={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      <div>
        <h2 className="text-lg font-semibold text-achievementPage-title mb-2">
          Overall Progress
        </h2>
        <div className="w-full h-3 bg-achievementPage-200 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-achievementPage-titleBlue transition-all duration-500"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <p className="text-sm text-right text-gray-500">
          {unlockedCount} / {totalCount}({percent}%)
        </p>
      </div>

      {/* Classification progress bar */}
      <AchievementCategoryProgress categoryStats={categoryStats} />
    </div>
  );
};

export default OverviewTab;
