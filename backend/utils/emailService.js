const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Send verification email
const sendVerificationEmail = async (email, verificationCode) => {
  console.log('📧 Sending verification email to:', email);

  try {
    const { data, error } = await resend.emails.send({
      from: 'SecureAuth <onboarding@resend.dev>',  // Resend's free default sender
      to: [email],
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
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log('✅ Verification email sent! ID:', data?.id);
    return true;

  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};

// Send password reset email
const sendResetPasswordEmail = async (email, resetCode) => {
  console.log('📧 Sending reset email to:', email);

  try {
    const { data, error } = await resend.emails.send({
      from: 'SecureAuth <onboarding@resend.dev>',
      to: [email],
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
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log('✅ Reset email sent! ID:', data?.id);
    return true;

  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};

// Send new device login alert
const sendNewDeviceAlert = async (email, deviceInfo, ipAddress) => {
  console.log('📧 Sending device alert to:', email);

  try {
    const { data, error } = await resend.emails.send({
      from: 'SecureAuth <onboarding@resend.dev>',
      to: [email],
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
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log('✅ Alert email sent! ID:', data?.id);
    return true;

  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendNewDeviceAlert
};
