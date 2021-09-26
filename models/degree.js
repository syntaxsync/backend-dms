const mongoose = require("mongoose");

const degreeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Degree Title is required"],
  },
  code: {
    type: String,
    required: [true, "Degree Code is required"],
    unique: [true, "Degree Code must be unique"],
  },
  creditHours: {
    type: Number,
    required: [true, "Credit Hours is required"],
    validate: {
      validator: function () {
        return this.creditHours >= 0;
      },
      message: "Credit Hours must be greater than 0 or equal to 0",
    },
  },
});

const Degree = mongoose.model("Degree", degreeSchema);

module.exports = Degree;
