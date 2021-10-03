const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    degree: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Degree is required"],
      ref: "Degree",
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: [true, "Registration number already exists"],
      min: 6,
      max: 20,
    },
    batch: {
      type: String,
      required: [true, "Batch is required"],
    },
    currentSemester: {
      type: Number,
      required: [true, "Current semester is required"],
      max: 12,
      min: 1,
    },
    courses: [
      new mongoose.Schema({
        status: {
          type: String,
          enum: ["fail", "pass", "in progress"],
          required: true,
        },
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
      }),
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

studentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "degree",
  });

  next();
});

const Student = mongoose.model("student", studentSchema);

module.exports = Student;
