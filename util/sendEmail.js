const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, html) => {
  var transport = nodemailer.createTransport({
    host: process.env.DEVELOPMENT_EMAIL_HOST,
    port: process.env.DEVELOPMENT_EMAIL_PORT,
    auth: {
      user: process.env.DEVELOPMENT_EMAIL_USER,
      pass: process.env.DEVELOPMENT_EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Department Management System" <${process.env.SENDER_EMAIL_ADDRESS}>`,
    to: to.join(","),
    subject,
    text,
    html,
  };

  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
