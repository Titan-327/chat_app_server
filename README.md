# 💬 Real-Time Chat App (Backend)

The server-side infrastructure for a full-stack WhatsApp clone. Built with **Node.js**, **Express**, and **Socket.io**, it handles real-time messaging, secure authentication, and media uploads.


## 🛠 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose ODM)
* **Real-Time:** Socket.io
* **Authentication:** JWT (JSON Web Tokens) & Bcrypt
* **Email Service:** Nodemailer + Brevo (SMTP)
* **File Storage:** Cloudinary
* **Deployment:** Render

## ✨ Features

* **🔐 Authentication:** Secure Login/Register with JWT.
* **📧 Email Verification:** OTP-based account verification using Brevo (Port 2525).
* **⚡ Real-Time Messaging:** Instant message delivery and "online" status updates via Socket.io.
* **☁️ Media Support:** Image uploads handled via Multer and Cloudinary.
* **🛡 Security:** CORS configuration, password hashing, and protected routes.
