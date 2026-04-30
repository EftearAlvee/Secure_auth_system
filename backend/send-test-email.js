import { sendVerificationEmail } from './utils/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('📧 Testing email send...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  
  const result = await sendVerificationEmail('raz.mi.2002.10.06@gmail.com', '123456');
  
  if (result) {
    console.log('✅ Email sent successfully! Check your inbox/spam folder.');
  } else {
    console.log('❌ Email failed to send.');
  }
}

test();
