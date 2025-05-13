import React, { useEffect, useState } from "react";
import {
  fetchAchievements,
  checkAchievements,
} from "../services/achievement.js";
import { fetchUserStat, syncUserStat } from "../services/userStat.js";
import AchievementSidebar from "../components/AchievementSidebar.js";
import OverviewTab from "../components/OverviewTab.js";
import CategoryTab from "../components/CategoryTab.js";
import { Navbar } from "../components/navbar/Navbar.js";
import { useToast } from "../contexts/ToastContext";

const AchievementCenterPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [currentTab, setCurrentTab] = useState("Overview");
  const { showError } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        await syncUserStat(); // 同步用户状态
        console.log("✅ 同步用户状态成功");
        await checkAchievements(); // ✅  解锁
        console.log("✅ 成就检测成功");
        const [achievements, stats] = await Promise.all([
          fetchAchievements(),
          fetchUserStat(),
        ]);
        setAchievements(achievements);
        setUserStats(stats);
      } catch (error) {
        console.error("❌ 获取数据失败:", error);
        showError("获取成就数据失败");
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
      <div className="bg-achievementPage-100 text-achievementPage-600 min-h-screen">
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
      {/* Tailwind safelist hint: 让 Tailwind 编译这些类名 */}
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
