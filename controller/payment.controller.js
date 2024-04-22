import "dotenv/config";
import Razorpay from "razorpay";
import crypto from "crypto";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import moment from "moment";

import User from "../model/user.model.js";
import Subscription from "../model/payment.modal.js";

export const payment = async (req, res) => {
  try {
    const id = req.user;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No post with id: ${id}`);

    // validate user and find
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "wrong credentials" });
    }

    // crate payment instance
    const instance = new Razorpay({
      key_id: process.env.RAZERPAY_KEY,
      key_secret: process.env.RAZERPAY_KEY_SECRET,
    });

    // create options for order
    const options = {
      amount: 300 * 100,
      currency: "INR",
      receipt: nanoid(),
      payment_capture: 1,
    };

    await instance.orders.create(options, async (err, order) => {
      if (order) {
        return res.status(200).json({
          order_id: order.id,
          currency: order.currency,
          amount: order.amount,
        });
      }
      console.log(err);
      return res.status(400).json(err);
    });
  } catch (error) {
    console.log("Error: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const paymentCapture = async (req, res) => {
  try {
    const data = crypto.createHmac("sha256", process.env.WEBHOOK_SECRETC);
    data.update(JSON.stringify(req.body));
    const digest = data.digest("hex");

    if (digest === req.headers["x-razorpay-signature"]) {
      const { order_id, email, amount, status } =
        req.body.payload.payment.entity;

      const user = await User.findOne({ email });
      const lastSub = await Subscription.findOne({ user: user._id }).sort({
        order_id: -1,
      });

      if (lastSub) {
        await Subscription.updateOne(
          { order_id: lastSub.order_id },
          { $set: { status: "expire" } }
        );
      }
      await Subscription.create({
        user: user._id,
        order_id,
        charging_amount: amount,
        status,
        start_at: new Date(Date.now()).toISOString(),
        end_at: moment().add(30, "days").toISOString(),
        next_at: moment().add(31, "days").toISOString(),
      });
      return res.status(200).json({ message: "user successfully parched" });
    }
    res.status(400).json({ message: "Some thing wrong" });
  } catch (error) {
    console.log("Error: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const SubscriptionUpdate = async (req, res) => {
  try {
    const id = req.user;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No post with id: ${id}`);

    // validate user and find
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "wrong credentials" });
    }
    const { order_id, plan_status } = req.body;
    console.log(order_id);

    const paymentHistory = await Subscription.findOne({ order_id });
    if (!paymentHistory) {
      return res.status(400).json({ message: "Invalid request" });
    }
    await Subscription.findOneAndUpdate(
      { order_id },
      { plan_status },
      { new: true }
    );
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log("Error: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPayment = async (req, res) => {
  try {
    const id = req.user;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No post with id: ${id}`);

    const paymentHistory = await Subscription.find({ user: id }).populate([
      { path: "user", select: "email fullName" },
    ]);
    if (!paymentHistory) {
      return res.status(400).json({ message: "Invalid request" });
    }
    res.status(200).json(paymentHistory);
  } catch (error) {
    console.log("Error: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};
