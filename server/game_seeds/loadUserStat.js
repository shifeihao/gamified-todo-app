import UserStats from "../models/UserStats.js";

export async function createUserStat(userId) {
  // 删除之前的统计信息
  await UserStats.deleteOne({ user:userId });
  console.log("Delete user statistics successfully");

  // 创建行为统计 UserStats（测试触发成就）
  await UserStats.create({
    user:userId,
  });
  console.log("✅ Testuser & Stats created：test@example.com / 123456");
}
