import mongoose from 'mongoose';

const UserStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // 📊 任务相关
  task_completed_total: { type: Number, default: 0 },          // 累计完成任务数
  task_failed_total: { type: Number, default: 0 },             // 累计失败任务数
  task_deleted_total: { type: Number, default: 0 },            // 删除任务总数
  task_completed_days_in_row: { type: Number, default: 0 },    // 连续完成任务的天数
  task_completed_long_total: { type: Number, default: 0 },     // 累计完成长期任务
  task_completed_short_total: { type: Number, default: 0 },    // 累计完成短期任务
  task_completed_today: { type: Number, default: 0 },          // 今日完成的任务数量
  task_created_and_finished_within_hour: { type: Number, default: 0 }, // 一小时内完成的任务

  // 🔒 卡槽相关
  tasks_deleted_all_in_day: { type: Boolean, default: false }, // 今日是否清空所有任务
  equipped_tasks_total: { type: Number, default: 0 },          // 当前装备的任务数

  // 🗓️ 登录相关
  login_days_total: { type: Number, default: 0 },              // 累计登录天数
  login_days_in_row: { type: Number, default: 0 },             // 连续登录天数

  // 🧠 等级与经验
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },

  // 📅 日期
  last_login_date: { type: Date, default: null },
  last_task_complete_date: { type: Date, default: null },

}, { timestamps: true });

const UserStats = mongoose.model('UserStats', UserStatsSchema);

export default UserStats;
