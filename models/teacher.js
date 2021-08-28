const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is Required"],
  },
  employeeId: {
    type: String,
    required: [true, "Employee ID is required"],
    unique: [true, "Employee ID already exists"],
  },
  designation: {
    type: String,
    enum: ["Lecturer", "Assistant Professor", "Professor", "HOD"],
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      unique: [true, "Course already exists"],
    },
  ],
});

const Teacher = mongoose.model("teacher", teacherSchema);

module.exports = teacherSchema;
