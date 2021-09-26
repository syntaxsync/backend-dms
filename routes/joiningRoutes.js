const express = require("express");
const Joining = require("../models/joining");
const joiningController = require("../controller/joiningController");
const offeringController = require("../controller/offeringController");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(offeringController.getDegreeData, joiningController.getAllJoinings);

router.route("/:joiningId").get(joiningController.getJoining);

router.route("/:joiningId").delete(joiningController.deleteJoining);

module.exports = router;
