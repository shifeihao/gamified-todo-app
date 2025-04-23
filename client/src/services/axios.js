import axios from "axios";

// 创建一个 axios 实例，设置基础 URL 和其他配置
// 每次都不用专门写token了，全部从这个统一提取

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: false, // 你用的是 header token，不需要 cookie
});

// 设置请求拦截器：自动从 localStorage 中提取 token
instance.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo"))
      : null;

    if (userInfo?.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
