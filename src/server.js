// // src/server.js

// const express = require("express");
// const { PrismaClient } = require("@prisma/client");
// const { google } = require("googleapis");
// const nodemailer = require("nodemailer");
// const bodyParser = require("body-parser");
// const dotenv = require("dotenv");
// const cors = require("cors");

// dotenv.config();

// const prisma = new PrismaClient();
// const app = express();
// const port = process.env.PORT || 3000;

// app.use(cors());
// app.use(bodyParser.json());

// app.post("/api/referrals", async (req, res) => {
//   const { referrerName, refereeName, email, program } = req.body;

//   // Validation
//   if (!referrerName || !refereeName || !email || !program) {
//     return res.status(400).send({ error: "Missing required fields" });
//   }

//   try {
//     // Save referral data
//     const referral = await prisma.referral.create({
//       data: { referrerName, refereeName, email, program },
//     });

//     // Send email notification
//     const oAuth2Client = new google.auth.OAuth2(
//       process.env.GMAIL_CLIENT_ID,
//       process.env.GMAIL_CLIENT_SECRET,
//       process.env.GMAIL_REDIRECT_URI
//     );
//     oAuth2Client.setCredentials({
//       refresh_token: process.env.GMAIL_REFRESH_TOKEN,
//     });

//     const accessToken = await oAuth2Client.getAccessToken();
//     const accessTokenObject = accessToken.token;

//     if (!accessTokenObject) {
//       throw new Error("Failed to obtain access token");
//     }

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         type: "OAuth2",
//         user: process.env.GMAIL_USER,
//         clientId: process.env.GMAIL_CLIENT_ID,
//         clientSecret: process.env.GMAIL_CLIENT_SECRET,
//         refreshToken: process.env.GMAIL_REFRESH_TOKEN,
//         accessToken: accessTokenObject,
//       },
//     });

//     const mailOptions = {
//       from: process.env.GMAIL_USER,
//       to: email,
//       subject: "You've been referred!",
//       text: `Hi ${refereeName},\n\n${referrerName} has referred you to check out our program: ${program}!\n\nBest regards,\nAccredian`,
//     };

//     const result = await transporter.sendMail(mailOptions);
//     console.log("Email sent...", result);
//     res.status(200).send(referral);
//   } catch (error) {
//     console.error("Error in /api/referrals:", error);
//     res
//       .status(500)
//       .send({ error: "Internal server error", message: error.message });
//   }
// });

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res
//     .status(500)
//     .send({ error: "Something went wrong!", message: err.message });
// });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });


// src/server.js

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
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
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

    // Send email notification
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "You've been referred!",
      text: `Hi ${refereeName},\n\n${referrerName} has referred you to check out our program: ${program}!\n\nBest regards,\nAccredian`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error in sending email:", error);
        return res.status(500).send({ error: "Error in sending email", message: error.message });
      } else {
        console.log("Email sent:", info.response);
        res.status(200).send(referral);
      }
    });
  } catch (error) {
    console.error("Error in /api/referrals:", error);
    res.status(500).send({ error: "Internal server error", message: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Something went wrong!", message: err.message });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});