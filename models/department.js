const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Department name is required"],
  },
  degrees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Degree",
    },
  ],
  faculty: {
    type: String,
    required: [true, "Faculty name is required"],
  },
});

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;
