import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    //Cumulative Record
    level_reach: { type: Number, default: 0 }, // Current level
    exp_total: { type: Number, default: 0 },
    max_gold: { type: Number, default: 0 }, // Maximum gold
    task_completed_total: { type: Number, default: 0 }, // Total completed tasks
    task_completed_long_total: { type: Number, default: 0 }, // Total completed long-term tasks
    task_completed_short_total: { type: Number, default: 0 }, // Total completed short-term tasks
    task_deleted_total: { type: Number, default: 0 }, // Total deleted tasks
    task_edited_total: { type: Number, default: 0 }, // Total edited tasks
    card_slot_total: { type: Number, default: 0 }, // Total card slots
    achievements_total_unlocked: { type: Number, default: 0 }, // Total unlocked achievements

    //Exploration Record
    max_maze_level:{ type: Number, default: 0 },  //Maximum maze level reached


    //Easter Egg Record
    blank_card_max_held: { type: Number, default: 0 }, //The highest number of blank cards ever held
    special_card_max_held: { type: Number, default: 0 }, // The highest number of special cards ever held
    task_created_max_subtasks: { type: Number, default: 0 }, // The maximum number of subtasks created in a single task
    task_created_earliest_time: { type: String, default: null }, //The earliest task creation time, string format (new)
    task_created_latest_time: { type: String, default: null }, //The latest task creation time, string format (new)
    task_completed_earliest_time: { type: String, default: null }, // The earliest task completion time, string format (new)
    task_completed_latest_time: { type: String, default: null }, // The latest task completion time, string format (new)
    task_completed_short_longest_duration: { type: Number, default: 0 }, //Complete Short Term + Mission Duration + Max: Minutes
    task_completed_short_shortest_duration: { type: Number, default: 0 }, // Complete Short Term + Mission Duration + Min: Minutes
    task_completed_long_longest_duration: { type: Number, default: 0 }, // Complete Long Term + Mission Duration + Max: Minutes
    task_completed_long_shortest_duration: { type: Number, default: 0 }, // Complete Long Term + Mission Duration + Min: Minutes

    //Continuous
    task_completed_days_in_row: { type: Number, default: 0 }, //How many consecutive days has the user completed the task?
    task_uncompleted_days_in_row: { type: Number, default: 0 }, //How many consecutive days have the user failed to complete the task?
  },
  { timestamps: true }
);

const UserStats = mongoose.model("UserStats", UserStatsSchema);
export default UserStats;
