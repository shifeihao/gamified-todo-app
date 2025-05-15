// server/events/listeners.js
import eventBus from "./eventBus.js";
import { SyncUserStats } from "../utils/userStatsSync.js";
import { checkAndUnlockAchievements } from "../utils/checkAchievements.js";
import { getSocketByUserId } from "../socket/socketInit.js";

// listen for taskCompleted event
eventBus.on("checkAchievements", async (userId) => {
  console.log("📢 Received checkAchievements event...");
  await SyncUserStats(userId);
  let allUnlocked = [];
  let round = 0;
  while (true) {
    const unlocked = await checkAndUnlockAchievements(userId);
    console.log(
      `🌀 Round ${++round} unlock result:`,
      unlocked.map((a) => a.name)
    );
    if (unlocked.length === 0) break;
    allUnlocked.push(...unlocked);
    // ⚠️ Safety limit: If over 50 rounds, it may indicate a circular unlocking logic
    if (round > 50) {
      throw new Error(
        "❌ Achievement unlocking exceeded 50 rounds. Possible infinite loop detected."
      );
    }
    await SyncUserStats(userId); // Reward changes stats, ensure updated for next round
  }
  if (allUnlocked.length > 0) {
    console.log(
      "🎉 Total unlocked achievements:",
      allUnlocked.map((a) => a.name)
    );

    const socket = getSocketByUserId(userId);
    if (socket) {
      socket.emit("newAchievements", allUnlocked); // Emit to the user
    }
  }
});
