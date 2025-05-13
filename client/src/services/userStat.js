import axios from "./axios"; 
// Get all user status
export const fetchUserStat = () => {
  return axios.get("/userstats/").then((res) => {
    return res.data;
  });
};

// Synchronize user status
export const syncUserStat = () => {
  return axios.patch("/userstats/sync").then((res) => {
    return res.data;
  });
};
