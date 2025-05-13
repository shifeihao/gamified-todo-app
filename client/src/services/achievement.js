import axios from "./axios"; // 如果你有封装好的 axios 实例

// 获取所有成就并检查是否解锁
export const fetchAchievements = () => {
  return axios.get("/achievements").then((res) => {
    return res.data;
  });
};

// 检查并解锁成就
export const checkAchievements = () => {
  return axios.post("/achievements/check").then((res) => res.data);
};
