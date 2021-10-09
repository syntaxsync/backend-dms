const mongoose = require("mongoose");

const JoiningSchema = new mongoose.Schema({
  challanPhoto: {
    type: String,
    required: [true, "Challan photo is required"],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: [true, "Student ID is required"],
    unique: [true, "Student already registed"],
  },
  semester: {
    type: String,
    required: [true, "Semster is required"],
  },
  degree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Degree",
    required: [true, "Degree ID is required"],
  },
  batch: {
    type: String,
    required: [true, "batch is required"],
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Offering is required"],
      unique: [true, "Course already offered"],
      ref: "Course",
    },
  ],
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
});

JoiningSchema.pre(/^find/, function (next) {
  this.populate({
    path: "student",
  })
    .populate({
      path: "degree",
    })
    .populate({
      path: "courses",
    });

  next();
});

const Joining = mongoose.model("Joining", JoiningSchema);

module.exports = Joining;
