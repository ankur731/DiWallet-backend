const express = require("express")
const cors = require("cors")
const app = express();
const authRouter = require("./routes/auth/index");
const coinRouter = require("./routes/coin/index");
const userRouter = require("./routes/user/index");
const authMiddleware = require("./middleware/auth");
const mongoose = require('mongoose');

// MongoDB connection URI
const dotenv = require('dotenv')

// dot env config
dotenv.config()

app.use(express.json());
app.use(cors({
    origin:"*"
}))

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log("DB Error\n", err);
  });


app.get("/", function (req, res) {
    console.log("Hello");
    res.status(200).json({msg:"Hello world"})
})
app.use("/auth", authRouter)

// app.use(authMiddleware)

app.use("/coin", coinRouter)
app.use("/user", userRouter)

app.listen(8000, function (err) {
    console.log(err);
})