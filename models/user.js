const crypto = require("crypto");

const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  profilePicture: {
    type: "String",
    default: "default.jpeg",
  },
  role: {
    type: String,
    enum: ["student", "admin", "teacher"],
    default: "student",
  },
  name: {
    type: String,
    minLength: [3, "Name must be greater than 3 letters"],
    maxLength: [50, "Name must be less than 50 letters"],
    required: [true, "name must be required"],
  },
  email: {
    type: String,
    required: [true, "Email must be provided"],
    unique: [true, "Email must be unique"],
    validate: [validator.isEmail, "Email is invalid"],
  },
  password: {
    type: String,
    select: false,
    minLenght: [8, "Password must be minimum 8 character Long"],
    required: true,
    validate: {
      validator: function () {
        return validator.matches(
          this.password,
          /^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/
        );
      },
      message: `
        1). At least one lower case English letter
        2). At least one digit
        3). At least one special character
        4). Minimum eight in lengthAt least one upper case English letter`,
    },
  },
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      validator: function () {
        return this.password === this.confirmPassword;
      },
      message: "Confirm Password must be same as Password",
    },
  },
  data: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "role",
  },
  status: {
    type: String,
    enum: ["not-verified", "deactivated", "verified"],
    default: "not-verified",
  },
  verifyAccountToken: {
    type: String,
  },
  enableTwoFactorAuth: {
    type: Boolean,
    default: false,
  },
  twoFactorAuthStatus: {
    type: String,
    enum: ["verified", "not-verified"],
    default: "not-verified",
  },
  twoFactorAuthToken: {
    type: String,
  },
  twoFactorExpiresIn: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  resetPasswordToken: {
    type: String,
  },
  resetTokenExpired: {
    type: Date,
  },
});

userSchema.pre(/^find/, function (next) {
  this.populate({
    path: "data",
  });
  next();
});

userSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
  }

  next();
});

userSchema.methods.createVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // encrypting verification Token
  this.verifyAccountToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  return verificationToken;
};

userSchema.methods.create2FAAuthToken = function () {
  const twoFactorToken = crypto.randomBytes(3).toString("hex").toUpperCase();

  this.twoFactorAuthToken = crypto
    .createHash("sha256")
    .update(twoFactorToken)
    .digest("hex");

  this.twoFactorExpiresIn = Date.now() + 5 * 60 * 1000;
  return twoFactorToken;
};

userSchema.methods.validateJWTTime = function (jwtCreationTime) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt / 1000, 10);
    return jwtCreationTime > changedAt;
  }
  return true;
};

userSchema.methods.comparePassword = async function (
  candidatePassword,
  hashedPassword
) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetTokenExpired = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

userSchema.methods.validateResetTokenExpired = function () {
  return new Date(this.resetTokenExpired) > new Date(Date.now());
};

const User = mongoose.model("User", userSchema);

module.exports = User;
