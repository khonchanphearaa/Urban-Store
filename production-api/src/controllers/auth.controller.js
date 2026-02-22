import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../config/jwt.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateOTP } from "../utils/generateOTP.js";
import { v2 as cloudinary } from "cloudinary";

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
    /* Password back hidden field sign (+password) for use when field in User is select: false for implementation */
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user || !user.password)
      return res.status(400).json({ message: "Invalid Password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid Password is not matched" });

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
    console.error('SEND OTP ERROR:', error && error.message ? error.message : error);
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

//#region Get Me
export const getMe = async (req, res) =>{
  try {
    if(!req.user){
      return res.status(401).json({message: 'Not authorized'});
    }
    const user = req.user.toObject();
    delete user.refreshToken;
    delete user.otp;
    delete user.otpExpires;
    delete user.__v;
    res.status(200).json({ 
      sucess: true,
      user: user
    })
  } catch (error) {
    res.status(500).json({ message: "Server error fetching profile" });
  }
}
//#endregion

//#region  Update Profile
export const updateProfile = async (req, res)=>{
  try {
    
    /* Check user if authenticated */
    if(!req.user){
      return res.status(401).json({message: 'Not authorized'});
    }
    const {name, email, currentPassword, newPassword} = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if(!user){
      return res.status(404).json({message: 'User not found'});
    }
    
    /* Update text field */
    if(name) user.name = name;
    if(email && email.toLowerCase() !== user.email){
      const emailExists = await User.findOne({email: email.toLowerCase()});
      if(emailExists){
        return res.status(400).json({message: 'Email already in used'});
      }
      user.email = email.toLowerCase();
    }

    /* Update password */
    if(newPassword){
      if(!currentPassword){
        return res.status(400).json({message: 'Current password is required to set new password'});
      }

      /* verify current pwd */
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if(!isMatch){
        return res.status(400).json({message: 'Current password does not match'});
      }

      /* hash and save new password */
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    /* Update avatar */
    if(req.file){
      if(user.avatar?.public_id){
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }
      user.avatar = {
        url: req.file.path,
        public_id: req.file.filename
      };
    }
    await user.save();

    /* When susccess response */
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar?.url,
        role: user.role
      }
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Server error during update" });
  }
    
}
//#endregion

