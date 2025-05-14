import express from "express";
import { enterDungeon } from "../../controllers/dungeonController.js";
import {
  exploreCurrentFloor,
  updateAfterCombat,
  updateCombatResult,
  monsterCombat,
  summarizeExploration,
  interactWithShopEvent,
  continueExploration,
} from "../../controllers/dungeonController.js";

import { protect } from "../../middleware/auth.js";

const router = express.Router();

// Enter the dungeon
router.post("/enter", protect, enterDungeon);
router.post("/explore", protect, exploreCurrentFloor);
router.post("/fight", protect, monsterCombat);
router.post("/summarize", protect, summarizeExploration);
router.post("/shop-interaction", protect, interactWithShopEvent);
router.post("/continue", protect, continueExploration);
router.post("/combat-result", protect, updateCombatResult);
router.post("/update-after-combat", protect, updateAfterCombat);
export default router;
