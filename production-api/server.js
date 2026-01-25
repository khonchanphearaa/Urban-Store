import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { startPaymentPolling } from "./src/jobs/payment.poller.js";

const PORT = process.env.PORT || 5050;

(async () => {
  await connectDB();
  startPaymentPolling();

  app.listen(PORT, () => {
    console.log(`Server running PORT: ${PORT}`);
  });
})(); 
