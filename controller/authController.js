const crypto = require("crypto");

const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const sendEmail = require("../util/sendEmail");

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, registrationNumber } =
      req.body;

    const user = await User.create({
      name,
      email,
      password,
      confirmPassword,
      registrationNumber,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const verificationToken = user.createVerificationToken();
    await user.save({ validateBeforeSave: false });

    sendEmail(
      [user.email],
      "Verify Your Account",
      `Please click on the link to verify account ${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verifyAccount/${verificationToken}`,
      `<html>
        <head></head>
        <body>
          Please click on the link to verify account <a href="${
            req.protocol
          }://${req.get(
        "host"
      )}/api/v1/users/verifyAccount/${verificationToken}">Click Here</a>
        </body>
      </html>`
    );

    user.password = undefined;
    user.verifyAccountToken = undefined;

    res.status(200).json({
      status: "success",
      token,
      verificationToken,
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.verifyAccountStatus = async (req, res, next) => {
  try {
    const { verifyToken } = req.params;

    const hashedToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");

    const user = await User.findOne({ verifyAccountToken: hashedToken });

    if (!user) {
      throw new Error("Invalid User or Token Expired");
    }

    user.status = "verified";
    user.verifyAccountToken = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Account verified Successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
