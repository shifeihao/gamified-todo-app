// src/pages/AchievementPage.js
import React, { useEffect, useState } from "react";
import { fetchAchievements } from "../services/achievement";
import AchievementIcon from "../components/AchievementIcon";
import { fetchUserStat } from "../services/userStat.js"; // 导入获取成就的函数

const AchievementPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [achievements, stats] = await Promise.all([
          fetchAchievements(),
          fetchUserStat(),
        ]);

        setAchievements(achievements);
        setUserStats(stats);
        console.log("✔️ 成就与统计信息已加载");
      } catch (error) {
        console.error("❌ 获取数据失败:", error);
      }
    };

    fetchAll();
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked && !a.isHidden);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-4">已解锁成就</h1>
      <div className="grid grid-cols-7 gap-4 mb-10">
        {unlocked.map((a) => (
          <AchievementIcon key={a._id} achievement={a} userStats={userStats} />
        ))}
      </div>

      <h1 className="text-2xl font-bold mb-4">未解锁成就</h1>
      <div className="grid grid-cols-7 gap-4">
        {locked.map((a) => (
          <AchievementIcon key={a._id} achievement={a} userStats={userStats} />
        ))}
      </div>
    </div>
  );
};

export default AchievementPage;
