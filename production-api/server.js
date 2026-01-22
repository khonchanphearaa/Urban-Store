import dotenv from "dotenv";
/* USE process.env */
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { startPaymentPolling } from "./src/jobs/payment.poller.js";

const PORT = process.env.PORT;
(async () => {
    await connectDB();
    startPaymentPolling();

    app.listen(PORT, () => {
        console.log(`Server running on PORT: ${PORT}`);
    });
});