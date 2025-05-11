import mongoose from 'mongoose';

// 子任务模型架构（用于长期任务）
const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide the subtask titles'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide the deadlines of the sub-tasks'],
  },
  completedAt: {
    type: Date,
  },
    // 子任务经验 + 金币
    experience: {
        type: Number,
        default: 5,
    },
    gold: {
        type: Number,
        default: 3,
    },
});

// 任务模型架构
const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // 关联到User模型
    },
    cardUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: [true, 'The used card must be specified']
    },
    baseExperience: {
      type: Number,
      default: 10
    },
    baseGold: {
      type: Number,
      default: 5
    },
      // 新增主任务额外奖励（只针对长期任务）
      finalBonusExperience: {
          type: Number,
          default: 10,
      },
      finalBonusGold: {
          type: Number,
          default: 5,
      },
      title: {
      type: String,
      required: [true, 'Please provide the title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['short', 'long'],
      default: 'short',
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Overdue'],
      default: 'Pending',
    },
    category: {
      type: String,
      trim: true,
      default: 'default',
    },
    dueDate: {
      type: Date,
    },
      //实际完成任务的时间
    completedAt: {
      type: Date,
    },
      //实际获得的经验奖励（可能受卡片影响）
    experienceReward: {
      type: Number,
      default: 10,
    },
      //实际获得的金币奖励（同上）
    goldReward: {
      type: Number,
      default: 5,
    },
    equipped: {
      type: Boolean,
      default: false,
    },
      //装备的任务槽位置（0、1、2），-1 表示未装备
    slotPosition: {
      type: Number,
      default: -1,
    },
    // 装备到槽位的时间
    slotEquippedAt: {
      type: Date,
      default: null
    },
    subTasks: [subTaskSchema], // 长期任务的子任务
  },
  {
    timestamps: true, // 自动添加createdAt和updatedAt字段
  }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;
