const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "batch name is required"],
    unique: [true, "Batch name must be unique"],
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: [true, "batch supervisor is required"],
  },
});

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
