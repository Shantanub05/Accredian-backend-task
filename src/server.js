// src/server.js

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/api/referrals", async (req, res) => {
  const { referrerName, refereeName, email, program } = req.body;

  // Validation
  if (!referrerName || !refereeName || !email || !program) {
    return res.status(400).send({ error: "Missing required fields" });
  }

  // Save referral data
  try {
    const referral = await prisma.referral.create({
      data: {
        referrerName,
        refereeName,
        email,
        program,
      },
    });

    // Send email notification
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "your-email@gmail.com",
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: "You've been referred!",
      text: `Hi ${refereeName},\n\n${referrerName} has referred you to check out our program: ${program}!\n\nBest regards,\nYour Company`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send(referral);
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
