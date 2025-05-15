import mongoose from 'mongoose';

// Subtask model architecture (for long-term tasks)
const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide the subtask titles'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'in-progress', 'expired'],
    default: 'pending',
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide the deadlines of the sub-tasks'],
  },
  completedAt: {
    type: Date,
  },
    // Sub-task experience + gold
    experience: {
        type: Number,
        default: 30,
    },
    gold: {
        type: Number,
        default: 15,
    },
});

// Task Model Architecture
const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Related to the User model
    },
    cardUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: [true, 'The used card must be specified']
    },
    baseExperience: {
      type: Number,
      default: 30
    },
    baseGold: {
      type: Number,
      default: 15
    },
      // Added additional rewards for main tasks (only for long-term tasks)
      finalBonusExperience: {
          type: Number,
          default: 30,
      },
      finalBonusGold: {
          type: Number,
          default: 15,
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
      enum: ['completed', 'pending', 'in-progress', 'expired'],
      default: 'pending',
    },
    category: {
      type: String,
      trim: true,
      default: 'default',
    },
    dueDate: {
      type: Date,
    },
      //The actual time to complete the task
    completedAt: {
      type: Date,
    },
      //Actual experience reward obtained (may be affected by cards)
    experienceReward: {
      type: Number,
      default: 30,
    },
      //Actual gold coin rewards obtained (same as above)
    goldReward: {
      type: Number,
      default: 15,
    },
    equipped: {
      type: Boolean,
      default: false,
    },
      //The task slot position of the equipment (0, 1, 2), -1 means not equipped
    slotPosition: {
      type: Number,
      default: -1,
    },
    // Time to equip to slot
    slotEquippedAt: {
      type: Date,
      default: null
    },
    // Mark whether the task reward has been received
    rewardClaimed: {
      type: Boolean,
      default: false
    },
    subTasks: [subTaskSchema], // Subtasks of long-term tasks
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;
