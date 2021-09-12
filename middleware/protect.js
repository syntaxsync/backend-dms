const jwt = require("jsonwebtoken");

const User = require("../models/user");
const AppError = require("../util/appError");
const catchAsync = require("../util/catchAsync");

exports.protect = catchAsync(async (req, res, next) => {
  const { authorization: bearerToken } = req.headers;
  if (!bearerToken || !bearerToken.startsWith("Bearer")) {
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

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    const user = req.user;
    if (!roles.includes(user.role)) {
      return next(new AppError("restricted access", 403));
    }
    next();
  };
