// models/TaskHistory.js
import mongoose from 'mongoose';

const taskHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: String,
    type: { type: String, enum: ['Short', 'Long'], required: true },
    status: { type: String, enum: ['Finished', 'Expired'], default: 'Finished' },
    completedAt: Date,
    duration: Number, // ms
    experienceGained: Number,
    goldGained: Number,
    cardType: String, // blank, special, etc.
    cardBonus: Object, // bonus multipliers, optional
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('TaskHistory', taskHistorySchema);
