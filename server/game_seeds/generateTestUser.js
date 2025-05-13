// seeds/generateTestUser.js
import User from "../models/User.js";

export async function generateTestUser() {
  try {
    const testuser = {
      username: "testuser",
      email: "testuser@example.com",
      password: "123456",
      gold: 99999,
    };

    const user = await User.findOne({ username: testuser.username });

    if (user) {
      console.log("testuser.username", user.username);
      console.log("testuser.email", user._id);
      console.log("✅ Test user already exists, skip creation");
      return;
    }
    // 创建测试用户
    const newUser = await User.create(testuser);
    console.log("✅ Test user created:)", newUser.username);
  } catch (err) {
    console.error("❌ Failed to create test user:", err);
  }
}
