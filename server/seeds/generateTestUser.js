// seeds/generateTestUser.js
import User from "../models/User.js";
import UserStats from "../models/UserStats.js";

export async function ensureTestUser() {
  try {
    const email = "test@example.com";
    // ✅ 无论如何先拿到用户（可能是 null）
    let user = await User.findOne({ email });
    // ✅ 如果用户不存在，就创建
    if (!user) {
      console.log("🆕 测试用户不存在，正在创建...");
      user = new User({
        email,
        username: "testuser",
        password: "123456",
      });
      await user.save();
      console.log("✅ 已创建测试用户");
    } else {
      console.log("🧪 测试用户已存在，继续执行 stats 初始化");
    }

    // 清空旧的 UserStats（如果存在）
    await UserStats.deleteOne({ user: user._id });
    console.log("✅ 清空旧的 UserStats");

    // 创建行为统计 UserStats（测试触发成就）
    await UserStats.create({
      user: user._id,
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
      task_deleted_all_in_day: true, // 今日是否删除所有任务
      task_completed_early_hour: 4, // 提前1小时完成了任务
      task_created_with_subtasks: 6, // 创建了子任务的任务数
      task_pending_in_warehouse: 6, // 仓库中待处理的任务数
      task_completed_last_five_min: 2, // 最后5分钟完成的任务数
      task_completed_within_hour: 2, // 一小时内完成的任务数（可与上面合并统计）
      achievements_total_unlocked: 30, // 累计解锁成就数
    });

    console.log("✅ 测试用户 & Stats 已创建：test@example.com / 123456");
  } catch (err) {
    console.error("❌ 创建测试用户失败:", err);
  }
}
