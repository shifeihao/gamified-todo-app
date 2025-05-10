import React from "react";

const TABS = [
  "Overview",
  "Cumulative",
  "Continuous",
  "Growth",
  "Exploration",
  "Easter_Egg",
];

// src/components/AchievementSidebar.js
const AchievementSidebar = ({ currentTab, setTab }) => {
  return (
    <div className="w-48 mr-6 bg-white/60 rounded-2xl p-4 shadow-xl">
      <h2 className="text-lg font-bold text-achievementPage-600 mb-4">
        Achievement Classification
      </h2>
      <ul className="space-y-2">
        {TABS.map((tab) => (
          <li
            key={tab}
            onClick={() => setTab(tab)}
            className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-medium
              ${
                currentTab === tab
                  ? "bg-achievementPage-500 text-white shadow-inner"
                  : "text-achievementPage-600 hover:bg-achievementPage-100"
              }`}
          >
            {tab}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AchievementSidebar;
