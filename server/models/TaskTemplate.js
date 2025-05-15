import mongoose from 'mongoose';

const taskTemplateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, 'Please provide a template title'],
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
    enum: ['short', 'long'],
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