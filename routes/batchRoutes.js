const express = require("express");
const factoryController = require("../controller/factoryController");
const Batch = require("../models/batch");
const { protect, restrictTo } = require("../middleware/protect");

const router = express.Router();

router.route("/").get(factoryController.getAll(Batch));

router.route("/:id").get(factoryController.getOne(Batch));

router.use(protect, restrictTo("admin"));

router.route("/").post(factoryController.create(Batch));

router
  .route("/:id")
  .patch(factoryController.updateOneById(Batch))
  .delete(factoryController.deleteOne(Batch));

export default router;
