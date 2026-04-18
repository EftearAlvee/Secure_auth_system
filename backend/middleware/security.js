const csrf = require('csrf');
const Tokens = new csrf();

const csrfProtection = (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;

  if (!csrfToken) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }

  const secret = req.cookies.csrfSecret;
  if (!secret || !Tokens.verify(secret, csrfToken)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
};

const generateCSRFToken = (req, res, next) => {
  const secret = Tokens.secretSync();
  const token = Tokens.create(secret);
  req.csrfToken = token;
  res.cookie('csrfSecret', secret, { httpOnly: true, secure: true, sameSite: 'strict' });
  next();
};

module.exports = { csrfProtection, generateCSRFToken };
