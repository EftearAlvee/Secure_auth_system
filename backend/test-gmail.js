import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testGmail() {
  console.log('📧 Testing REAL Gmail...');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  try {
    await transporter.verify();
    console.log('✅ Gmail authentication successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"SecureAuth Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '✅ Real Gmail Test - SecureAuth',
      text: 'If you receive this, your Gmail App Password is working!'
    });
    
    console.log('✅ Test email sent! Check your Gmail inbox.');
    console.log('   Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Gmail error:', error.message);
    console.log('\n🔧 Next steps:');
    console.log('1. Delete the old "SecureAuth" app password');
    console.log('2. Create a NEW app password');
    console.log('3. Copy the 16-character password');
    console.log('4. Remove spaces and update .env');
  }
}

testGmail();
