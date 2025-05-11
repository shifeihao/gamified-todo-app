import mongoose from 'mongoose';

const taskTemplateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, '请提供模板标题'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    default: 'default',
    trim: true,
  },
  type: {
    type: String,
    enum: ['短期', '长期'],
    required: true,
  },
  subTasks: [{
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    }
  }]
}, {
  timestamps: true,
});

export default mongoose.model('TaskTemplate', taskTemplateSchema); 