import axios from "./axios"; // 如果你有封装好的 axios 实例

// Get all achievements and check if they are unlocked
export const fetchAchievements = () => {
  return axios.get("/achievements").then((res) => {
    return res.data;
  });
};

// Check and unlock achievements
export const checkAchievements = () => {
  return axios.post("/achievements/check").then((res) => res.data);
};
