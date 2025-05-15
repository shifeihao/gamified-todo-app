import React, { useEffect, useState } from "react";
import {
  getAllAchievements,
  checkAchievements,
} from "../services/achievement.js";
import { fetchUserStat, syncUserStat } from "../services/userStat.js";
import AchievementSidebar from "../components/achievement/AchievementSidebar.js";
import OverviewTab from "../components/achievement/OverviewTab.js";
import CategoryTab from "../components/achievement/CategoryTab.js";
import { Navbar } from "../components/navbar/Navbar.js";
import { useToast } from "../context/ToastContext";

const AchievementCenterPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [currentTab, setCurrentTab] = useState("Overview");
  const { showError } = useToast();

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        await syncUserStat(); // Synchronize user status
        console.log("✅ Synchronize user status successfully");
        await checkAchievements(); // Check achievements
        console.log("✅ Achievement test success");
        const [achievements, stats] = await Promise.all([
          getAllAchievements(),
          fetchUserStat(),
        ]);
        setAchievements(achievements);
        setUserStats(stats);
      } catch (error) {
        console.error("❌ Failed to Retrieve Data:", error);
        showError('Failed to Retrieve Achievement Data');
      }
    };
    loadAchievements();
  }, []);

  console.log("achievements", achievements);

  const unlocked = achievements.filter((a) => a.unlocked);

  const recentUnlocked = [...unlocked]
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 5);

  // 分类统计
  const categoryStats = {};
  const categoryMap = {};
  const categories = [
    "Cumulative",
    "Continuous",
    "Growth",
    "Exploration",
    "Easter_Egg",
  ];

  for (const cat of categories) {
    const list = achievements.filter((a) => a.category === cat);
    const unlockedList = list.filter((a) => a.unlocked);
    categoryStats[cat] = { unlocked: unlockedList.length, total: list.length };
    categoryMap[cat] = list;
  }

  return (
    <div>
      <div className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundColor: "#fff",
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='%238b5cf6' fill-opacity='0.15'%3E%3Ccircle cx='100' cy='100' r='1.5'/%3E%3Ccircle cx='200' cy='150' r='1.5'/%3E%3Ccircle cx='150' cy='250' r='1.5'/%3E%3Ccircle cx='280' cy='210' r='1.5'/%3E%3Ccircle cx='300' cy='100' r='1.5'/%3E%3Cpath d='M100 100L200 150L150 250L280 210L300 100' stroke='%238b5cf6' stroke-width='0.5' stroke-opacity='0.1' fill='none'/%3E%3C/g%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='104' viewBox='0 0 60 104'%3E%3Cpath d='M30 10.9L0 38.1V76.5L30 103.7L60 76.5V38.1L30 10.9zM30 0L60 17.3V52L30 69.3L0 52V17.3L30 0z' fill='none' stroke='%238b5cf6' stroke-opacity='0.15' stroke-width='1.5'/%3E%3C/svg%3E")
        `,
        backgroundSize: "400px 400px, 60px 104px",
        backgroundPosition: "center center, center center",
      }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-10 flex">
          <AchievementSidebar currentTab={currentTab} setTab={setCurrentTab} />
          <div className="flex-1">
            {currentTab === "Overview" && (
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
      {/* Tailwind safelist hint: let Tailwind Compile these class names */}
      <div className="hidden">
        bg-achievementPage-100 bg-achievementPage-200 bg-achievementPage-400
        bg-achievementPage-500 bg-achievementPage-600 text-achievementPage-600
        text-achievementPage-gold text-achievementPage-emerald
        border-achievementPage-200
      </div>
    </div>
  );
};

export default AchievementCenterPage;
