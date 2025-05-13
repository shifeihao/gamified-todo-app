import axios from "axios";

// Create an axios instance, set the base URL and other configurations
// No need to write a token every time, just extract it from this one

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: false, 
});

// Set up the request interceptor: automatically extract the token from localStorage
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
