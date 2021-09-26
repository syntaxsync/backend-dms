const mongoose = require("mongoose");

const SemesterOfferingSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: [true, "Semester is required"],
    unique: [true, "Semester already exists"],
    max: [12, "Semester cannot be more than 12"],
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Offering is required"],
      unique: [true, "Course already offered"],
      ref: "Course",
    },
  ],
});

SemesterOfferingSchema.pre(/^find/, function (next) {
  this.populate({
    path: "courses",
  });

  next();
});

const OfferingsSchema = new mongoose.Schema({
  semester: {
    type: String,
    required: [true, "Semster is required"],
    enum: ["fall", "spring", "summer"],
  },
  year: {
    type: Number,
    required: [true, "Year is required"],
    min: [2000, "Year must be greater than 1900"],
  },
  degree: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Degree is required"],
    ref: "Degree",
    unique: [true, "Degree Offerings already exists"],
  },
  offerings: [SemesterOfferingSchema],
});

OfferingsSchema.pre(/^find/, function (next) {
  this.populate({
    path: "degree",
    select: "code title",
  });

  next();
});

const Offerings = mongoose.model("Offerings", OfferingsSchema);

module.exports = Offerings;
