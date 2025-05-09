// src/components/AchievementCategoryProgress.js
import React from "react";

const AchievementCategoryProgress = ({ categoryStats = {} }) => {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4">分类进度概览</h2>
      <div className="space-y-4">
        {Object.entries(categoryStats).map(
          ([category, { unlocked, total }]) => {
            const percent =
              total > 0 ? Math.round((unlocked / total) * 100) : 0;
            return (
              <div key={category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{category}</span>
                  <span className="text-xs text-gray-600">
                    {unlocked} / {total}（{percent}%）
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export default AchievementCategoryProgress;
