const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
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

const Student = mongoose.model("student", studentSchema);

module.exports = Student;
