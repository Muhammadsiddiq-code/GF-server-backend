import express from "express";
import createError from "http-errors";
import { findAllUsers } from "../models/userModel.js";

const router = express.Router();

// GET /api/admin/users?search=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || "";

    const result = await findAllUsers({ search, limit, offset });
    const totalPages = Math.max(1, Math.ceil(result.total / limit));

    res.json({
      data: result.data,
      page,
      total: result.total,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (err) {
    next(err);
  }
});

export default router;