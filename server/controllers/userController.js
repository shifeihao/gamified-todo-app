import User from "../models/User.js";
import { generateToken } from "../middleware/auth.js";
import { checkUserStats } from "../utils/userStatsSync.js";

// @desc    注册新用户
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // 检查用户是否已存在
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "用户已存在" });
    }
    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
    });

    // 创建用户统计信息
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
      res.status(400).json({ message: "无效的用户数据" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc    用户登录
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户并包含密码字段
    const user = await User.findOne({ email }).select("+password");
    // 检查用户是否存在以及密码是否匹配
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
      res.status(401).json({ message: "邮箱或密码不正确" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc    获取当前用户信息
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        level:user.level,
        email: user.email,
        role: user.role,
        experience: user.experience,
        gold: user.gold,
        shortCardSlot: user.shortCardSlot,
        longCardSlot: user.longCardSlot,
      });
    } else {
      res.status(404).json({ message: "用户不存在" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// @desc    更新用户信息
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
        level:user.level,
        email: updatedUser.email,
        role: updatedUser.role,
        experience: updatedUser.experience,
        gold: updatedUser.gold,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "用户不存在" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误" });
  }
};

export { registerUser, loginUser, getUserProfile, updateUserProfile };
