// server/models/UserLevel.js

import mongoose from 'mongoose';

const userLevelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // Each user has only one level record
  },
  exp: {
    type: Number,
    required: true,
    default: 0     // Current total experience
  },
  lastUpdate: {
    type: Date,
    default: Date.now  // Last experience update time
  }
});

const UserLevel = mongoose.model('UserLevel', userLevelSchema);
export default UserLevel;
