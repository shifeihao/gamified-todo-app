import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { io } from "socket.io-client";
import { Routes, Route, Navigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

// components
import HomePage from "./pages/HomePage";
import TasksPage from "./pages/TasksPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import InventoryShopPage from "./pages/InventoryShopPage";
import AchievementCenterPage from "./pages/AchievementCenterPage.js";
import DungeonTest from "./pages/DungeonTest";
import TemplatePage from "./pages/TemplatePage";
import GameLayout from "./pages/Gamelayout.js";

// context
import { AuthProvider } from "./context/AuthContext";

// styles
const ProtectedRoute = ({ children }) => {
  // 从本地存储中获取用户信息
  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  // After successful login, a prompt will be displayed and the page will be redirected.
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  // socket connection
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo"))
      : null;

    if (!userInfo || !userInfo.token) return;

    const socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token: userInfo.token },
    });
    console.log("🔐 token:", userInfo.token);

    socket.on("connect", () => {
      console.log("✅ WebSocket connected");
    });

    socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
    });

    socket.on("newAchievements", (achievements) => {
      console.log("🎉 Received new achievements:", achievements);
      achievements.forEach((ach) => {
        toast.success(`🎉 Achievement Unlocked: ${ach.name}`);
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/inventoryShopTest" element={<InventoryShopPage />} />
          <Route path="/dungeon-test" element={<DungeonTest />} />
          <Route path="/inventory" element={<InventoryShopPage />} />
          <Route path="/gamePanel" element={<GameLayout />} />

          {/* Protected Routes */}
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <AchievementCenterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <TemplatePage />
              </ProtectedRoute>
            }
          />
          {/* 404 Pages */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
