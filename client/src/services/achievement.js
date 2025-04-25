import axios from "./axios"; // 如果你有封装好的 axios 实例

// 获取所有成就
export const fetchAchievements = () => {
  return axios.get("/achievements").then((res) => {
    return res.data;
  });
};
