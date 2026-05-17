const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    // user: process.env.GMAIL_USER,
    // pass: process.env.GMAIL_APP_PASSWORD,
    user: "duckhanhthientran@gmail.com",
    pass: "uimjalbzmwrrbcyq",
  },
});

module.exports = transporter;
