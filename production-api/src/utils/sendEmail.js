import nodemailer from "nodemailer";

/* Send email */
export const sendEmail = async (options) => {
    const host = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = process.env.EMAIL_PORT
        ? parseInt(process.env.EMAIL_PORT, 10)
        : 465;
    const secure =
        typeof process.env.EMAIL_SECURE !== "undefined"
            ? process.env.EMAIL_SECURE === "true"
            : port === 465;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `UrbanStore <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: `
            <div style="font-family: sans-serif; text-align: center;">
                <h2>Password Reset</h2>
                <p>Your OTP code is:</p>
                <h1 style="color: #4A90E2;">${options.otp}</h1>
                <p>This code expires in 5 minutes.</p>
                <p>Developed @khonchanphearaa</p>
            </div>
        `,
    };

    try {
        // Verify transporter connection configuration (helps catch auth/network issues early)
        await transporter.verify();
        const info = await transporter.sendMail(mailOptions);
        console.info("Email sent:", info && info.messageId ? info.messageId : info);
        return info;
    } catch (err) {
        console.error("sendEmail error:", err && err.message ? err.message : err);
        throw err;
    }
};