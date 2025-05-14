import express from "express";
import "./events/listeners.js";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import { setupSocket } from "./socket/socketInit.js";
import http from "http";
import { Server } from "socket.io";

import {
  scheduleDailyCardReset,
  schedulePeriodicCardCheck,
} from "./utils/scheduler.js";

// en.v
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
app.use("/", routes);

// socket.io initialization
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
setupSocket(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  // Initialize scheduled tasks
  try {
    scheduleDailyCardReset();
    schedulePeriodicCardCheck();
    console.log("Scheduled tasks initialized successfully");
  } catch (error) {
    console.error(":Fail", error);
  }
});
