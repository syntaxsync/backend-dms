const express = require("express");

const authController = require("../controller/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);

router.patch("/resetPassword/:resetToken", authController.resetPassword);

router.get("/verifyAccount/:verifyToken", authController.verifyAccountStatus);

router.use(authController.protect, authController.checkingFor2FA);

router.get("/oneTimeToken/:token", authController.verify2FATokenCompleted);

router.route("/").get(authController.restrictTo("teacher"), (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Users of the system",
  });
});

router.post("/upadtePassword", authController.changeMyPassword);

router.patch(
  "/updateProfilePicture",
  authController.uploader,
  authController.updateProfilePicture
);

module.exports = router;
