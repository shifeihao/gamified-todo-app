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
    <div>
      <h1 className="text-2xl font-bold mb-6">成就总览</h1>
      {/* 最近获得成就 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">最近获得</h2>
        {recentUnlocked.length === 0 ? (
          <p className="text-sm text-gray-500">暂无已解锁成就</p>
        ) : (
          <div className="divide-y">
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

      {/* 总体进度 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">总进度</h2>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-green-500"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 text-right">
          {unlockedCount} / {totalCount}（{percent}%）
        </p>
      </div>

      {/* 分类进度 */}
      <AchievementCategoryProgress categoryStats={categoryStats} />
    </div>
  );
};

export default OverviewTab;
