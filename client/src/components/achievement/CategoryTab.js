// src/components/CategoryTab.js
import React from "react";
import AchievementDetailRow from "./AchievementDetailRow";
import { TrophyIcon } from "@heroicons/react/24/solid";

const CategoryTab = ({ category, achievements = [], userStats }) => {
  const unlocked = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
  const locked = achievements
    .filter((a) => !a.unlocked && !a.isHidden)
    .sort((a, b) => {
      if (a.points !== b.points) {
        return a.points - b.points; // In ascending order of points
      }
      return a.name.localeCompare(b.name); // If the points are the same, sort by name
    });

  return (
    <div>
      <div className="flex items-center gap-3 bg-achievementPage-100 border-l-4 border-achievementPage-500 px-4 py-2 rounded-lg shadow-sm mb-6">
        <TrophyIcon className="w-5 h-5 text-achievementPage-500" />
        <span className="text-xl font-bold text-achievementPage-600">
          {category} Achievements
        </span>
      </div>
      {/* Unlocked achievements */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Unlocked</h2>
        {unlocked.length === 0 ? (
          <p className="text-sm text-gray-500">
            No achievements have been unlocked yet
          </p>
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

      {/* Locked achievements */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Locked</h2>
        {locked.length === 0 ? (
          <p className="text-sm text-gray-500">
            All achievements in this category have been unlocked!
          </p>
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
