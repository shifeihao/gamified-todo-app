import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    //累计型记录
    level_reach: { type: Number, default: 0 }, // 当前等级
    exp_total: { type: Number, default: 0 }, // 累计经验值
    max_gold: { type: Number, default: 0 }, // 累计金币
    task_completed_total: { type: Number, default: 0 }, // 累计完成任务数
    task_completed_long_total: { type: Number, default: 0 }, // 累计完成长期任务
    task_completed_short_total: { type: Number, default: 0 }, // 累计完成短期任务
    task_deleted_total: { type: Number, default: 0 }, // 删除任务总数
    task_edited_total: { type: Number, default: 0 }, //编辑任务总数
    card_slot_total: { type: Number, default: 0 }, //长期任务卡槽数量
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
  },
  { timestamps: true }
);

const UserStats = mongoose.model("UserStats", UserStatsSchema);
export default UserStats;
