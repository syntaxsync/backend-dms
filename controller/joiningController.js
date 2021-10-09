const multer = require("multer");

const catchAsync = require("../util/catchAsync");
const Joining = require("../models/joining");
const Offerings = require("../models/offerings");
const AppError = require("../util/appError");
const { uploadFileToBucket } = require("../util/uploadFile");

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
}).single("challanPhoto");

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

  const { courses, semester, batch } = req.body;

  if (!courses || !semester || !batch) {
    return next(new AppError("No courses Provided", 404));
  }

  if (!req.file) {
    return next(new AppError("No Challan Image uploaded", 400));
  }

  const ext = req.file.mimetype.split("/")[1];

  const filename = `${student}-${degree}-${semester}-${Date.now()}.${ext}`;

  const offerings = await Offerings.findOne({
    degree,
    courses,
    semester,
    batch,
  });

  if (!offerings) {
    return next(new AppError("No offerings found", 404));
  }

  const url = await uploadFileToBucket(req.file.buffer, `challans/${filename}`);

  const joining = await Joining.create({
    degree,
    student,
    courses,
    semester,
    batch,
    challanPhoto: url,
  });

  res.status(201).json({
    status: "success",
    data: { joining },
  });
});

exports.changeStatusOfJoining = catchAsync(async (req, res, next) => {
  const { _id: degree } = req.degree;
  const { joiningId, status } = req.params;

  if (!joiningId) {
    return next(new AppError("No joining ID", 404));
  }

  if (!status || (status !== "Approved" && status !== "Rejected")) {
    return next(new AppError("Invalid status", 400));
  }

  const joining = await Joining.findOneAndUpdate(
    {
      degree,
      _id: joiningId,
    },
    {
      $set: {
        status,
      },
    },
    { new: true }
  );

  if (!joining) {
    return next(new AppError("No joining found with that id", 404));
  }

  res.status(200).json({
    status: "success",
    data: { joining },
  });
});
