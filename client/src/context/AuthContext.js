import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Creating an authentication context
const AuthContext = createContext();

// Authentication provider component
export const AuthProvider = ({ children }) => {
  // User Status
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user information from local storage when the component mounts
  useEffect(() => {
    const initUser = async () => {
      const userInfo = localStorage.getItem("userInfo")
        ? JSON.parse(localStorage.getItem("userInfo"))
        : null;

      if (userInfo?.token) {
        try {
          console.log("开始请求 /api/users/profile...");
          const { data } = await axios.get("/api/users/profile", {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          });
          console.log("收到用户数据:", data);

          const updatedUser = { ...userInfo, ...data };
          localStorage.setItem("userInfo", JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (err) {
          console.error("刷新用户信息失败:", err);
          setUser(userInfo); // 即使失败，也设置原始 user
        }
      } else {
        setUser(userInfo); // 没 token 就直接设
      }

      setLoading(false); // ✅ loading 最后设置
    };

    initUser();
  }, []);

  // 尝试为新用户获取卡片
  const initializeUserCards = async (token) => {
    try {
      // 检查是否是新注册用户
      const isNewRegistration =
        localStorage.getItem("isNewRegistration") === "true";

      // 如果是新注册用户，需要特殊处理确保只发一次卡片
      if (isNewRegistration) {
        console.log("检测到新注册用户，执行一次性卡片初始化");

        try {
          // 获取当前所有卡片状态
          const inventoryResponse = await axios.get(
            "/api/cards/inventory?noAutoIssue=true",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const cardData = inventoryResponse.data;
          console.log("当前卡片库存状态:", cardData);

          // 直接调用清晰的API发放短期卡片，参数isNewRegistration=true会清除旧卡片
          const shortCardResponse = await axios.post(
            "/api/cards/issue-daily?isNewRegistration=true",
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("短期卡片初始化结果:", shortCardResponse.data);

          // 获取当前长期卡片状态
          const longCards =
            cardData.inventory?.filter(
              (card) =>
                card.type === "blank" &&
                card.taskDuration === "long" &&
                !card.used
            ) || [];

          // 处理长期卡片
          if (longCards.length !== 3) {
            // 如果已有长期卡片，先删除
            if (longCards.length > 0) {
              for (const card of longCards) {
                try {
                  await axios.delete(`/api/cards/${card._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  console.log(`已删除现有长期卡片: ${card._id}`);
                } catch (error) {
                  console.error(
                    `删除长期卡片失败:`,
                    error.response?.data?.message || error.message
                  );
                }
              }
            }

            // 创建3张新的长期卡片
            for (let i = 0; i < 3; i++) {
              await axios.post(
                "/api/cards/issue-blank",
                {
                  title: "初始长期卡片",
                  description: "新用户自动获得的长期卡片",
                  taskDuration: "long",
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            }
            console.log("成功创建3张长期卡片");
          } else {
            console.log("用户已有3张长期卡片，无需创建");
          }

          // 最后检查结果
          const finalCheckResponse = await axios.get(
            "/api/cards/inventory?noAutoIssue=true",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const finalCardData = finalCheckResponse.data;
          const finalShortCards =
            finalCardData.inventory?.filter(
              (card) => card.taskDuration === "short" && card.type === "blank"
            ) || [];
          const finalLongCards =
            finalCardData.inventory?.filter(
              (card) => card.taskDuration === "long" && card.type === "blank"
            ) || [];

          console.log(
            `最终检查: 用户有${finalShortCards.length}张短期卡片和${finalLongCards.length}张长期卡片`
          );

          // 移除新注册标记，避免重复操作
          localStorage.removeItem("isNewRegistration");

          return; // 完成初始化，提前退出
        } catch (error) {
          console.error(
            "新用户初始化卡片失败:",
            error.response?.data?.message || error.message
          );
          // 移除标记，避免陷入无法初始化的循环
          localStorage.removeItem("isNewRegistration");
        }
      }

      // 正常流程 (非新注册用户或新用户初始化失败的回退)
      // 获取用户当前卡片库存
      const inventoryResponse = await axios.get(
        "/api/cards/inventory?noAutoIssue=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const cardData = inventoryResponse.data;
      console.log("检查用户卡片库存:", cardData);

      // 如果用户没有卡片或卡片很少，执行初始化
      if (!cardData.inventory || cardData.inventory.length < 6) {
        console.log("用户卡片不足，初始化卡片库存...");

        // 计算当前短期和长期卡片数量
        const shortCards =
          cardData.inventory?.filter(
            (card) => card.taskDuration === "short" && card.type === "blank"
          ) || [];
        const longCards =
          cardData.inventory?.filter(
            (card) => card.taskDuration === "long" && card.type === "blank"
          ) || [];

        let madeChanges = false;

        // 检查短期卡片数量，确保正好有3张
        if (shortCards.length < 3) {
          const shortCardsNeeded = 3 - shortCards.length;
          console.log(`需要创建${shortCardsNeeded}张短期卡片`);

          try {
            // 直接创建所需数量的短期卡片
            for (let i = 0; i < shortCardsNeeded; i++) {
              await axios.post(
                "/api/cards/issue-blank",
                {
                  title: "初始短期卡片",
                  description: "新用户自动获得的短期卡片",
                  taskDuration: "short",
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            }
            console.log(`成功创建${shortCardsNeeded}张短期卡片`);
            madeChanges = true;
          } catch (err) {
            console.error(
              "创建初始短期卡片失败:",
              err.response?.data?.message || err.message
            );
          }
        } else if (shortCards.length > 3) {
          console.log(
            `短期卡片数量(${shortCards.length})超过了3张，需要删除多余卡片`
          );

          try {
            // 按创建时间排序
            const sortedShortCards = [...shortCards].sort((a, b) => {
              const dateA = new Date(a.issuedAt || a.createdAt);
              const dateB = new Date(b.issuedAt || b.createdAt);
              return dateB - dateA; // 倒序，最新的排在前面
            });

            // 保留最新的3张卡片，删除其余卡片
            const cardsToKeep = sortedShortCards.slice(0, 3);
            const cardsToRemove = sortedShortCards.slice(3);

            console.log(
              `保留${cardsToKeep.length}张最新短期卡片，删除${cardsToRemove.length}张多余卡片`
            );

            // 删除多余的卡片
            for (const card of cardsToRemove) {
              try {
                await axios.delete(`/api/cards/${card._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                console.log(`已删除多余的短期卡片: ${card._id}`);
              } catch (error) {
                console.error(
                  `删除多余卡片失败:`,
                  error.response?.data?.message || error.message
                );
              }
            }
            madeChanges = true;
          } catch (error) {
            console.error("处理多余短期卡片时出错:", error);
          }
        } else {
          console.log("用户已有正好3张短期卡片");
        }

        // 检查长期卡片数量，确保正好有3张
        if (longCards.length < 3) {
          const longCardsNeeded = 3 - longCards.length;
          console.log(`需要创建${longCardsNeeded}张长期卡片`);

          try {
            // 逐个创建长期卡片
            for (let i = 0; i < longCardsNeeded; i++) {
              await axios.post(
                "/api/cards/issue-blank",
                {
                  title: "初始长期卡片",
                  description: "新用户自动获得的长期卡片",
                  taskDuration: "long",
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            }
            console.log(`成功创建${longCardsNeeded}张长期卡片`);
            madeChanges = true;
          } catch (error) {
            console.error(
              "创建初始长期卡片失败:",
              error.response?.data?.message || error.message
            );
          }
        } else if (longCards.length > 3) {
          console.log(
            `长期卡片数量(${longCards.length})超过了3张，删除多余卡片`
          );

          try {
            // 强制按创建时间排序
            const sortedLongCards = [...longCards].sort((a, b) => {
              const dateA = new Date(a.issuedAt || a.createdAt);
              const dateB = new Date(b.issuedAt || b.createdAt);
              return dateB - dateA; // 倒序，最新的排在前面
            });

            // 保留最新的3张卡片，删除其余卡片
            const cardsToKeep = sortedLongCards.slice(0, 3);
            const cardsToRemove = sortedLongCards.slice(3);

            console.log(
              `保留${cardsToKeep.length}张最新卡片，删除${cardsToRemove.length}张多余卡片`
            );

            // 删除多余的卡片
            for (const card of cardsToRemove) {
              try {
                await axios.delete(`/api/cards/${card._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                console.log(`已删除多余的长期卡片: ${card._id}`);
              } catch (error) {
                console.error(
                  `删除多余卡片失败:`,
                  error.response?.data?.message || error.message
                );
              }
            }
            madeChanges = true;
          } catch (error) {
            console.error("处理多余卡片时出错:", error);
          }
        } else {
          console.log("用户已有正好3张长期卡片");
        }

        // 如果进行了卡片创建或删除操作，再次获取库存以确认数量
        if (madeChanges) {
          // 再次获取用户卡片库存并确认数量是否正确
          const finalCheckResponse = await axios.get(
            "/api/cards/inventory?noAutoIssue=true",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const finalCardData = finalCheckResponse.data;
          const finalShortCards =
            finalCardData.inventory?.filter(
              (card) => card.taskDuration === "short" && card.type === "blank"
            ) || [];
          const finalLongCards =
            finalCardData.inventory?.filter(
              (card) => card.taskDuration === "long" && card.type === "blank"
            ) || [];

          console.log(
            `最终检查: 用户有${finalShortCards.length}张短期卡片和${finalLongCards.length}张长期卡片`
          );
        }
      } else {
        console.log("用户已有足够卡片，无需初始化");
      }
    } catch (error) {
      console.error(
        "初始化卡片失败:",
        error.response?.data?.message || error.message
      );
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

      // 添加一个标记到localStorage，表示这是新注册的用户，需要控制卡片发放
      localStorage.setItem("isNewRegistration", "true");

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
