import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1d" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
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