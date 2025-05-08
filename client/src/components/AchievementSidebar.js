import React from "react";

const TABS = ["总览", "累计型", "持续型", "成长型", "探索型", "彩蛋型"];

const AchievementSidebar = ({ currentTab, setTab }) => {
  return (
    <div className="w-40 mr-6 border-r border-gray-300 pr-4">
      <h2 className="text-lg font-bold mb-4">成就分类</h2>
      <ul className="space-y-2">
        {TABS.map((tab) => (
          <li
            key={tab}
            onClick={() => setTab(tab)}
            className={`cursor-pointer px-3 py-2 rounded hover:bg-gray-100 text-sm ${
              currentTab === tab
                ? "bg-blue-100 font-semibold text-blue-700"
                : ""
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
