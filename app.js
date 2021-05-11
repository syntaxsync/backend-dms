const express = require("express");
const morgan = require("morgan");

const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "DEVELOPMENT") app.use(morgan("dev"));

const userRoutes = require("./routes/userRoutes");

app.use("/api/v1/users", userRoutes);

module.exports = app;
