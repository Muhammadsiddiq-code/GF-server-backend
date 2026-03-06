const express = require("express");
const Joi = require("joi");
const createError = require("http-errors");
const { listUsers } = require("../models/userModel");

const listSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow("", null).default(""),
});

const adminUsersRouter = express.Router();

adminUsersRouter.get("/", async (req, res, next) => {
  try {
    const { value, error } = listSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      throw createError(400, error.details.map((d) => d.message).join(", "));
    }

    const result = await listUsers(value);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = adminUsersRouter;

