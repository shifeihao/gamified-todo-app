// src/components/CategoryTab.js
import React from "react";
import AchievementDetailRow from "./AchievementDetailRow";

const CategoryTab = ({ category, achievements = [], userStats }) => {
  const unlocked = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
  const locked = achievements
    .filter((a) => !a.unlocked && !a.isHidden)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{category} 成就</h1>

      {/* 已解锁成就 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">已解锁</h2>
        {unlocked.length === 0 ? (
          <p className="text-sm text-gray-500">尚未解锁任何成就</p>
        ) : (
          <div className="divide-y">
            {unlocked.map((a) => (
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

      {/* 未解锁成就 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">未解锁</h2>
        {locked.length === 0 ? (
          <p className="text-sm text-gray-500">该分类下所有成就已解锁！</p>
        ) : (
          <div className="divide-y">
            {locked.map((a) => (
              <AchievementDetailRow
                key={a._id}
                achievement={a}
                userStats={userStats}
                showUnlockTime={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryTab;
