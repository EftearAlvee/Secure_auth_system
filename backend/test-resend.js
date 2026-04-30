require('dotenv').config();

console.log('Testing Resend...');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Exists' : '✗ Missing');

if (!process.env.RESEND_API_KEY) {
  console.log('\n❌ RESEND_API_KEY not found in environment!');
  console.log('Please add it to your .env file or Vercel variables.');
  process.exit(1);
}

const { sendVerificationEmail } = require('./utils/emailService');

async function test() {
  const result = await sendVerificationEmail('alvee751268@gmail.com', '123456');
  console.log('\nResult:', result ? '✅ Email sent!' : '❌ Failed');
}

test();
