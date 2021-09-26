const mongoose = require("mongoose");

const CourseResultSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Joining Course ID is required"],
    unique: [true, "Course already registed"],
    ref: "Course",
  },
  grade: {
    type: String,
    enum: ["A", "B+", "B", "C+", "C", "D+", "D", "F", "Nil"],
    default: "Nil",
  },
});

CourseResultSchema.pre(/^find/, function (next) {
  this.populate({
    path: "course",
  });

  next();
});

const joiningCourse = new mongoose.Schema({
  semester: {
    type: Number,
    required: [true, "Semester is required"],
    unique: [true, "Semester already exists"],
    max: [12, "Semester cannot be more than 12"],
  },
  courses: [CourseResultSchema],
});

const JoiningSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: [true, "Student ID is required"],
  },
  courses: [joiningCourse],
});

JoiningSchema.pre(/^find/, function (next) {
  this.populate({
    path: "studentId",
  });

  next();
});

const Joining = mongoose.model("Joining", JoiningSchema);

module.exports = Joining;
