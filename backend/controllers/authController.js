const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendResetPasswordEmail, sendNewDeviceAlert } = require('../utils/emailService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Extended to 7 days
};

// Register
const register = async (req, res) => {
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

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: password,
      failedAttempts: 0,
      lockedUntil: null,
      isVerified: true,
      createdAt: new Date()
    });

    await user.save();

    console.log('✅ User created successfully:', cleanUsername);

    res.status(201).json({
      message: 'Registration successful! You can now login.',
      userId: user._id
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Login
const login = async (req, res) => {
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

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
      console.log('🔒 Account is locked');
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
        console.log('🔒 Account locked for 5 minutes');
        return res.status(423).json({
          message: 'Too many failed attempts. Account locked for 5 minutes.',
          locked: true
        });
      }

      await user.save();
      console.log(`❌ Invalid password. Attempts: ${user.failedAttempts}/3`);
      return res.status(401).json({
        message: `Invalid password. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts: remainingAttempts
      });
    }

    user.failedAttempts = 0;
    user.lockedUntil = null;

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

    console.log('✅ Login successful:', user.username);

    // Set cookies with proper options
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
        totalLogins: user.totalLogins
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Profile
const getProfile = async (req, res) => {
  try {
    console.log('📊 Get profile for user:', req.userId);
    const user = await User.findById(req.userId).select('-password');
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
const logout = async (req, res) => {
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
    res.clearCookie('csrfSecret', cookieOptions);

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

// Verify Email
const verifyEmail = async (req, res) => {
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
      return res.status(400).json({ message: 'Verification code expired' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully!', verified: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
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
const resetPassword = async (req, res) => {
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

// Resend Verification
const resendVerification = async (req, res) => {
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

// Export all functions
module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  logout,
  resendVerification
};
