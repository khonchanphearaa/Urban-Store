import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

connectDB();

const app = express();

/* security headers */
app.use(helmet());

/* Rate Limit */
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
}));

/* CORS */
app.use(cors({ origin: "*", credentials: true }));

/* Body Parsers */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

/* Sanitization - MongoDB Injection Only */
app.use((req, res, next) => {
  // Only sanitize JSON body, never query or params
  if (req.is("application/json") && req.body) {
    req.body = mongoSanitize.sanitize(req.body, { replaceWith: "_" });
  }
  next();
});

/* ROUTES with API versioing (v1) */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);     // form-data (multer handles body)
app.use("/api/v1/categories", categoryRoutes);  // raw JSON
app.use("/api/v1/cart", cartRoutes);            // raw JSON
app.use("/api/v1/orders", orderRoutes);         // raw JSON
app.use("/api/v1/payments", paymentRoutes);     // raw JSON

/* Health Check */
app.get("/", (req, res) => res.json({ message: "E-Commerce API running" }));

export default app;