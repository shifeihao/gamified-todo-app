import UserStats from "../models/UserStats.js";
import User from "../models/User.js";
import Card from "../models/Card.js";
import Task from "../models/Task.js";
import Achievement from "../models/Achievement.js";
import TaskHistory from "../models/TaskHistory.js";
import UserAchievement from "../models/UserAchievement.js";
import { UserDungeonStats } from "../models/UserDungeonStats.js";
import { checkAndUnlockAchievements } from "./checkAchievements.js";

// call this function to sync user stats
export async function SyncUserStats(userId) {
  await checkUserStats(userId);
  await SyncUser(userId);
  await SyncTaskHistory(userId);
  await checkCardNumber(userId);
  await checkTaskNumber(userId);
  await checkGameStats(userId);
  await checkAndUnlockAchievements(userId);
}
// check if UserStats table exists
export async function checkUserStats(userId) {
  console.log("check UserStats");
  const userStats = await UserStats.findOne({ user: userId });
  if (!userStats) {
    console.log("UserStats does not exist, creating a new one");
    const newUserStats = new UserStats({ user: userId });
    await newUserStats.save();
  } else {
    console.log("UserStats is already exist");
  }
}
//check User
export async function SyncUser(userId) {
  try {
    // Synchronize the User table and the Stats table (gold coins, accumulated experience, maximum number of gold coins)
    // 1. Get user information
    const user = await User.findOne({ _id: userId });
    if (!user) {
      console.error(
        "❌ Achievement check failed: User not found userId = ",
        userId
      );
      return;
    }
    console.log("Check successful, the username is:", user.username);

    // 2. update UserStats
    console.log(
      "Start updating user record information, the user name is:",
      user.username
    );
    const allSlotNum = user.shortCardSlot + user.longCardSlot;
    await UserStats.updateOne(
      { user: userId },
      {
        exp_total: user.experience,
        level_reach: user.level,
        card_slot_total: allSlotNum,
        $max: { max_gold: user.gold },
      },
      { new: true }
    );
  } catch (error) {
    console.error("❌ Synchronization error:", error);
  }
}
//check TaskHistory
export async function SyncTaskHistory(userId) {
  try {
    //Get TaskHistory Record
    const taskHistory = await TaskHistory.find({ user: userId });
    if (taskHistory.length === 0) {
      console.error("❌ No mission record");
      return;
    }

    //Statistics show that all tasks have been completed. If no tasks have been completed, return directly
    const checkCompletedTasks = taskHistory.filter(
      (t) => t.status === "Completed" || t.status === "completed"
    );
    if (checkCompletedTasks.length === 0) {
      console.error("❌ No tasks completed");
      return;
    }

    // Correctly count the number
    const completedNum = taskHistory.filter(
      (t) => t.status === "Completed"
    ).length;
    const completedShortNum = taskHistory.filter(
      (t) => t.status === "Completed" && t.type === "short"
    ).length;
    const completedLongNum = taskHistory.filter(
      (t) => t.status === "Completed" && t.type === "long"
    ).length;
    const useSpecialNum = taskHistory.filter(
      (t) => t.cardType === "special"
    ).length;

    //Find the earliest/latest time of task completion time (completedAt)
    const sortedByCompletedTime = [...taskHistory]
      .filter((t) => t.completedAt)
      .sort((a, b) => toSeconds(a.completedAt) - toSeconds(b.completedAt));

    let earlisterComp = null;
    let latestComp = null;

    if (sortedByCompletedTime.length > 0) {
      earlisterComp = toTimeStr(sortedByCompletedTime[0].completedAt);
      latestComp = toTimeStr(sortedByCompletedTime.at(-1).completedAt);
    }

    // Find the longest/shortest duration
    const shortTasks = taskHistory.filter(
      (t) => t.type === "short" && t.status === "Completed"
    );
    const longTasks = taskHistory.filter(
      (t) => t.type === "long" && t.status === "Completed"
    );
    const shortShortestTask = getMinDuration(shortTasks);
    const shortLongestTask = getMaxDuration(shortTasks);
    const longShortestTask = getMinDuration(longTasks);
    const longLongestTask = getMaxDuration(longTasks);

    // Find out the number of consecutive days the user has completed the task/the number of consecutive days the user has not completed the task

    // Get all "completed" tasks for this user
    const completedTasks = await TaskHistory.find({
      user: userId,
      status: { $in: ["Completed", "finished", "已完成", "completed"] },
      completedAt: { $exists: true },
    });

    // Use Set to save the "date string" of the completed task (format: "YYYY-MM-DD")
    const completedDays = new Set(
      completedTasks.map((task) => task.completedAt.toISOString().slice(0, 10))
    );
    //Set streak (continuous completion)
    let streak = 0;
    let current = new Date();
    while (true) {
      const key = current.toISOString().slice(0, 10);
      if (completedDays.has(key)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    // Reset date and calculate unStreak (continuous unfinished)
    let unStreak = 0;
    current = new Date();
    while (true) {
      const key = current.toISOString().slice(0, 10);
      if (!completedDays.has(key)) {
        unStreak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    // Write all records to the database
    await UserStats.updateOne(
      { user: userId },
      {
        task_completed_total: completedNum,
        task_completed_short_total: completedShortNum,
        task_completed_long_total: completedLongNum,
        special_card_used_total: useSpecialNum,
        task_completed_earliest_time: earlisterComp,
        task_completed_latest_time: latestComp,
        task_completed_short_longest_duration: shortLongestTask?.duration || 0,
        task_completed_short_shortest_duration:
          shortShortestTask?.duration || 0,
        task_completed_long_longest_duration: longLongestTask?.duration || 0,
        task_completed_long_shortest_duration: longShortestTask?.duration || 0,
        task_completed_days_in_row: streak,
        task_uncompleted_days_in_row: unStreak,
      },
      { new: true }
    );
  } catch (error) {
    console.error("❌ Synchronization error:", error);
  }
}
//check Card
export async function checkCardNumber(userId) {
  const cardHistory = await Card.find({ user: userId });
  if (cardHistory.length === 0) {
    console.error("❌ No mission record");
    return;
  }
  const blanckCardNum = cardHistory.filter((t) => t.type === "blank").length;
  const specialCardNum = cardHistory.filter((t) => t.type === "special").length;

  //Check which record is bigger and select the bigger record
  await UserStats.updateOne(
    { user: userId },
    {
      $max: {
        blank_card_max_held: blanckCardNum,
        special_card_max_held: specialCardNum,
      },
    }
  );
}
//check Task
export async function checkTaskNumber(userId) {
  const taskCreate = await Task.find({ user: userId });
  if (taskCreate.length === 0) {
    console.error("❌ No mission record");
    return;
  }
  //Find out the earliest and latest times in createdAt when the task was created (in hours: minutes: seconds)
  const sortedByTime = [...taskCreate].sort(
    (a, b) => toSeconds(a.createdAt) - toSeconds(b.createdAt)
  );

  const earlisterTimeStr = toTimeStr(sortedByTime[0].createdAt);
  const laterTimeStr = toTimeStr(sortedByTime.at(-1).createdAt);

  //Record the maximum number of subtasks in the long-term task created, and record it as soon as it is created
  const longTasks = taskCreate.filter((t) => t.type === "long");
  const maxSubtaskCount = longTasks.reduce((max, current) => {
    const count = current.subTasks?.length || 0;
    return count > max ? count : max;
  }, 0);

  await UserStats.updateOne(
    { user: userId },
    {
      task_created_earliest_time: earlisterTimeStr,
      task_created_latest_time: laterTimeStr,
      $max: { task_created_max_subtasks: maxSubtaskCount },
    }
  );
}
//delete one task and task_deleted_total push +1
export async function addDeletedTasksNum(userId) {
  // 1. Check if the UserStats table exists
  const userStats = await UserStats.findOne({ user: userId });
  if (!userStats) {
    console.error(
      "❌ Achievement check failed: No record found for this user",
      userId
    );
    return;
  }
  await UserStats.updateOne(
    { user: userId },
    { $inc: { task_deleted_total: 1 } }
  );
}
//update one task and task_edited_total push +1
export async function addEditedTasksNum(userId) {
  // 1. Check if the UserStats table exists
  const userStats = await UserStats.findOne({ user: userId });
  if (!userStats) {
    console.error(
      "❌ Achievement check failed: No record found for this user",
      userId
    );
    return;
  }
  await UserStats.updateOne(
    { user: userId },
    { $inc: { task_edited_total: 1 } }
  );
}
//check game stats
export async function checkGameStats(userId) {
  // check if the UserDungeonStats table exists
  const dungeonStats = await UserDungeonStats.findOne({ user: userId });
  if (!dungeonStats) {
    console.error(
      "❌ Achievement game information: User not found userId = ",
      userId
    );
    return;
  }
  const { exploredFloors } = dungeonStats;
  if (!Array.isArray(exploredFloors) || exploredFloors.length === 0) {
    console.error("❌ exploredFloors is invalid or empty");
    return;
  }
  const maxFloor = Math.max(...exploredFloors);
  await UserStats.updateOne(
    { user: userId },
    { $max: { max_maze_level: maxFloor } }
  );
}
//check if the user has unlocked the "God of Achievement" achievement
export async function checkIfGodAchievementUnlocked(userId) {
  // 1. Get user information
  const user = await User.findOne({ _id: userId });
  if (!user) {
    console.error(
      "❌ Achievement check failed: User not found userId =",
      userId
    );
    return;
  }
  console.log("Check successful, the username is:", user.username);

  // Check if the UserStats table exists
  await checkUserStats(userId);

  // 1. Re-acquire unlocked achievements
  const unlockedAchievements = await UserAchievement.find({ user: userId });
  const unlockedCount = unlockedAchievements.length;
  // 2. Update the achievements_total_unlocked field in UserStats
  await UserStats.updateOne(
    { user: userId },
    { achievements_total_unlocked: unlockedCount }
  );
  console.log(
    `🔢 User ${userId} The total number of achievements has been updated:${unlockedCount}`
  );
  // 3. Get the total number of enabled achievements (filter out unenabled ones)
  const allEnabledAchievements = await Achievement.find({ isEnabled: true });
  const totalAchievementsCount = allEnabledAchievements.length;
  // 4. Find the "God of Achievement" achievement definition
  const godAchievement = await Achievement.findOne({
    logic: { type: "achievements_total_unlocked" },
  });
  // 5. check if the user has already unlocked the achievement
  console.log();
  const alreadyUnlocked = unlockedAchievements.some(
    (ua) => ua.achievementName.toString() === godAchievement?.name?.toString()
  );
  if (
    godAchievement &&
    !alreadyUnlocked &&
    unlockedCount >= totalAchievementsCount - 1
  ) {
    await UserAchievement.create({
      user: userId,
      achievementId: godAchievement._id,
      achievementName: godAchievement.name,
    });
    console.log(`🏆 User ${userId} unlock: ${godAchievement.name}`);
  }
}

//tools
// time format
function toSeconds(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}
function toTimeStr(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}
// time format2
function getMinDuration(tasks) {
  return tasks.reduce(
    (min, curr) => (!min || curr.duration < min.duration ? curr : min),
    null
  );
}
function getMaxDuration(tasks) {
  return tasks.reduce(
    (max, curr) => (!max || curr.duration > max.duration ? curr : max),
    null
  );
}
