const express = require("express");
const { protect } = require("../middleware/protect");
const joiningController = require("../controller/joiningController");
const offeringController = require("../controller/offeringController");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(offeringController.getDegreeData, joiningController.getAllJoinings);

router.route("/:joiningId").get(joiningController.getJoining);

router.use(protect);

router
  .route("/")
  .post(offeringController.getDegreeData, joiningController.createJoining);

router.route("/:joiningId").delete(joiningController.deleteJoining);

module.exports = router;
