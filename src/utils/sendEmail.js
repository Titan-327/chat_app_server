import nodemailer from "nodemailer";

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com", // 👈 Switching to Brevo
      port: 587,                     // 👈 Standard Secure Port
      secure: false,                 // 👈 False for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Chat App" <${process.env.EMAIL_USER}>`, // 👈 professional "From" name
      to: email,
      subject: subject,
      text: text,
    });

    console.log("✅ Email sent successfully via Brevo");
  } catch (error) {
    console.error("❌ Email failed to send:", error);
    throw new Error("Email sending failed");
  }
};

export default sendEmail;