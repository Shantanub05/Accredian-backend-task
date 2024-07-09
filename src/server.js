const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const { google } = require("googleapis");
const { authorize } = require("./google-auth");

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

function sendMail(auth, email, subject, message) {
  const gmail = google.gmail({ version: "v1", auth });
  const encodedMessage = Buffer.from(
    `To: ${email}\r\n` + `Subject: ${subject}\r\n\r\n` + `${message}`
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  gmail.users.messages.send(
    {
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    },
    (err, res) => {
      if (err) return console.error("Error sending email", err);
      console.log("Email sent:", res.data);
    }
  );
}

app.post("/api/referrals", async (req, res) => {
  const { referrerName, refereeName, email, program } = req.body;

  if (!referrerName || !refereeName || !email || !program) {
    return res.status(400).send({ error: "Missing required fields" });
  }

  try {
    const referral = await prisma.referral.create({
      data: { referrerName, refereeName, email, program },
    });

    const auth = authorize();
    sendMail(
      auth,
      email,
      "You've been referred!",
      `Hi ${refereeName},\n\n${referrerName} has referred you to check out our program: ${program}!\n\nBest regards,\nAccredian`
    );

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
