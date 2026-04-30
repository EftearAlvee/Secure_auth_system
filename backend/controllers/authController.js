import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendResetPasswordEmail, sendNewDeviceAlert, sendTwoFACode } from '../utils/emailService.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register
export const register = async (req, res) => {
  console.log('📝 Registration request:', req.body);

  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must contain uppercase, lowercase, number and special character' });
    }

    const cleanUsername = username.toLowerCase().replace(/\s/g, '');
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: password,
      verificationCode: verificationCode,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
      isVerified: false,
      twoFAEnabled: false,
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date()
    });

    await user.save();

    await sendVerificationEmail(cleanEmail, verificationCode);

    console.log('✅ User created successfully:', cleanUsername);

    res.status(201).json({
      message: 'Verification code sent to your email! Please verify your email first.',
      userId: user._id,
      requiresEmailVerification: true
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code expired. Please register again.' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log('✅ Email verified for:', user.username);
    res.json({ message: 'Email verified successfully! You can now login.', verified: true });

  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Enable/Disable 2FA
export const toggle2FA = async (req, res) => {
  try {
    const userId = req.userId;
    const { enable } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.twoFAEnabled = enable;
    await user.save();

    console.log(`${enable ? '✅ Enabled' : '❌ Disabled'} 2FA for user:`, user.username);
    res.json({
      message: `2FA ${enable ? 'enabled' : 'disabled'} successfully`,
      twoFAEnabled: user.twoFAEnabled
    });

  } catch (error) {
    console.error('❌ Toggle 2FA error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login - FIXED COOKIE SETTINGS
export const login = async (req, res) => {
  console.log('🔐 Login attempt:', req.body.username);

  try {
    let { username, password, deviceInfo } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const cleanUsername = username.toLowerCase().replace(/\s/g, '');
    console.log('Looking for username:', cleanUsername);

    let user = await User.findOne({ username: cleanUsername });
    if (!user) {
      user = await User.findOne({ email: cleanUsername });
    }

    if (!user) {
      console.log('❌ User not found:', cleanUsername);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    console.log('✅ User found:', user.username);

    if (!user.isVerified) {
      return res.status(401).json({
        message: 'Please verify your email first. Check your inbox for the verification code.',
        requiresEmailVerification: true
      });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(423).json({
        message: `Account is locked. Please try again in ${remainingMinutes} minute(s).`,
        locked: true
      });
    }

    const isValidPassword = await user.comparePassword(password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      user.failedAttempts += 1;
      const remainingAttempts = 3 - user.failedAttempts;

      if (user.failedAttempts >= 3) {
        user.lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        return res.status(423).json({
          message: 'Too many failed attempts. Account locked for 5 minutes.',
          locked: true
        });
      }

      await user.save();
      return res.status(401).json({
        message: `Invalid password. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts: remainingAttempts
      });
    }

    user.failedAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    // Check if 2FA is enabled
    if (user.twoFAEnabled) {
      const twoFACode = user.generateTwoFACode();
      await user.save();

      const emailSent = await sendTwoFACode(user.email, twoFACode);

      if (!emailSent) {
        return res.status(500).json({ message: 'Failed to send 2FA code. Please try again.' });
      }

      console.log('📧 2FA code sent to:', user.email);

      const tempToken = jwt.sign(
        { userId: user._id, requires2FA: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      return res.status(200).json({
        requires2FA: true,
        tempToken: tempToken,
        message: '2FA code sent to your email. Please enter the code to continue.'
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    const ipAddress = req.ip || req.connection.remoteAddress;
    user.loginHistory.push({
      timestamp: new Date(),
      deviceInfo: deviceInfo || 'Unknown device',
      ipAddress
    });
    user.totalLogins += 1;
    user.lastLoginAt = new Date();
    await user.save();

    // FIXED: Better cookie settings for localhost
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      httpOnly: true,
      secure: false,  // false for localhost (no HTTPS)
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    };

    // Set cookies
    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    console.log('✅ Login successful for:', user.username);
    console.log('   Cookies set with path: /');

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalLogins: user.totalLogins,
        twoFAEnabled: user.twoFAEnabled
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify 2FA Code
export const verify2FALogin = async (req, res) => {
  try {
    const { tempToken, twoFACode, deviceInfo, trustDevice } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    if (!decoded.requires2FA) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFACode || user.twoFACode !== twoFACode) {
      return res.status(401).json({ message: 'Invalid 2FA code' });
    }

    if (user.twoFACodeExpires < new Date()) {
      return res.status(401).json({ message: '2FA code expired. Please login again.' });
    }

    user.twoFACode = undefined;
    user.twoFACodeExpires = undefined;

    if (trustDevice && deviceInfo) {
      const existingDevice = user.trustedDevices.find(d => d.deviceFingerprint === deviceInfo);
      if (!existingDevice) {
        user.trustedDevices.push({
          deviceFingerprint: deviceInfo,
          trustedAt: new Date(),
          lastUsed: new Date()
        });
      } else {
        existingDevice.lastUsed = new Date();
      }
    }

    const token = generateToken(user._id);
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    const ipAddress = req.ip || req.connection.remoteAddress;
    user.loginHistory.push({
      timestamp: new Date(),
      deviceInfo: deviceInfo || 'Unknown device',
      ipAddress
    });
    user.totalLogins += 1;
    user.lastLoginAt = new Date();
    await user.save();

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    };

    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalLogins: user.totalLogins,
        twoFAEnabled: user.twoFAEnabled
      }
    });

  } catch (error) {
    console.error('❌ 2FA verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend 2FA Code
export const resend2FACode = async (req, res) => {
  try {
    const { tempToken } = req.body;

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.requires2FA) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const twoFACode = user.generateTwoFACode();
    await user.save();

    const emailSent = await sendTwoFACode(user.email, twoFACode);

    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send 2FA code' });
    }

    res.json({ message: 'New 2FA code sent to your email' });

  } catch (error) {
    console.error('❌ Resend 2FA error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -twoFACode');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    console.log('🔓 Logout request received');

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    };

    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    console.log('✅ Logout successful, cookies cleared');

    res.json({
      message: 'Logged out successfully',
      success: true
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.json({ message: 'If your email is registered, you will receive a reset code.' });
    }

    const resetCode = user.generateResetCode();
    await user.save();

    await sendResetPasswordEmail(cleanEmail, resetCode);

    console.log('✅ Reset code sent to:', cleanEmail);
    res.json({ message: 'Reset code sent to your email.', userId: user._id });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordCode !== resetCode) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Reset code expired' });
    }

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    console.log('✅ Password reset successful for:', user.username);
    res.json({ message: 'Password reset successful!' });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend Email Verification
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const newCode = user.generateVerificationCode();
    await user.save();

    await sendVerificationEmail(user.email, newCode);

    res.json({ message: 'New verification code sent' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
