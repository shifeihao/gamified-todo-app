// models/TaskHistory.js
import mongoose from 'mongoose';

const taskHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: String,
    type: { type: String, enum: ['short', 'long'], required: true },
    status: {
        type: String,
        enum: ['completed', 'pending', 'in-progress', 'expired'],
        default:'completed',
    },
    completedAt: Date,
    duration: Number, // ms
    experienceGained: Number,
    goldGained: Number,
    cardType: String, // blank, special, etc.
    cardBonus: Object, // bonus multipliers, optional
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('TaskHistory', taskHistorySchema);
