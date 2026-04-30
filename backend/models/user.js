import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  twoFASecret: {
    type: String,
    default: null
  },
  twoFAEnabled: {
    type: Boolean,
    default: false
  },
  twoFACode: String,
  twoFACodeExpires: Date,
  twoFABackupCodes: [{
    code: String,
    used: { type: Boolean, default: false }
  }],
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  loginHistory: [{
    timestamp: Date,
    deviceInfo: String,
    ipAddress: String,
    location: String
  }],
  trustedDevices: [{
    deviceFingerprint: String,
    trustedAt: Date,
    lastUsed: Date
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  resetPasswordCode: String,
  resetPasswordExpires: Date,
  totalLogins: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: Date
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Generate 2FA code
userSchema.methods.generateTwoFACode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.twoFACode = code;
  this.twoFACodeExpires = new Date(Date.now() + 5 * 60 * 1000);
  return code;
};

// Generate backup codes
userSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.push({ code, used: false });
  }
  this.twoFABackupCodes = codes;
  return codes.map(c => c.code);
};

// Generate verification code
userSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  return code;
};

// Generate reset password code
userSchema.methods.generateResetCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordCode = code;
  this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  return code;
};

const User = mongoose.model('User', userSchema);
export default User;
