import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";
import { generateTokenAdmin } from "./src/config/jwt.js";

dotenv.config();
connectDB();

const createAdmin = async () => {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error("Admin credentials not set in environment variables");
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    /*  Check if admin already exists */
    const admin = await User.findOne({ email });
    if (admin) {
      console.log("Admin already exists");

      const isToken  = generateTokenAdmin(admin);
      console.log("Admin JWt token:", isToken);
      
      return process.exit();
    }

    /*  Hash password */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* Create admin user */
    await User.create({
      name: "Admin",
      email,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("Admin created successfully!");

    /* Genearte new token for admin */
    const token = generateTokenAdmin(admin);
    console.log("Admin JWT token: ", token);
    
    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
