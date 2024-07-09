const { google } = require("googleapis");
require("dotenv").config();

function authorize() {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, GMAIL_REFRESH_TOKEN } =
    process.env;
  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN,
  });

  return oAuth2Client;
}

module.exports = { authorize };
