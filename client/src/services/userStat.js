import axios from "./axios"; 
// Get all user status
export const fetchUserStat = () => {
  return axios.get("/api/userstats/").then((res) => {
    return res.data;
  });
};

// Synchronize user status
export const syncUserStat = () => {
  return axios.patch("/api/userstats/sync").then((res) => {
    return res.data;
  });
};
