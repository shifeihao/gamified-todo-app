import express from "express";
const router = express.Router();

import {
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "../../controllers/taskTemplateController.js";

import { protect } from "../../middleware/auth.js";
import TaskTemplate from "../../models/TaskTemplate.js";

// Test Routing - Get All Templates (No Authentication Required)
router.get("/test", async (req, res) => {
  try {
    const templates = await TaskTemplate.find({});
    console.log("Test route - Found templates:", templates);
    res.json(templates);
  } catch (error) {
    console.error("Test route - Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// All template routes require authentication
router.use(protect);

// Get all templates and create templates
router.route("/").get(getTemplates).post(createTemplate);

//Get, update, and delete a single template
router
  .route("/:id")
  .get(getTemplateById)
  .put(updateTemplate)
  .delete(deleteTemplate);

export default router;
