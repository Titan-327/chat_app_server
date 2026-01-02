import nodemailer from "nodemailer";

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: "gmail",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // 🔥 CRITICAL FIXES FOR RENDER:
      tls: {
        rejectUnauthorized: false
      },
      family: 4 // 🔥 Force IPv4 (Fixes the ETIMEDOUT error)
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: text,
    });

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email failed to send:", error);
    // Throw error so the controller knows to delete the user
    throw new Error("Email sending failed");
  }
};

export default sendEmail;