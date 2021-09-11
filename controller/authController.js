const crypto = require("crypto");
const fs = require("fs");

const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const User = require("../models/user");
const sendEmail = require("../util/sendEmail");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");

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

const send2FACode = catchAsync(async (user) => {
  const token2FA = user.create2FAAuthToken();
  user.twoFactorAuthStatus = "not-verified";
  await User.findByIdAndUpdate(
    user._id,
    {
      twoFactorAuthStatus: user.twoFactorAuthStatus,
      twoFactorExpiresIn: user.twoFactorExpiresIn,
      twoFactorAuthToken: user.twoFactorAuthToken,
    },
    { new: true }
  );
  // await user.save({ validateBeforeSave: false });
  user.twoFactorAuthToken = undefined;
  user.twoFactorExpiresIn = undefined;
  await sendEmail(
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
});

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, confirmPassword, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    confirmPassword,
    role,
  });

  const verificationToken = user.createVerificationToken();
  await user.save({ validateBeforeSave: false });

  await sendEmail(
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

  signToken(user._id, user, 201, res);
});

exports.verifyAccountStatus = catchAsync(async (req, res, next) => {
  const { verifyToken } = req.params;

  const hashedToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  const user = await User.findOne({ verifyAccountToken: hashedToken });

  if (!user) {
    return next(new AppError("Invalid User or Token Expired", 403));
  }

  user.status = "verified";
  user.verifyAccountToken = undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Account verified Successfully",
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email or Password is Invalid", 403));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("User Does not Exists", 404));
  }

  if (!(await user.comparePassword(password, user.password))) {
    return next(new AppError("Email or Password is incorrect", 403));
  }

  if (user.enableTwoFactorAuth) {
    await send2FACode(user);
  }

  signToken(user._id, user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  const bearerToken = req.headers.authorization;
  if (!bearerToken.startsWith("Bearer")) {
    return next(new AppError("Token is invalid or missing", 403));
  }

  const jwtToken = bearerToken.split(" ")[1];

  const verifiedJwt = jwt.verify(jwtToken, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const user = await User.findById(verifiedJwt.id);

  if (!user) {
    return next(new AppError("User Not Found", 404));
  }

  if (!user.validateJWTTime(verifiedJwt.iat)) {
    user.twoFactorAuthStatus = "not-verified";
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Please Login Again!!!", 403));
  }

  req.user = user;

  next();
});

exports.checkingRefreshToken = catchAsync(async (req, res, next) => {
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
    return next(new AppError("User Not Found", 404));
  }

  signToken(user._id, user, 200, res);
});

exports.checkingFor2FA = catchAsync(async (req, res, next) => {
  const user = req.user;
  if (user.enableTwoFactorAuth) {
    if (user.twoFactorAuthStatus === "not-verified") {
      const { token } = req.params;
      const user = req.user;

      await verify2FAToken(token, user, res, next);
    }
  }
  next();
});

const verify2FAToken = catchAsync(async (token, user, res, next) => {
  if (!token) {
    return next(new AppError("Not authenticated, OTP is missing", 403));
  }

  if (!(new Date(user.twoFactorExpiresIn) > new Date(Date.now()))) {
    return next(new AppError("Token Expired!!!!", 403));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  if (user.twoFactorAuthToken !== hashedToken) {
    return next(new AppError("Invalid or Expired Tokens", 403));
  }

  user.twoFactorAuthToken = undefined;
  user.twoFactorExpiresIn = undefined;
  user.twoFactorAuthStatus = "verified";

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Authenticated Successfully",
  });
});

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
      return next(new AppError("restricted access", 403));
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email not provided or invalid", 403));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("No User found with provided Email", 404));
  }

  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  await sendEmail(
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
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken } = req.params;
  const { password, confirmPassword } = req.body;

  if (!resetToken || !password || !confirmPassword) {
    return next(
      new AppError(
        "Token is missing or invalid or required Data is missing",
        403
      )
    );
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({ resetPasswordToken: hashedToken });

  if (!user || !user.validateResetTokenExpired()) {
    return next(new AppError("Token is expired or invalid", 403));
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
});

exports.changeMyPassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, confirmNewPassword } = req.body;

  if (!password || !newPassword || !confirmNewPassword) {
    return next(new AppError("All fields must be provided", 401));
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.comparePassword(password, user.password))) {
    return next(new AppError("Password is incorrect", 403));
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  user.confirmPassword = confirmNewPassword;

  await user.save();

  signToken(user._id, user, 202, res);
});

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

exports.updateProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please Upload Profile Picture", 401));
  }

  if (req.file.size > 1232896) {
    return next(
      new AppError("File Size too large. Max 1mb will be accepted", 401)
    );
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
});

exports.enableTwoFactorAuthentication = catchAsync(async (req, res, next) => {
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
});

exports.regenerate2FACode = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (!user.enableTwoFactorAuth) {
    return next(new AppError("Two Factor Authentication is not enabled", 400));
  }

  if (user.twoFactorAuthStatus !== "not-verified") {
    return next(new AppError("Your code is already verified", 400));
  }

  send2FACode(req.user);

  res.status(200).json({
    status: "success",
    message: "New Code Sent to mail",
  });
});
