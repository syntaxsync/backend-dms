const express = require("express");

const {
  getAll,
  getOne,
  create,
  deleteOne,
  updateOneById,
} = require("../controller/factoryController");
const { protect, restrictTo } = require("../middleware/protect");
const Course = require("../models/course");

const router = express.Router();

// get routes
router.get("/", getAll(Course));
router.get("/:id", getOne(Course));

router.use(protect, restrictTo("admin"));

// post routes
router.post("/", create(Course));

// delete routes
router.delete("/:id", deleteOne(Course));

// put routes
router.patch("/:id", updateOneById(Course));

module.exports = router;
