const express = require("express");
const factoryController = require("../controller/factoryController");
const Offerings = require("../models/offerings");
const offeringController = require("../controller/offeringController");

const router = express.Router({ mergeParams: true });

router.use(offeringController.getDegreeData);

router.route("/").get(offeringController.getAllOfferings);

router.route("/:offeringId").get(offeringController.getOfferingById);

router.route("/").post(offeringController.createNewOfferings);

router
  .route("/:offeringId")
  .patch(offeringController.updateOfferingById)
  .delete(offeringController.deleteOfferingById);

module.exports = router;
