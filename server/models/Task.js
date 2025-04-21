import mongoose from 'mongoose';

// 子任务模型架构（用于长期任务）
const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['待完成', '进行中', '已完成'],
    default: '待完成',
  },
  dueDate: {
    type: Date,
  },
  completedAt: {
    type: Date,
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
      required: [true, '必须指定使用的卡片']
    },
    baseExperience: {
      type: Number,
      default: 10
    },
    baseGold: {
      type: Number,
      default: 5
    },
    title: {
      type: String,
      required: [true, '请提供任务标题'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['短期', '长期'],
      default: '短期',
    },
    status: {
      type: String,
      enum: ['待完成', '进行中', '已完成', '过期'],
      default: '待完成',
    },
    category: {
      type: String,
      trim: true,
      default: '默认',
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
    subTasks: [subTaskSchema], // 长期任务的子任务
  },
  {
    timestamps: true, // 自动添加createdAt和updatedAt字段
  }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;
