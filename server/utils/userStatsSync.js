import UserStats from "../models/UserStats.js";
import User from "../models/User.js";

export async function SyncUserStats(userId) {
  try {
    // 将User表和Stats表同步（金币、累计经验、最大金币数）
    // 1. 获取用户信息
    console.log("开始检查成就");
    console.log("获取用户信息");
    const user = await User.findOne({ _id: userId });
    if (!user) {
      console.error("❌ 成就检查失败：未找到该用户 userId =", userId);
      return;
    }
    console.log("检查成功，用户名是：", user.username);
    // 2. 更新UserStats
    console.log("开始更新用户记录信息，用户名是：", user.username);
    await UserStats.updateOne(
      { user_id: userId },
      {
        exp_total: user.experience,
        level_reach: user.level,
        $max: { max_gold: user.gold },
      },
      { new: true }
    );

    console.log(
      "更新完毕，总经验、当前等级、期望更新金币为:",
      user.experience,
      user.level,
      user.gold
    );
  } catch (error) {
    console.error("❌ 同步出错:", error);
  }
}
