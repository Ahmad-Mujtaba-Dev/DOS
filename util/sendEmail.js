const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: parseInt(process.env.MAIL_PORT), 
  secure: process.env.MAIL_PORT === "465", 
  auth: {
    user: process.env.MAIL_USERNAME, 
    pass: process.env.MAIL_PASSWORD, 
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

module.exports.sendEmail = async ({ email,subject, text, html }) => {
  console.log("email 22",email)
  try {
    const info = await transporter.sendMail(
      {
        from: `"Dos" ${process.env.MAIL_FROM_ADDRESS}`,
        to: email,
        subject: subject,
        text: text,
        html: html,
      },
      function error(err, info) {
        if (err) {
          console.log("Error in sending Email", err);
          return false;
        }
      }
    );
    return true;
  } catch (error) {
    console.log("Error in send email", error);
    return false;
  }
};
