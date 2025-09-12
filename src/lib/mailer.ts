import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: '45.79.71.155', // 👈 Public IP of smtp.smtp2go.com
  port: 2525,
  secure: false,
  auth: {
    user: 'imonzap.com',
    pass: 'wAffFWgoVAG7DDzG',
  },
  tls: {
    servername: 'smtp.smtp2go.com', // 👈 Required for TLS to work properly
  },
});

/** Call once during app boot; rejects if creds or network are wrong */
export const verifySMTP = async () => {
  await transporter.verify();
  console.log('✅  SMTP connection ready');
};