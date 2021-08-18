const express = require("express");
const morgan = require("morgan");

const globalErrorHandler = require("./controller/errorController");
const userRoutes = require("./routes/userRoutes");
const AppError = require("./util/appError");

const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "DEVELOPMENT") app.use(morgan("dev"));

app.use("/api/v1/users", userRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
