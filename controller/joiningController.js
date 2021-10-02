const catchAsync = require("../util/catchAsync");
const Joining = require("../models/joining");
const AppError = require("../util/appError");

exports.getAllJoinings = catchAsync(async (req, res, next) => {
  const { _id: degree } = req.degree;

  const joinings = await Joining.find({ degree });

  res.status(200).json({
    status: "success",
    results: joinings.length,
    data: { joinings },
  });
});

exports.getJoining = catchAsync(async (req, res, next) => {
  const { _id: degree } = req.degree;
  const { joiningId } = req.params;

  if (!joiningId) {
    return next(new AppError("No joining ID", 404));
  }

  const joining = await Joining.findOne({
    degree,
    _id: joiningId,
  });

  if (!joining) {
    return next(new AppError("No joining found with that id", 404));
  }

  res.status(200).json({
    status: "success",
    data: { joining },
  });
});

exports.deleteJoining = catchAsync(async (req, res, next) => {
  const { _id: degree } = req.degree;
  const { joiningId } = req.params;

  if (!joiningId) {
    return next(new AppError("No joining ID", 404));
  }

  const joining = await Joining.findOneAndDelete(
    {
      degree,
      _id: joiningId,
    },
    { returnOriginal: true }
  );

  if (!joining) {
    return next(new AppError("No joining found with that id", 404));
  }

  res.status(204).json({
    status: "success",
    data: joining,
  });
});

exports.createJoining = catchAsync(async (req, res, next) => {
  const { _id: degree } = req.degree;
  const { _id: student } = req.user;

  const { courses } = req.body;
  if (!courses) {
    return next(new AppError("No courses Provided", 404));
  }

  const joining = await Joining.create({
    degree,
    student,
    courses,
  });

  res.status(201).json({
    status: "success",
    data: { joining },
  });
});
