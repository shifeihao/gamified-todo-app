import express from "express";
import "./events/listeners.js";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { setupSocket } from "./socket/socketInit.js";
import http from "http";
import { Server } from "socket.io";

import {
  scheduleDailyCardReset,
  schedulePeriodicCardCheck,
} from "./utils/scheduler.js";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('Logs directory created:', logsDir);
  } catch (err) {
    console.warn('Failed to create logs directory:', err.message);
  }
}


// 加载环境变量
dotenv.config();

// define global variables`
connectDB();

// express app
const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// routes
import routes from "./routes/routes.js";
app.use("/api", routes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Path to the build folder
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));

  // For any routes not matching /api, return index.html
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) return; // Skip API routes
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });

  console.log('Frontend static file serving configured');
} else {
  // Basic route in development
  app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
  });
}


// socket.io initialization
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
setupSocket(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Initialize scheduled tasks
  try {
    scheduleDailyCardReset();
    schedulePeriodicCardCheck();
    console.log("Scheduled tasks initialized successfully");
  } catch (error) {
    console.error(":Fail", error);
  }
});
