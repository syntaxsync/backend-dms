const dotenv = require("dotenv");
const mongoose = require("mongoose");

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

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
