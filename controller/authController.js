const crypto = require("crypto");
const fs = require("fs");

const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const User = require("../models/userModel");
const sendEmail = require("../util/sendEmail");

const hideInformationFromResponse = (user) => {
  user.password = undefined;
  user.verifyAccountToken = undefined;
  user.passwordChangedAt = undefined;
  user.enableTwoFactorAuth = undefined;
  user.twoFactorAuthStatus = undefined;
};

const signToken = (id, user, statusCode, res) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  hideInformationFromResponse(user);

  res.status(statusCode).json({
    status: "success",
    accessToken,
    refreshToken,
    data: {
      user,
    },
  });
};

const send2FACode = async (user) => {
  const token2FA = user.create2FAAuthToken();
  user.twoFactorAuthStatus = "not-verified";
  await user.save({ validateBeforeSave: false });
  user.twoFactorAuthToken = undefined;
  user.twoFactorExpiresIn = undefined;
  sendEmail(
    [user.email],
    "Two Factor Authentication Code",
    `Your Two factor authentication code is ${token2FA}. Note this code, will expires in 5 minutes`,
    `<html>
          <head>
            <title>Two Factor Authentication Code</title>
          </head>
          <body>
            <p>Your Two factor authentication code is ${token2FA}.</p>
            <small>Note this code, will expires in 5 minutes.</small>
          </body>
        </html>`
  );
};

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

    console.log(verificationToken);

    signToken(user._id, user, 201, res);
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

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new Error("Email or Password is Invalid");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!(await user.comparePassword(password, user.password))) {
      throw new Error("Email or Password is incorrect");
    }

    if (user.enableTwoFactorAuth) {
      await send2FACode(user);
    }

    signToken(user._id, user, 200, res);
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization;
    if (!bearerToken.startsWith("Bearer")) {
      throw new Error("Token is invalid or missing");
    }

    const jwtToken = bearerToken.split(" ")[1];

    const verifiedJwt = jwt.verify(jwtToken, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const user = await User.findById(verifiedJwt.id);

    if (!user) {
      throw new Error("User Not Found", 404);
    }

    if (!user.validateJWTTime(verifiedJwt.iat)) {
      user.twoFactorAuthStatus = "not-verified";
      await user.save({ validateBeforeSave: false });
      throw new Error("Please Login Again!!!");
    }

    req.user = user;

    next();
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message:
        err.name === "TokenExpiredError"
          ? "Access Token is expired please provide Refresh Token"
          : err.message,
      stack: err.stack,
    });
  }
};

exports.checkingRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;

    const verifiedToken = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      }
    );

    const user = await User.findById(verifiedToken.id);

    if (!user) {
      throw new Error("User Not Found", 404);
    }

    signToken(user._id, user, 200, res);
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message:
        err.name === "TokenExpiredError" ? "Please Login again" : err.message,
      stack: err.stack,
    });
  }
};

exports.checkingFor2FA = (req, res, next) => {
  const user = req.user;
  if (user.enableTwoFactorAuth) {
    if (user.twoFactorAuthStatus === "not-verified") {
      const { token } = req.params;
      const user = req.user;

      verify2FAToken(token, user, res);
    }
  }
  next();
};

const verify2FAToken = async (token, user, res) => {
  try {
    if (!token) {
      throw new Error("Not authenticated, OTP is missing");
    }

    if (!(new Date(user.twoFactorExpiresIn) > new Date(Date.now()))) {
      throw new Error("Token Expired!!!!");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    if (user.twoFactorAuthToken !== hashedToken) {
      throw new Error("Invalid or Expired Tokens");
    }

    user.twoFactorAuthToken = undefined;
    user.twoFactorExpiresIn = undefined;
    user.twoFactorAuthStatus = "verified";

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Authenticated Successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.verify2FATokenCompleted = (req, res) => {
  res.status(200).status({
    status: "success",
    message: "Already authenticated with two factor",
  });
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    const user = req.user;
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "restricted access",
      });
    }
    next();
  };

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new Error("Email not provided or invalid");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("No User found with provided Email");
    }

    const resetToken = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    sendEmail(
      [user.email],
      "Reset Password Link",
      `Please Click on the link to reset your password ${
        req.protocol
      }://${req.get(
        "host"
      )}/api/v1/users/resetPassword/${resetToken}. Note Link will expire in 60 minutes.`,
      `<html>
        <head>
          <title>Reset Password</title>
        </head>
        <body>
          <p>Please Click on the link to reset your password <a href="${
            req.protocol
          }://${req.get(
        "host"
      )}/api/v1/users/resetPassword/${resetToken}">Click here</a>.</p>
          <small> Note Link will expire in 60 minutes.</small>
        </body>
      </html>`
    );

    res.status(200).json({
      status: "success",
      message: "Reset Link sent to your email address",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password, confirmPassword } = req.body;

    if (!resetToken || !password || !confirmPassword) {
      throw new Error(
        "Token is missing or invalid or required Data is missing"
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({ resetPasswordToken: hashedToken });

    if (!user || !user.validateResetTokenExpired()) {
      throw new Error("Token is expired or invalid");
    }

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.passwordChangedAt = Date.now();
    user.resetPasswordToken = undefined;
    user.resetTokenExpired = undefined;

    await user.save();

    res.status(202).json({
      status: "success",
      message: "Password Reset Successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.changeMyPassword = async (req, res, next) => {
  try {
    const { password, newPassword, confirmNewPassword } = req.body;

    if (!password || !newPassword || !confirmNewPassword) {
      throw new Error("All fields must be provided");
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!(await user.comparePassword(password, user.password))) {
      throw new Error("Password is incorrect");
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    user.confirmPassword = confirmNewPassword;

    await user.save();

    signToken(user._id, user, 202, res);
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
      stack: err.stack,
    });
  }
};

const storage = multer.memoryStorage();

const fileFilter = (req, files, cb) => {
  if (files.mimetype.startsWith("image")) {
    if (
      files.mimetype.endsWith("jpg") ||
      files.mimetype.endsWith("jpeg") ||
      files.mimetype.endsWith("png")
    ) {
      cb(null, true);
    } else {
      cb(new Error("File must be an Image with jpg, jpeg, png format"));
    }
  } else {
    cb(new Error("File must be an Image"));
  }
};

exports.uploader = multer({
  storage,
  fileFilter,
}).single("profilePicture");

exports.updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error("Please Upload Profile Picture");
    }

    if (req.file.size > 1232896) {
      throw new Error("File Size too large. Max 1mb will be accepted");
    }

    const ext = req.file.mimetype.split("/")[1];
    const user = req.user;
    const filename = `${user._id}-${Date.now()}.${ext}`;

    await fs.writeFile(
      path.resolve(`public/users/${filename}`),
      req.file.buffer,
      () => {
        console.log("File uploaded");
      }
    );

    user.profilePicture = filename;

    await user.save({ validateBeforeSave: false });

    hideInformationFromResponse(user);

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      err: err.message,
      stack: err.stack,
    });
  }
};

exports.enableTwoFactorAuthentication = async (req, res, next) => {
  try {
    const user = req.user;

    user.enableTwoFactorAuth =
      req.body.enableTwoFactorAuth || user.enableTwoFactorAuth;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
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

exports.regenerate2FACode = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.enableTwoFactorAuth) {
      throw new Error("Two Factor Authentication is not enabled", 400);
    }

    if (user.twoFactorAuthStatus !== "not-verified") {
      throw new Error("Your code is already verified", 400);
    }

    send2FACode(req.user);

    res.status(200).json({
      status: "success",
      message: "New Code Sent to mail",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
