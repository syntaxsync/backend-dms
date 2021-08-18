const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const app = require("./app");

const PORT = process.env.PORT || 5000;
const DB = process.env.DATABASE.replace(
  "<username>",
  process.env.DATABASE_USERNAME
).replace("<password>", process.env.DATABASE_PASSWORD);

mongoose.connect(
  DB,
  {
    useUnifiedTopology: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useCreateIndex: true,
  },
  () => {
    console.log("Database Connected");
  }
);

const server = app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
