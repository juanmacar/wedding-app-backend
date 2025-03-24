/**
 * Script to send a test email
 * Run with: node scripts/sendTestEmail.js [recipient_email]
 *
 * This script tests the email configuration by sending a test email
 * to the specified recipient or the default recipient if none is provided.
 */
import dotenv from 'dotenv';
import { sendEmail, verifyEmailConfig } from '../services/email/index.js';

// Load environment variables
dotenv.config();

// Get recipient email from command line arguments or use default
const recipientEmail = process.argv[2] || 'juanmacarlupu@gmail.com';

/**
 * Send a test email
 */
async function sendTestEmail() {
  try {
    console.log('Verifying email configuration...');
    const isConfigValid = await verifyEmailConfig();

    if (!isConfigValid) {
      console.error('❌ Email configuration is invalid. Please check your .env file.');
      process.exit(1);
    }

    console.log('✅ Email configuration is valid.');
    console.log(`Sending test email to ${recipientEmail}...`);

    const info = await sendEmail({
      to: recipientEmail,
      subject: 'Test Email from Wedding App',
      text: 'This is a test email from your Wedding App backend.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a4a4a;">Test Email</h2>
          <p>Hello,</p>
          <p>This is a test email from your Wedding App backend.</p>
          <p>If you're receiving this, your email configuration is working correctly!</p>
          <p>Email details:</p>
          <ul>
            <li>Server: ${process.env.EMAIL_HOST}</li>
            <li>Port: ${process.env.EMAIL_PORT}</li>
            <li>Secure: ${process.env.EMAIL_SECURE}</li>
            <li>From: ${process.env.EMAIL_FROM}</li>
          </ul>
          <p>Sent at: ${new Date().toISOString()}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply.</p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

// Run the function
sendTestEmail();
