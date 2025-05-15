// server/socket/socketInit.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const userSocketMap = {}; // userId => socket

export function setupSocket(io) {
  io.on("connection", async (socket) => {
    const token = socket.handshake.auth.token;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      console.log("✅ Socket authenticated, userId:", userId);
      userSocketMap[userId] = socket;
      socket.on("disconnect", () => {
        delete userSocketMap[userId];
        console.log("❌ WebSocket disconnected:", userId);
      });
    } catch (err) {
      console.error("❌ WebSocket authentication failed", err.message);
      socket.disconnect(true);
    }
  });
}
export function getSocketByUserId(userId) {
  return userSocketMap[userId];
}
