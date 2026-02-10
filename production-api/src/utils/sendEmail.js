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

    const connectionTimeout = process.env.EMAIL_CONN_TIMEOUT
        ? parseInt(process.env.EMAIL_CONN_TIMEOUT, 10)
        : 10000;
    const greetingTimeout = process.env.EMAIL_GREETING_TIMEOUT
        ? parseInt(process.env.EMAIL_GREETING_TIMEOUT, 10)
        : 10000;
    const tlsReject = typeof process.env.EMAIL_TLS_REJECT !== "undefined"
        ? process.env.EMAIL_TLS_REJECT === "true"
        : true;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout,
        greetingTimeout,
        tls: { rejectUnauthorized: tlsReject },
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

// Note: In production ensure EMAIL_USER and EMAIL_PASS are correct
// Optionally set these env vars to tune timeouts and TLS behavior:
// EMAIL_CONN_TIMEOUT (ms), EMAIL_GREETING_TIMEOUT (ms), EMAIL_TLS_REJECT=false