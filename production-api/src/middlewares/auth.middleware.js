import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      console.log("DECODED TOKEN:", decoded); 
    /* Load user form database */
    const user = await User.findById(decoded.id).select("-password");
    if(!user){
      return res.status(401).json({message: "User Not Found!"});
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};
