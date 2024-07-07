const express = require("express");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error in SMTP configuration:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

app.post("/api/referrals", async (req, res) => {
  const { referrerName, refereeName, email, program } = req.body;

  // Validation
  if (!referrerName || !refereeName || !email || !program) {
    return res.status(400).send({ error: "Missing required fields" });
  }

  try {
    // Save referral data
    const referral = await prisma.referral.create({
      data: { referrerName, refereeName, email, program },
    });

    // Send email notification asynchronously
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "You've been referred!",
      text: `Hi ${refereeName},\n\n${referrerName} has referred you to check out our program: ${program}!\n\nBest regards,\nAccredian`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(200).send({ success: true, referral });
  } catch (error) {
    console.error("Error in /api/referrals:", error);
    res
      .status(500)
      .send({ error: "Internal server error", message: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .send({ error: "Something went wrong!", message: err.message });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
