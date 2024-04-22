import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";

import bookRoute from "./route/book.route.js";
import authRoute from "./route/auth.route.js";
import paymentRoute from "./route/payment.route.js";
import { authVerify } from "./middleware/Authmid.js";
import userRoute from "./route/user.route.js";
import connectDB from "./db/connectDB.js";
import inQueryRoute from "./route/inQuery.route.js";
// import reviewRoute from "./route/review.js";
const app = express();

app.use(
  cors({
    origin: process.env.BASE_URL,
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "30mb", extended: false }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: false }));
app.use("/uploads", express.static("uploads"));

dotenv.config();

const PORT = process.env.PORT || 3000;

// connect to mongoDB
connectDB();

// defining routes
app.use("/book", authVerify, bookRoute);
app.use("/auth", authRoute);
app.use("/payment", paymentRoute);
app.use("/user", authVerify, userRoute);
app.use("/in_query", inQueryRoute);
// app.use("/review", reviewRoute);

app.use(morgan("dev"));

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
