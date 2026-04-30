import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Force load environment variables
dotenv.config({ path: '../.env' });

let transporter = null;
let isVerified = false;

const getTransporter = () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log('📧 Email Service Init - User:', emailUser);
  console.log('📧 Email Service Init - Pass exists:', !!emailPass);

  if (!emailUser || !emailPass) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not found in environment');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  return transporter;
};

// Send verification email
export const sendVerificationEmail = async (email, verificationCode) => {
  console.log('📧 Sending verification email to:', email);

  try {
    const trans = getTransporter();
    if (!trans) {
      console.error('❌ Transporter not available - check EMAIL_USER and EMAIL_PASS');
      return false;
    }

    const mailOptions = {
      from: `"SecureAuth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - SecureAuth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4F46E5;">Email Verification</h2>
          <p>Thank you for registering with SecureAuth!</p>
          <p>Your verification code is:</p>
          <div style="background: #f0f0f0; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px;">
            ${verificationCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">SecureAuth - Advanced Security Authentication</p>
        </div>
      `
    };

    const info = await trans.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    console.log('   Message ID:', info.messageId);
    return true;

  } catch (error) {
    console.error('❌ Email send error:', error.message);
    if (error.message.includes('Invalid login')) {
      console.error('   Your Gmail App Password may be incorrect. Generate a new one at:');
      console.error('   https://myaccount.google.com/apppasswords');
    }
    return false;
  }
};

// Send password reset email
export const sendResetPasswordEmail = async (email, resetCode) => {
  console.log('📧 Sending reset email to:', email);

  try {
    const trans = getTransporter();
    if (!trans) return false;

    const mailOptions = {
      from: `"SecureAuth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - SecureAuth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          <p>Your password reset code is:</p>
          <div style="background: #f0f0f0; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px;">
            ${resetCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">SecureAuth - Advanced Security Authentication</p>
        </div>
      `
    };

    const info = await trans.sendMail(mailOptions);
    console.log('✅ Reset email sent to:', email);
    return true;

  } catch (error) {
    console.error('❌ Reset email error:', error.message);
    return false;
  }
};

// Send new device login alert
export const sendNewDeviceAlert = async (email, deviceInfo, ipAddress) => {
  try {
    const trans = getTransporter();
    if (!trans) return false;

    const mailOptions = {
      from: `"SecureAuth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '⚠️ New Device Login Alert - SecureAuth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #DC2626;">New Device Detected</h2>
          <p>Your account was accessed from a new device:</p>
          <ul>
            <li><strong>Device:</strong> ${deviceInfo}</li>
            <li><strong>IP Address:</strong> ${ipAddress}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <p>If this wasn't you, please reset your password immediately.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">SecureAuth - Advanced Security Authentication</p>
        </div>
      `
    };

    await trans.sendMail(mailOptions);
    console.log('✅ New device alert sent to:', email);
    return true;

  } catch (error) {
    console.error('❌ Alert email error:', error.message);
    return false;
  }
};

// Send 2FA code email
export const sendTwoFACode = async (email, twoFACode) => {
  console.log('📧 Sending 2FA code to:', email);

  try {
    const trans = getTransporter();
    if (!trans) return false;

    const mailOptions = {
      from: `"SecureAuth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login Verification Code - SecureAuth',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4F46E5;">Login Verification Code</h2>
          <p>You are trying to log in to your SecureAuth account.</p>
          <p>Your verification code is:</p>
          <div style="background: #f0f0f0; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px;">
            ${twoFACode}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't attempt to log in, please ignore this email and change your password immediately.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">SecureAuth - Advanced Security Authentication</p>
        </div>
      `
    };

    const info = await trans.sendMail(mailOptions);
    console.log('✅ 2FA code sent to:', email);
    return true;

  } catch (error) {
    console.error('❌ 2FA email error:', error.message);
    return false;
  }
};
