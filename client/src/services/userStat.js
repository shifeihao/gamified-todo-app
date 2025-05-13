import axios from "./axios"; // 如果你有封装好的 axios 实例
// 获取所有用户状态
export const fetchUserStat = () => {
  return axios.get("/userstats/").then((res) => {
    return res.data;
  });
};

// 同步用户状态
export const syncUserStat = () => {
  return axios.patch("/userstats/sync").then((res) => {
    return res.data;
  });
};
