import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../config/jwt.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateOTP } from "../utils/generateOTP.js";

/* Register (USER Only) */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      /* Role defaults to USER */
    });

    res.status(201).json({
      message: "Register success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user || !user.password)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    /* Access token & Generate token */
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login success",
      // token: generateToken(user._id),
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.sendStatus(403);
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    res.json({ accessToken: newAccessToken });
  } catch {
    res.sendStatus(403);
  }
}

// Logout
export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }

  res.clearCookie("refreshToken");
  res.json({ message: "Logout success (client removes token)" });
};

//#region Forgot password 
export const sendOTPtoEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Email not found!' });
    }

    const otp = await generateOTP();
    
    /* Save OTP and Expire time to user document */
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    await sendEmail(
      {
        email: user.email,
        subject: "Your OTP Code",
        otp
      });
    res.status(200).json({ message: 'OTP sent to your email, Please check inbox' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP.' });
  }
}
//#endregion

//#region Vertify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne(
      {
        email: email.toLowerCase(),
        otp: otp,
        otpExpires: { $gt: Date.now() }
      }
    );
    if (!user) { return res.status(400).json({ message: 'Invalid or expired OTP!' }); }
    res.status(200).json({ message: 'OTP verified success.' });
  } catch (error) {
    res.status(500).json({ message: 'Error vertifying OTP' });
  }
}
//#endregion

//#region  Reset Password
export const resetpwd = async (req, res) =>{
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    if(newPassword !== confirmPassword){return res.status(400).json({message: 'Password do not match!'});}
    /* Verity OTP and Expire */
    const user = await User.findOne(
      {
        email: email.toLowerCase(),
        otp: otp,
        otpExpires: { $gt: Date.now() }
      }
    )
    if(!user){return res.status(400).json({message: 'Invalid OTP or session expired'});}
    
    /* Hash new password */
    const hashedPwd = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, hashedPwd);

    /* This call One-Time, The password is change that OTP must become unless.
       If you don't clear OTP, it can be reused the same 4-digit code again 
       within that 5 minutes window changes the password second times. */
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.status(200).json({sucess: true, message: 'Password reset success'});
  } catch (error) {
    res.status(500).json({message: 'Error setting new password' });
  }
}
//#endregion
