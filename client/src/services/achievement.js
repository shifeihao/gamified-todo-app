import axios from "./axios"; // 如果你有封装好的 axios 实例

// Get all achievements and check if they are unlocked
export const getAllAchievements = () => {
  return axios.get("/achievements").then((res) => res.data);
};

export const getUnlockedAchievements = () => {
  return axios.get("/achievements/unlocked").then((res) => res.data);
};

// Check and unlock achievements
export const checkAchievements = () => {
  return axios.post("/achievements/check").then((res) => res.data.newlyUnlocked || []);
};

export const getUserStatistics = () => {
  return axios.get("/achievements/statistics").then((res) => res.data);
};
