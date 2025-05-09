import React, { useEffect, useState } from "react";
import { fetchAchievements } from "../services/achievement.js";
import { fetchUserStat } from "../services/userStat.js";
import AchievementSidebar from "../components/AchievementSidebar.js";
import OverviewTab from "../components/OverviewTab.js";
import CategoryTab from "../components/CategoryTab.js";
import { Navbar } from "../components/navbar/Navbar.js";

const AchievementCenterPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [currentTab, setCurrentTab] = useState("总览");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [achievements, stats] = await Promise.all([
          fetchAchievements(),
          fetchUserStat(),
        ]);
        setAchievements(achievements);
        setUserStats(stats);
      } catch (error) {
        console.error("❌ 获取数据失败:", error);
      }
    };
    fetchAll();
  }, []);

  console.log("achievements", achievements);

  const unlocked = achievements.filter((a) => a.unlocked);

  const recentUnlocked = [...unlocked]
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 5);

  // 分类统计
  const categoryStats = {};
  const categoryMap = {};
  const categories = ["累计型", "持续型", "成长型", "探索型", "彩蛋型"];

  for (const cat of categories) {
    const list = achievements.filter((a) => a.category === cat);
    const unlockedList = list.filter((a) => a.unlocked);
    categoryStats[cat] = { unlocked: unlockedList.length, total: list.length };
    categoryMap[cat] = list;
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10 flex">
        <AchievementSidebar currentTab={currentTab} setTab={setCurrentTab} />

        <div className="flex-1">
          {currentTab === "总览" && (
            <OverviewTab
              recentUnlocked={recentUnlocked}
              unlockedCount={unlocked.length}
              totalCount={achievements.length}
              categoryStats={categoryStats}
              userStats={userStats}
            />
          )}

          {categories.includes(currentTab) && (
            <CategoryTab
              category={currentTab}
              achievements={categoryMap[currentTab]}
              userStats={userStats}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementCenterPage;
