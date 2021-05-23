const express = require("express");

const authController = require("../controller/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);

router.patch("/resetPassword/:resetToken", authController.resetPassword);

router.get("/verifyAccount/:verifyToken", authController.verifyAccountStatus);

router.get(
  "/oneTimeToken/:token",
  authController.protect,
  authController.checkingFor2FA,
  authController.verify2FATokenCompleted
);

router
  .route("/")
  .get(
    authController.protect,
    authController.checkingFor2FA,
    authController.restrictTo("teacher"),
    (req, res) => {
      res.status(200).json({
        status: "success",
        message: "Users of the system",
      });
    }
  )
  .post((req, res) => {
    res.status(201).json({
      status: "success",
      message: "New user created",
    });
  });

module.exports = router;
