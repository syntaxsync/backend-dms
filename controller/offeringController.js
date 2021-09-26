const Offerings = require("../models/offerings");
const Degree = require("../models/degree");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/appError");

exports.getDegreeData = catchAsync(async (req, res, next) => {
  const { degreeId } = req.params;

  if (!degreeId) {
    return next(new AppError("No degree id provided", 400));
  }

  const degree = await Degree.findById(degreeId);
  req.degree = degree;
  next();
});

exports.getOfferingById = catchAsync(async (req, res, next) => {
  const { _id: degree } = req.degree;
  const { offeringId } = req.params;

  const offering = await Offerings.findOne({
    degree,
    _id: offeringId,
  });

  res.status(200).json({
    status: "success",
    data: { offering },
  });
});

exports.getAllOfferings = catchAsync(async (req, res, next) => {
  const { _id: degree } = req.degree;

  const offerings = await Offerings.find({ degree });

  res.status(200).json({
    status: "success",
    data: {
      offerings,
    },
  });
});

exports.createNewOfferings = catchAsync(async (req, res, next) => {
  const { _id: degree } = req.degree;
  const { offerings, year, semester } = req.body;

  if (!offerings) {
    return next(new AppError("No offerings provided", 400));
  }

  const newOffering = await Offerings.create({
    offerings,
    degree,
    year,
    semester,
  });

  res.status(201).json({
    status: "success",
    data: {
      offerings: newOffering,
    },
  });
});

exports.deleteOfferingById = catchAsync(async (req, res, next) => {
  const { offeringId } = req.params;
  const { _id: degree } = req.degree;

  if (!offeringId) {
    return next(new AppError("No offering id provided", 400));
  }

  const offering = await Offerings.findOneAndDelete(
    {
      degree,
      _id: offeringId,
    },
    { returnOriginal: true }
  );

  if (!offering) {
    return next(new AppError("Offering not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: offering,
  });
});

exports.updateOfferingById = catchAsync(async (req, res, next) => {
  const { offeringId } = req.params;
  const { _id: degree } = req.degree;

  if (!offeringId) {
    return next(new AppError("No offering id provided", 400));
  }

  const offering = await Offerings.findOneAndUpdate(
    { degree, _id: offeringId },
    { ...req.body, degree },
    {
      new: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: offering,
  });
});
