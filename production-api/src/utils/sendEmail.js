export const sendEmail = async (options) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { 
            name: "Urban Store", 
            email: process.env.BREVO_SENDER_EMAIL 
        },
        to: [{ email: options.email }],
        subject: options.subject,
        htmlContent: `
          <div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #eee;">
            <h2>Password Reset</h2>
            <p>Your OTP code is:</p>
            <h1 style="color: #4A90E2; letter-spacing: 5px;">${options.otp}</h1>
            <p>This code expires in 5 minutes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8rem; color: #888;">Developed @khonchanphearaa</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error:", errorData);
      throw new Error("Email delivery failed");
    }

    console.log("OTP sent successfully via Brevo!");
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error.message);
    throw error;
  }
};

// Note: In production ensure BREVO_API_KEY and BREVO_SENDER_EMAIL are correct
// Optionally set these env vars to tune timeouts and TLS behavior:
// EMAIL_CONN_TIMEOUT (ms), EMAIL_GREETING_TIMEOUT (ms), EMAIL_TLS_REJECT=false