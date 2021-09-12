const express = require("express");

const authController = require("../controller/authController");
const { protect } = require("../middleware/protect");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);

router.patch("/resetPassword/:resetToken", authController.resetPassword);

router.get("/verifyAccount/:verifyToken", authController.verifyAccountStatus);

router.patch("/verifyRefreshToken", authController.checkingRefreshToken);

router.use(protect);

router.get("/generateNewCode", authController.regenerate2FACode);

router.get(
  "/oneTimeToken/:token",
  authController.checkingFor2FA,
  authController.verify2FATokenCompleted
);

router.use(authController.checkingFor2FA);

router.post("/upadtePassword", authController.changeMyPassword);

router.patch(
  "/enableTwoFactorAuthentication",
  authController.enableTwoFactorAuthentication
);

router.patch(
  "/updateProfilePicture",
  authController.uploader,
  authController.updateProfilePicture
);

module.exports = router;
