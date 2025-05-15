import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    unique: true,
  },
  expRequired: {
    type: Number, //Total experience points required to reach this level (added from level 1)
    required: true,
  },
  expSegment: {
    type: Number, // The amount of experience required to upgrade from the previous level to this level (n-1 ➜ n)
    required: true,
  },
  expToNext: {
    type: Number, // Experience required to advance from this level to the next level (n ➜ n+1)
    required: true,
  },
});

const Level = mongoose.model('Level', levelSchema);
export default Level;
