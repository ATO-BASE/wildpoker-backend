import crypto from 'crypto';
import { transporter } from '../lib/mailer';

export const sendVerificationEmail = async (email: string): Promise<string> => {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();

  const htmlContent = `
    <!DOCTYPE html>
      <html>
        <body style="font-family: Arial; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2d3748;">Welcome to Wild Poker 🎉</h2>
            <p style="font-size: 16px;">Your verification code is:</p>
            <div style="font-size: 28px; font-weight: bold; color: #3182ce;">${code}</div>
            <p style="font-size: 14px; color: #718096;">If you didn’t request this, ignore this email.</p>
          </div>
        </body>
      </html>
  `

  try {
    transporter.verify((err: Error | null, success: boolean) => {
      if (err) {
        console.log("ERROR", err)
      } else {
        console.log('*********** success : ', success);
      }
    })
  } catch (error) {
    console.log("SMTP is ready to send messages");
  }

  try {
    const result = await transporter.sendMail({
      from: 'support@wildpoker.co',
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}`,
      html: htmlContent
    });
    console.log(`result => `, result)

    return code;
  } catch (error) {
    console.error('Email send error', error);
    throw new Error('Failed email verification email');
  }
};