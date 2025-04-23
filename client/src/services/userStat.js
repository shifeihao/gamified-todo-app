import axios from "./axios"; // 如果你有封装好的 axios 实例
// 获取所有成就
export const fetchUserStat = () => {
  return axios.get("/achievements/stat").then((res) => {
    return res.data;
  });
};
