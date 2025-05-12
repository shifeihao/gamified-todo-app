import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// 创建认证上下文
const AuthContext = createContext();

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  // 用户状态
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 在组件挂载时从本地存储中加载用户信息
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo"))
      : null;

    setUser(userInfo);
    setLoading(false);
  }, []);

  // 尝试为新用户获取卡片
  const initializeUserCards = async (token) => {
    try {
      // 首先获取用户当前卡片库存
      const inventoryResponse = await axios.get("/api/cards/inventory", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const cardData = inventoryResponse.data;
      console.log("检查用户卡片库存:", cardData);
      
      // 如果用户没有卡片或卡片很少，执行初始化
      if (!cardData.inventory || cardData.inventory.length < 5) {
        console.log("新用户初始化卡片库存...");
        
        // 颁发3张短期卡片
        try {
          // 首先尝试获取每日卡片（短期）
          await axios.post("/api/cards/issue-daily", {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("成功获取3张短期卡片");
        } catch (error) {
          console.log("获取每日卡片失败，可能已获取过:", error.response?.data?.message || error.message);
          
          // 如果获取失败，尝试手动创建3张短期卡片
          for (let i = 0; i < 3; i++) {
            try {
              await axios.post("/api/cards/issue-blank", {
                title: "初始短期卡片",
                description: "新用户自动获得的短期卡片"
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (err) {
              console.error("创建初始短期卡片失败:", err.response?.data?.message || err.message);
            }
          }
        }
        
        // 颁发2张长期卡片 - 需要创建一个新的API来支持这个功能
        // 由于没有专门的长期卡片发放接口，需要手动创建2张长期卡片
        try {
          for (let i = 0; i < 2; i++) {
            await axios.post("/api/cards/issue-reward", {
              title: "初始长期卡片",
              description: "新用户自动获得的长期卡片",
              type: "special",
              taskDuration: "long", // 长期卡片
              bonus: {
                experienceMultiplier: 1.0,
                goldMultiplier: 1.0
              }
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          console.log("成功创建2张长期卡片");
        } catch (error) {
          console.error("创建初始长期卡片失败:", error.response?.data?.message || error.message);
        }
      } else {
        console.log("用户已有足够卡片，无需初始化");
      }
    } catch (error) {
      console.error("初始化卡片失败:", error.response?.data?.message || error.message);
    }
  };

  // 登录函数
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.post("/api/users/login", {
        email,
        password,
      });
      // 将用户信息保存到本地存储
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      
      // 尝试初始化卡片
      await initializeUserCards(data.token);
      
      return data;
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to login, please check your credentials"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 注册函数
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.post("/api/users/register", {
        username,
        email,
        password,
      });

      // 将用户信息保存到本地存储
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      
      // 新注册用户一定要尝试初始化卡片
      console.log("新用户注册成功，初始化卡片...");
      await initializeUserCards(data.token);

      return data;
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to register, please check your credentials"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
  };

  // 更新用户信息
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // 设置请求头中的认证token
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put("/api/users/profile", userData, config);

      // 更新本地存储中的用户信息
      const updatedUser = { ...user, ...data };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return data;
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to update profile, please try again"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
