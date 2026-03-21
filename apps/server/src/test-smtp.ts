import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const envPath = 'c:/Users/mysti.KIM-JONG-UN.000/Desktop/Beacon/apps/server/.env.development';
dotenv.config({ path: envPath });

async function test() {
  console.log('--- SMTP DIAGNOSTIC ---');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Pass: ${pass ? '****' + pass.slice(-4) : 'MISSING'}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    debug: true,
    logger: true
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('SUCCESS: Connection verified!');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"${user}" <${user}>`,
      to: user, // Send to self
      subject: 'Beacon SMTP Test',
      text: 'This is a test from the Beacon diagnostic script.'
    });
    console.log('SUCCESS: Email sent!', info.messageId);
  } catch (err: any) {
    console.error('FAILURE:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

test();
