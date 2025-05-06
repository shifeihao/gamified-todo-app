import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // 好计算的（累积型）
    level_reach: { type: Number, default: 0 }, // 当前等级
    exp_total: { type: Number, default: 0 }, // 累计经验值
    max_gold: { type: Number, default: 0 }, // 累计金币
    task_completed_total: { type: Number, default: 0 }, // 累计完成任务数
    task_failed_total: { type: Number, default: 0 }, // 累计失败任务数
    task_deleted_total: { type: Number, default: 0 }, // 删除任务总数
    task_completed_long_total: { type: Number, default: 0 }, // 累计完成长期任务
    task_completed_short_total: { type: Number, default: 0 }, // 累计完成短期任务
    equipped_tasks_total: { type: Number, default: 0 }, // 当前装备的任务数
    task_modified_total: { type: Number, default: 0 }, // 累计修改任务数
    card_slot_total: { type: Number, default: 0 }, // 卡槽总数
    task_deleted_single: { type: Number, default: 0 }, // 删除单个任务数

    //不好计算的

    //连续型
    task_completed_days_in_row: { type: Number, default: 0 }, // 连续完成任务的天数
    task_created_and_finished_within_hour: { type: Number, default: 0 }, // 一小时内完成的任务
    task_failed_days_in_row: { type: Number, default: 0 }, // 连续失败任务的天数
    login_days_in_row: { type: Number, default: 0 }, // 连续登录天数

    //其他型
    login_days_total: { type: Number, default: 0 }, // 累计登录天数
    task_completed_before_8am: { type: Number, default: 0 }, // 8点前完成所有任务的数量
    task_completed_after_11pm: { type: Number, default: 0 }, // 11点后完成的任务数
    task_deleted_all_in_day: { type: Boolean, default: false }, // 今日是否删除所有任务
    task_completed_early_hour: { type: Number, default: 0 }, // 提前1小时完成了任务
    task_created_with_subtasks: { type: Number, default: 0 }, // 创建了子任务的任务数
    task_pending_in_warehouse: { type: Number, default: 0 }, // 仓库中待处理的任务数
    task_completed_last_five_min: { type: Number, default: 0 }, // 最后5分钟完成的任务数
    task_completed_within_hour: { type: Number, default: 0 }, // 一小时内完成的任务数
    achievements_total_unlocked: { type: Number, default: 0 }, // 累计解锁成就数
  },
  { timestamps: true }
);

const UserStats = mongoose.model("UserStats", UserStatsSchema);
export default UserStats;
