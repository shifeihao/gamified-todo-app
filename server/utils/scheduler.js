import cron from "node-cron";
import User from "../models/User.js";
import Card from "../models/Card.js";

// every day at midnight reset all users' daily cards
const scheduleDailyCardReset = () => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        console.log("Start daily card reset...");
        const users = await User.find();

        for (const user of users) {
          // create 3 blank cards for each user
          const blankCards = await Promise.all(
            [...Array(3)].map(() =>
              Card.create({
                user: user._id,
                type: "blank",
                title: "blank",
                description: "can be used to create a new card",
                taskDuration: "short",
                issuedAt: new Date(),
              })
            )
          );
          // add blank cards to user's card inventory
          user.cardInventory.push(...blankCards.map((card) => card._id));
          user.dailyCards.blank = 3;
          user.dailyCards.lastIssued = new Date();
          await user.save();
        }

        console.log("Cards reset complete");
      } catch (error) {
        console.error("Fail to reset card:", error);
      }
    },
    {
      timezone: "Asia/Shanghai",
    }
  );
};

// every hour check if the cooldown of periodic cards is over
const schedulePeriodicCardCheck = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Starting periodic card cooldown check...");
      const cards = await Card.find({
        type: "periodic",
        cooldownUntil: { $lt: new Date() },
      });

      for (const card of cards) {
        card.cooldownUntil = null;
        await card.save();
      }

      console.log("Weekly card cooldown check complete");
    } catch (error) {
      console.error("Fail to check weekly card:", error);
    }
  });
};

export { scheduleDailyCardReset, schedulePeriodicCardCheck };
