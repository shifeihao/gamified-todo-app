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
      // 首先尝试获取每日卡片
      await axios.post("/api/cards/issue-daily", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("成功获取每日卡片");
    } catch (error) {
      console.log("获取每日卡片失败，可能已获取过:", error.response?.data?.message || error.message);
      
      // 如果获取每日卡片失败，尝试创建一张测试卡片
      try {
        await axios.post("/api/cards/issue-blank", {
          title: "初始卡片",
          description: "新用户自动获得的卡片"
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("成功创建初始空白卡片");
      } catch (innerError) {
        console.error("创建初始卡片失败:", innerError.response?.data?.message || innerError.message);
      }
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
