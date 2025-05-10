import React from "react";

const AchievementCategoryProgress = ({ categoryStats = {} }) => {
  return (
    <div className="space-y-6">
      {/* 标题块 */}
      <div className="bg-achievementPage-100 border-l-4 border-achievementPage-500 px-4 py-2 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-achievementPage-600">
          Classification Progress Overview
        </h2>
      </div>

      {/* 各分类进度 */}
      <div className="space-y-4">
        {Object.entries(categoryStats).map(
          ([category, { unlocked, total }]) => {
            const percent =
              total > 0 ? Math.round((unlocked / total) * 100) : 0;
            return (
              <div
                key={category}
                className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-achievementPage-600">
                    {category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {unlocked} / {total}({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-achievementPage-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-achievementPage-500 transition-all duration-300"
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
