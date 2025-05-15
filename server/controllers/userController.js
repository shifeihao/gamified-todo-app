import User from "../models/User.js";
import { generateToken } from "../middleware/auth.js";
import { checkUserStats } from "../utils/userStatsSync.js";

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Create a New User
    const user = await User.create({
      username,
      email,
      password,
    });

    // Creating User Statistics
    await checkUserStats(user._id);

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        experience: user.experience,
        gold: user.gold,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    User login
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user and include the password field
    const user = await User.findOne({ email }).select("+password");
    // Check if the user exists and the password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        experience: user.experience,
        gold: user.gold,
        token: generateToken(user._id),
        shortCardSlot: user.shortCardSlot,
        longCardSlot: user.longCardSlot,
      });
    } else {
      res.status(401).json({ message: "Incorrect email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get current user information
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        experience: user.experience,
        gold: user.gold,
        shortCardSlot: user.shortCardSlot,
        longCardSlot: user.longCardSlot,
      });
    } else {
      res.status(404).json({ message: "User does not exist" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update User Information
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        experience: updatedUser.experience,
        gold: updatedUser.gold,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User does not exist" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export { registerUser, loginUser, getUserProfile, updateUserProfile };
