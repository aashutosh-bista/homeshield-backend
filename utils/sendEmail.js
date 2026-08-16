/* import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (email, subject, message) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html: message,
    });

    if (response.error) {
      console.error("Resend Error:", response.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}; */import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (email, subject, message) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html: message,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email Error:", error.message);
    return false;
  }
};