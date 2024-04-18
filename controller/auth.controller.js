import User from "../model/user.model.js";
import bcryptjs from "bcryptjs";
import { SendMail } from "../service/mailler.js";
import otpGenerator from "otp-generator";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    // convert to lowercase
    const LowEmail = email.toLowerCase();
    // find  exist or not
    const user = await User.findOne({ email: LowEmail });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // picture convert into string
    const path = req.file.path.replace(/\\/g, "/");
    const avatar = `${req.protocol + "://" + req.get("host") + "/"}${path}`;

    // hashing the password
    const hashPassword = await bcryptjs.hash(password, 10);

    //generate otp
    const otp = await otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // send mail
    await SendMail({
      otp,
      userEmail: LowEmail,
      name: fullName,
      condition: "verify your email address",
      subject: "verify your account",
    });

    // save user
    const createdUser = new User({
      fullName: fullName,
      email: LowEmail,
      password: hashPassword,
      authCode: otp,
      avatar,
    });
    await createdUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: createdUser._id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        avatar,
      },
    });
  } catch (error) {
    console.log("Error: " + error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // convert to lowercase
    const LowEmail = email.toLowerCase();

    // find user exist or not
    const user = await User.findOne({ email: LowEmail });
    if (!user) {
      return res.status(404).json({ message: "Invalid username" });
    }

    // verify user password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ message: "Invalid password" });
    } else if (user.isVerified === true) {
      const token = jwt.sign(
        { id: user._id, fullName: user.fullName },
        process.env.JWT_SECRET
      );
      return res.status(200).json({ id: user.id, token });
    }
    res.status(400).json({
      message: "user not verified",
    });
  } catch (error) {
    console.log("Error: " + error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/*  Verify otp function start */
export const verifyOtp = async (req, res) => {
  try {
    const { id } = req.query;
    const { code } = req.body;
    // find user and valid

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No post with id: ${id}`);

    const user = await User.findOne({ _id: id });
    if (!user) {
      res.status(400).json("user not found");
      return;
    }
    if (user.authCode == code) {
      await User.findOneAndUpdate(
        { _id: id },
        { isVerified: true, authCode: "" },
        { new: true }
      );
      return res.status(200).json({ message: "user verified" });
    }
    res.status(400).json({ message: "user not verified" });
  } catch (error) {
    console.log("Error: " + error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
/*  Verify otp function end */

/* forgot Password Request function start here */
export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    // convert to lowercase
    const LowEmail = email.toLowerCase();

    // find user and valid
    const user = await User.findOne({ email: LowEmail });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    //generate otp
    const otp = await otpGenerator.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // send mail
    await SendMail({
      otp,
      userEmail: LowEmail,
      name: user.fullName,
      subject: "Reset password",
      condition: "change your password",
    });

    // update user
    await User.findOneAndUpdate(
      { email: LowEmail },
      { authCode: otp },
      { new: true }
    );
    res.status(200).json({ message: "please check your mail" });
  } catch (error) {
    console.log("Error: " + error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
/* forgot Password Request function end here */

/* reset password*/
export const forgotPassword = async (req, res) => {
  try {
    const { authCode, password } = req.body;

    // find user and valid
    const user = await User.findOne({ authCode });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // hashing password
    const hashPassword = await bcryptjs.hash(password, 10);

    // update password
    await User.findOneAndUpdate(
      { authCode },
      { authCode: null, password: hashPassword },
      { new: true }
    );
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("Error: " + error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};