const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const globalErrorHandler = require("./controller/errorController");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const degreeRoute = require("./routes/degreeRoute");
const AppError = require("./util/appError");
const mediaController = require("./controller/mediaController");

const app = express();

app.use(express.json());

app.use(cors());

if (process.env.NODE_ENV === "DEVELOPMENT") app.use(morgan("dev"));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/degrees", degreeRoute);
app.get("/api/v1/files/:folder/:file", mediaController.getFileFromBucket);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
