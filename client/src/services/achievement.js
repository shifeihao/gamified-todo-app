import axios from "./axios"; // If you have a packaged axios instance

// Get all achievements and check if they are unlocked
export const getAllAchievements = () => {
  return axios.get("/api/achievements").then((res) => res.data);
};

export const getUnlockedAchievements = () => {
  return axios.get("/api/achievements/unlocked").then((res) => res.data);
};

// Check and unlock achievements
export const checkAchievements = () => {
  return axios.post("/api/achievements/check").then((res) => res.data.newlyUnlocked || []);
};

export const getUserStatistics = () => {
  return axios.get("/api/userstats/").then((res) => res.data);
};
