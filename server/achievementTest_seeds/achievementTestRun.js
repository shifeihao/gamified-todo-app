import { ensureTestUser } from "./generateTestUser.js";
import { loadDefaultAchievements } from "./loadDefaultAchievements.js";
import mongoose from "mongoose";

await mongoose.connect(
  `mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
);

await ensureTestUser();
await loadDefaultAchievements();
