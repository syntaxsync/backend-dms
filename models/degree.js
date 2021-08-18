const mongoose = require("mongoose");

const degreeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Degree Title is required"],
  },
  code: {
    type: String,
    required: [true, "Degree Code is required"],
  },
  creditHours: {
    type: Number,
    required: [true, "Credit Hours is required"],
    // validate:
  },
});
