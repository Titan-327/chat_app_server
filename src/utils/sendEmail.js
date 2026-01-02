import nodemailer from "nodemailer";

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,               // 👈 Try Port 465 (SSL)
      secure: true,            // 👈 Must be TRUE for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
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
    throw new Error("Email sending failed");
  }
};

export default sendEmail;