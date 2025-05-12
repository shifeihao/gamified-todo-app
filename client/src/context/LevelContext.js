import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';

const LevelContext = createContext();

export const LevelProvider = ({ children }) => {
  const [levelInfo, setLevelInfo] = useState(null);

  const fetchLevelInfo = debounce(async () => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) return;

      const token = JSON.parse(userInfo)?.token;
      if (!token) return;

      const res = await axios.get('/api/levels/userLevelBar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLevelInfo(res.data);
    } catch (error) {
      console.error('Failed to fetch level info:', error);
    }
  }, 5000);

  useEffect(() => {
    fetchLevelInfo();
  }, []);

  return (
    <LevelContext.Provider value={{ levelInfo, refreshLevelInfo: fetchLevelInfo }}>
      {children}
    </LevelContext.Provider>
  );
};

export const useLevelInfo = () => useContext(LevelContext); 