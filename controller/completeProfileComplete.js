const catchAsync = require("../util/catchAsync");
const User = require("../models/user");
const Teacher = require("../models/teacher");
const Student = require("../models/student");

exports.completeProfile = catchAsync(async (req, res) => {
  role = req.user.role;
  const { employeeId, designation, registrationNumber, batch, degree } =
    req.body;

  let newUser;

  if (role === "student") {
    newUser = await Student.create({ registrationNumber, batch, degree });
  } else if (role === "teacher") {
    newUser = await Teacher.create({ employeeId, designation });
  }

  newUser = await User.findByIdAndUpdate(
    req.user._id,
    { data: newUser._id },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});
