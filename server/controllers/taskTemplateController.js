import TaskTemplate from "../models/TaskTemplate.js";
import asyncHandler from "express-async-handler";

// @desc    Get all templates for a user
// @route   GET /api/templates
// @access  Private
export const getTemplates = asyncHandler(async (req, res) => {
  console.log("Fetching templates for user:", req.user._id);
  const templates = await TaskTemplate.find({ user: req.user._id });
  console.log("Found templates:", templates);
  res.json(templates);
});

// @desc    Create a new template
// @route   POST /api/templates
// @access  Private
export const createTemplate = asyncHandler(async (req, res) => {
  const { title, description, category, type, subTasks } = req.body;
  console.log("Creating template with data:", {
    title,
    description,
    category,
    type,
    subTasks,
  });

  const template = await TaskTemplate.create({
    user: req.user._id,
    title,
    description,
    category,
    type,
    subTasks: subTasks || [],
  });

  console.log("Created template:", template);
  res.status(201).json(template);
});

// @desc    Get a single template
// @route   GET /api/templates/:id
// @access  Private
export const getTemplateById = asyncHandler(async (req, res) => {
  console.log("Fetching template:", req.params.id);
  const template = await TaskTemplate.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!template) {
    res.status(404);
    throw new Error("Template does not exist");
  }

  console.log("Found template:", template);
  res.json(template);
});

// @desc    Update Template
// @route   PUT /api/templates/:id
// @access  Private
export const updateTemplate = asyncHandler(async (req, res) => {
  console.log("Updating template:", req.params.id);
  const template = await TaskTemplate.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!template) {
    res.status(404);
    throw new Error("Template does not exist");
  }

  const { title, description, category, type, subTasks } = req.body;
  console.log("Update data:", { title, description, category, type, subTasks });

  template.title = title || template.title;
  template.description = description || template.description;
  template.category = category || template.category;
  template.type = type || template.type;
  template.subTasks = subTasks || template.subTasks;

  const updatedTemplate = await template.save();
  console.log("Updated template:", updatedTemplate);
  res.json(updatedTemplate);
});

// @desc    Deleting a template
// @route   DELETE /api/templates/:id
// @access  Private
export const deleteTemplate = asyncHandler(async (req, res) => {
  console.log("Deleting template:", req.params.id);
  const template = await TaskTemplate.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!template) {
    res.status(404);
    throw new Error("Template does not exist");
  }

  await template.deleteOne();
  console.log("Template deleted successfully");
  res.json({ message: "Template deleted" });
});
