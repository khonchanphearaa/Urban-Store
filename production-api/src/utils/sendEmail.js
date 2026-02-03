import nodemailer from "nodemailer";

/* Send email */
export const sendEmail = async (options) => {
    /* Create a transporter */
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
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
        `
    };
    await transporter.sendMail(mailOptions);
}