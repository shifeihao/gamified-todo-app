import express from "express";
const router = express.Router();

import { protect } from "../../middleware/auth.js";

import {
  consumeCard,
  processDrops,
  getCardInventory,
  issueDailyCards,
  issueWeeklyCards,
  issueRewardCard,
  issueBlankCard,
  getCardById,
  deleteCard,
} from "../../controllers/cardController.js";

// get all cards
router.route("/inventory").get(protect, getCardInventory);

// give daily cards
router.route("/issue-daily").post(protect, issueDailyCards);

// long-term card
router.route("/issue-weekly").post(protect, issueWeeklyCards);

// give reward card
router.route("/issue-reward").post(protect, issueRewardCard);

// consume card
router.route("/consume").post(protect, consumeCard);

// give blank card
router.route("/issue-blank").post(protect, issueBlankCard);
// process drops
router.route("/process-drops").post(protect, processDrops);
// get card by id
router.route("/:id").get(protect, getCardById).delete(protect, deleteCard);

export default router;
