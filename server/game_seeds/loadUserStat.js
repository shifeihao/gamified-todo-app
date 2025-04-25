import UserStats from "../models/UserStats.js";
import { checkAndUnlockAchievements } from "../utils/achievementEngine.js";

export async function createUserStat(userId) {
  // 创建行为统计 UserStats（测试触发成就）
  await UserStats.create({
    user: userId,
    // 基础累计型
    level_reach: 60, // 当前等级
    exp_total: 50000, // 累计经验值
    task_completed_total: 1000, // 累计完成任务数
    task_failed_total: 12, // 累计失败任务数
    task_deleted_total: 20, // 删除任务总数
    task_completed_long_total: 10, // 累计完成长期任务
    task_completed_short_total: 30, // 累计完成短期任务
    equipped_tasks_total: 0, // 当前装备的任务数（测试值）
    task_modified_total: 15, // 累计修改任务数
    card_slot_total: 10, // 卡槽总数
    task_deleted_single: 2, // 删除单个任务数

    // 连续型
    task_completed_days_in_row: 365, // 连续完成任务的天数
    task_created_and_finished_within_hour: 2, // 一小时内完成的任务
    task_failed_days_in_row: 10, // 连续失败任务的天数（可留为 0）
    login_days_in_row: 40, // 连续登录天数

    // 其他型
    login_days_total: 120, // 累计登录天数
    task_completed_before_8am: 1, // 8点前完成所有任务的数量
    task_completed_after_11pm: 1, // 11点后完成的任务数
    task_deleted_all_in_day: 1, // 今日是否删除所有任务
    task_completed_early_hour: 4, // 提前1小时完成了任务
    task_created_with_subtasks: 6, // 创建了子任务的任务数
    task_pending_in_warehouse: 6, // 仓库中待处理的任务数
    task_completed_last_five_min: 2, // 最后5分钟完成的任务数
    task_completed_within_hour: 2, // 一小时内完成的任务数（可与上面合并统计）
    achievements_total_unlocked: 30, // 累计解锁成就数
  });
  console.log("✅ 测试用户 & Stats 已创建：test@example.com / 123456");
  await checkAndUnlockAchievements(userId); // 触发成就检查
  console.log("✅ 成就检查已触发");
}
