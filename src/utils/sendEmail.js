import nodemailer from "nodemailer";

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Chat App" <${process.env.EMAIL_USER}>`, 
      to: email,
      subject: subject,
      text: text,
    });

    console.log("✅ Email sent successfully to:", email);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    // 🔥 CRITICAL CHANGE: Throw error so the controller knows it failed!
    throw new Error("Email could not be sent"); 
  }
};

export default sendEmail;