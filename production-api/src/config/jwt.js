import jwt from "jsonwebtoken";

export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1d" }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

/* Token admin */
const PROCESS = process.env.JWT_ADMIN_SECRET;
const EXPRESIN = process.env.JWT_EXPRESIN;

export const generateTokenAdmin = () =>{
  if(!admin) throw new Error("Admin is requirement to generate token");
  const token = jwt.sign(
    {id: admin._id, role: admin.role},
    PROCESS, {expiresIn: EXPRESIN}
  );
  return token
}