import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // 好计算的
    //累计型记录
    level_reach: { type: Number, default: 0 }, // 当前等级
    exp_total: { type: Number, default: 0 }, // 累计经验值
    max_gold: { type: Number, default: 0 }, // 累计金币
    task_completed_total: { type: Number, default: 0 }, // 累计完成任务数
    task_completed_long_total: { type: Number, default: 0 }, // 累计完成长期任务
    task_completed_short_total: { type: Number, default: 0 }, // 累计完成短期任务
    task_deleted_total: { type: Number, default: 0 }, // 删除任务总数
    task_edited_total: { type: Number, default: 0 }, //编辑任务总数
    task_short_slot: { type: Number, default: 0 }, //短期任务卡槽数量
    task_long_slot: { type: Number, default: 0 }, //长期任务卡槽数量
    achievements_total_unlocked: { type: Number, default: 0 }, //统计总成就数量

    //彩蛋型记录
    blank_card_max_held: { type: Number, default: 0 }, // 持有过最高数量的白卡
    special_card_max_held: { type: Number, default: 0 }, // 持有过最高数量的special card
    task_created_max_subtasks: { type: Number, default: 0 }, //创建长期任务里最大的子任务总数
    task_created_earliest_time: { type: String, default: null }, //最早的任务创建时间，字符串格式（新增）
    task_created_latest_time: { type: String, default: null }, //最晚的任务创建时间，字符串格式（新增）
    task_completed_earliest_time: { type: String, default: null }, //完成任务最早的时间
    task_completed_latest_time: { type: String, default: null }, //完成任务最晚的时间
    task_completed_short_longest_duration: { type: Number, default: 0 }, //完成短期+任务持续时间+最长：分钟
    task_completed_short_shortest_duration: { type: Number, default: 0 }, //完成短期+任务持续时间+最短：分钟
    task_completed_long_longest_duration: { type: Number, default: 0 }, //完成长期+任务持续时间+最长：分钟
    task_completed_long_shortest_duration: { type: Number, default: 0 }, //完成长期+任务持续时间+最短：分钟

    //持续型的
    task_completed_days_in_row: { type: Number, default: 0 }, //用户连续多少天都有完成任务
    task_uncompleted_days_in_row: { type: Number, default: 0 }, //用户连续多少天都没有完成任务

    // //等待计算的
    // task_failed_total: { type: Number, default: 0 }, // 累计失败任务数
    // task_deleted_total: { type: Number, default: 0 }, // 删除任务总数
    // equipped_tasks_total: { type: Number, default: 0 }, // 当前装备的任务数
    // task_modified_total: { type: Number, default: 0 }, // 累计修改任务数
    // card_slot_total: { type: Number, default: 0 }, // 卡槽总数
    // task_deleted_single: { type: Number, default: 0 }, // 删除单个任务数

    // //不好计算的
    // //连续型
    // task_completed_days_in_row: { type: Number, default: 0 }, // 连续完成任务的天数
    // task_created_and_finished_within_hour: { type: Number, default: 0 }, // 一小时内完成的任务
    // task_failed_days_in_row: { type: Number, default: 0 }, // 连续失败任务的天数
    // login_days_in_row: { type: Number, default: 0 }, // 连续登录天数

    // //其他型
    // login_days_total: { type: Number, default: 0 }, // 累计登录天数
    // task_completed_before_8am: { type: Number, default: 0 }, // 8点前完成所有任务的数量
    // task_completed_after_11pm: { type: Number, default: 0 }, // 11点后完成的任务数
    // task_deleted_all_in_day: { type: Boolean, default: false }, // 今日是否删除所有任务
    // task_completed_early_hour: { type: Number, default: 0 }, // 提前1小时完成了任务
    // task_created_with_subtasks: { type: Number, default: 0 }, // 创建了子任务的任务数
    // task_pending_in_warehouse: { type: Number, default: 0 }, // 仓库中待处理的任务数
    // task_completed_last_five_min: { type: Number, default: 0 }, // 最后5分钟完成的任务数
    // task_completed_within_hour: { type: Number, default: 0 }, // 一小时内完成的任务数
    // achievements_total_unlocked: { type: Number, default: 0 }, // 累计解锁成就数
  },
  { timestamps: true }
);

const UserStats = mongoose.model("UserStats", UserStatsSchema);
export default UserStats;
