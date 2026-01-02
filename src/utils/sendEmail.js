import nodemailer from "nodemailer";

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,               // 👈 CHANGE THIS to 587
      secure: false,           // 👈 CHANGE THIS to false (true is only for port 465)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Helps avoid some certificate errors on cloud servers
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: text,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.log("Email not sent");
    console.error(error);
    // Don't swallow the error, throw it so the controller knows!
    throw new Error("Email could not be sent"); 
  }
};

export default sendEmail;