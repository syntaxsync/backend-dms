const express = require("express");
const factoryController = require("../controller/factoryController");
const Department = require("../models/department");
const { protect, restrictTo } = require("../middleware/protect");

const router = express.Router();

router.route("/").get(factoryController.getAll(Department));

router.route("/:id").get(factoryController.getOne(Department));

router.use(protect, restrictTo("admin"));

router.route("/").post(factoryController.create(Department));

router
  .route("/:id")
  .patch(factoryController.updateOneById(Department))
  .delete(factoryController.deleteOne(Department));

module.exports = router;
