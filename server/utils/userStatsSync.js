import UserStats from "../models/UserStats.js";
import User from "../models/User.js";
import Card from "../models/Card.js";
import Task from "../models/Task.js";
import Achievement from "../models/Achievement.js";
import TaskHistory from "../models/TaskHistory.js";
import UserAchievement from "../models/UserAchievement.js";

//统一调动所有函数同步UserStats
export async function SyncUserStats(userId) {
  await SyncUser(userId);
  await SyncTaskHistory(userId);
  await checkCardNumber(userId);
  await checkTaskNumber(userId);
}

//统计User
export async function SyncUser(userId) {
  try {
    // 将User表和Stats表同步（金币、累计经验、最大金币数）
    // 1. 获取用户信息
    console.log("开始检查成就");
    console.log("获取用户信息");
    const user = await User.findOne({ _id: userId });
    if (!user) {
      console.error("❌ 成就检查失败：未找到该用户 userId =", userId);
      return;
    }
    console.log("检查成功，用户名是：", user.username);
    // 2. 更新UserStats
    console.log("开始更新用户记录信息，用户名是：", user.username);
    await UserStats.updateOne(
      { user_id: userId },
      {
        exp_total: user.experience,
        level_reach: user.level,
        task_short_slot: user.shortCardSlot,
        task_long_slot: user.longCardSlot,
        $max: { max_gold: user.gold },
      },
      { new: true }
    );
  } catch (error) {
    console.error("❌ 同步出错:", error);
  }
}
//统计TaskHistory（已经完成的任务情况）
export async function SyncTaskHistory(userId) {
  try {
    //获取TaskHistory记录
    const taskHistory = await TaskHistory.find({ user: userId });
    if (taskHistory.length === 0) {
      console.error("❌ 没有任务记录");
      return;
    }

    // 正确统计数量
    const completedNum = taskHistory.filter(
      (t) => t.status === "已完成"
    ).length;
    const completedShortNum = taskHistory.filter(
      (t) => t.status === "已完成" && t.type === "短期"
    ).length;
    const completedLongNum = taskHistory.filter(
      (t) => t.status === "已完成" && t.type === "长期"
    ).length;
    const useSpecialNum = taskHistory.filter(
      (t) => t.cardType === "special"
    ).length;

    //找出任务完成时间（completedAt）中的最早/最晚时间
    const sortedByCompletedTime = [...taskHistory]
      .filter((t) => t.completedAt)
      .sort((a, b) => toSeconds(a.completedAt) - toSeconds(b.completedAt));
    const earlisterComp = toTimeStr(sortedByCompletedTime[0].completedAt);
    const latestComp = toTimeStr(sortedByCompletedTime.at(-1).completedAt);

    // 找出持续时间 最长/最短
    const shortTasks = taskHistory.filter(
      (t) => t.type === "短期" && t.status === "已完成"
    );
    const longTasks = taskHistory.filter(
      (t) => t.type === "长期" && t.status === "已完成"
    );
    const shortShortestTask = getMinDuration(shortTasks);
    const shortLongestTask = getMaxDuration(shortTasks);
    const longShortestTask = getMinDuration(longTasks);
    const longLongestTask = getMaxDuration(longTasks);

    // 找出用户连续完成任务的天数/连续多少天没有做任务的天数
    // 获取该用户所有“已完成”的任务
    const completedTasks = await TaskHistory.find({
      user: userId,
      status: "已完成",
      completedAt: { $exists: true },
    });

    // 用 Set 保存完成任务的“日期字符串”（格式："YYYY-MM-DD"）
    const completedDays = new Set(
      completedTasks.map((task) => task.completedAt.toISOString().slice(0, 10))
    );

    // 设置 streak（连续完成）
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

    // 重置日期再算 unStreak（连续未完成）
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
    console.log("streak", streak);
    console.log("unStreak", unStreak);

    // 把所有记录写入数据库
    await UserStats.updateOne(
      { user_id: userId },
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
    console.error("❌ 同步出错:", error);
  }
}
//统计Card
export async function checkCardNumber(userId) {
  const cardHistory = await Card.find({ user: userId });
  if (cardHistory.length === 0) {
    console.error("❌ 没有任务记录");
    return;
  }
  const blanckCardNum = cardHistory.filter((t) => t.type === "blank").length;
  const specialCardNum = cardHistory.filter((t) => t.type === "special").length;
  console.log("blanckCardNum", blanckCardNum);
  console.log("specialCardNum", specialCardNum);

  //查看和记录里的比谁更大，选择大的记录
  await UserStats.updateOne(
    { user_id: userId },
    {
      $max: {
        blank_card_max_held: blanckCardNum,
        special_card_max_held: specialCardNum,
      },
    }
  );
}
//统计Task（创建的任务情况）
export async function checkTaskNumber(userId) {
  const taskCreate = await Task.find({ user: userId });
  if (taskCreate.length === 0) {
    console.error("❌ 没有任务记录");
    return;
  }

  //找出任务创建createdAt 中的最早和最晚时刻（按“小时:分钟:秒”）
  const sortedByTime = [...taskCreate].sort(
    (a, b) => toSeconds(a.createdAt) - toSeconds(b.createdAt)
  );

  console.log("sortedByTime", sortedByTime);
  const earlisterTimeStr = toTimeStr(sortedByTime[0].createdAt);
  const laterTimeStr = toTimeStr(sortedByTime.at(-1).createdAt);
  console.log("earlisterTimeStr", earlisterTimeStr);
  console.log("laterTimeStr", laterTimeStr);

  //记录创建过的长期任务中子任务最多的数量，只要创建就记录下来
  const longTasks = taskCreate.filter((t) => t.type === "长期");
  const maxSubtaskCount = longTasks.reduce((max, current) => {
    const count = current.subTasks?.length || 0;
    return count > max ? count : max;
  }, 0);

  await UserStats.updateOne(
    { user_id: userId },
    {
      task_created_earliest_time: earlisterTimeStr,
      task_created_latest_time: laterTimeStr,
      $max: { task_created_max_subtasks: maxSubtaskCount },
    }
  );
}
//删除一个任务，task_deleted_total计数器+1
export async function addDeletedTasksNum(userId) {
  await UserStats.updateOne(
    { user_id: userId }, // 查找条件
    { $inc: { task_deleted_total: 1 } } // 更新内容：将该字段 +1
  );
}
//编辑一个任务，task_edited_total计数器+1
export async function addEditedTasksNum(userId) {
  await UserStats.updateOne(
    { user_id: userId }, // 查找条件
    { $inc: { task_edited_total: 1 } } // 更新内容：将该字段 +1
  );
}
//统计个人成就数量/判断是否解锁成就之神
export async function checkIfGodAchievementUnlocked(userId) {
  // 1. 重新获取已解锁成就
  const unlockedAchievements = await UserAchievement.find({ user_id: userId });
  const unlockedCount = unlockedAchievements.length;
  // 2. 更新 UserStats 中的 achievements_total_unlocked 字段
  await UserStats.updateOne(
    { user_id: userId },
    { $set: { achievements_total_unlocked: unlockedCount } }
  );
  console.log(`🔢 用户 ${userId} 的成就总数已更新：${unlockedCount}`);
  // 3. 获取总启用成就数量（过滤掉未启用的）
  const allEnabledAchievements = await Achievement.find({ isEnabled: true });
  const totalAchievementsCount = allEnabledAchievements.length;
  // 4. 查找“成就之神”成就定义
  const godAchievement = await Achievement.findOne({
    logic: { type: "achievements_total_unlocked" },
    isEnabled: true,
  });
  // 5. 判断是否需要解锁“成就之神”
  const alreadyUnlocked = unlockedAchievements.some(
    (ua) => ua.achievementId.toString() === godAchievement?._id?.toString()
  );
  if (
    godAchievement &&
    !alreadyUnlocked &&
    unlockedCount >= totalAchievementsCount - 1
  ) {
    await UserAchievement.create({
      user_id: userId,
      achievementId: godAchievement._id,
      achievementName: godAchievement.name,
    });
    console.log(`🏆 用户 ${userId} 解锁成就之神：${godAchievement.name}`);
  }
}

//计算函数工具
// 时间排序函数：最早 & 最晚时间（hh:mm:ss）
function toSeconds(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}
function toTimeStr(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}
// 持续时间排序
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
