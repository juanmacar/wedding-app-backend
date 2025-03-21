/**
 * Email Service
 * This service handles sending emails using nodemailer
 */
import nodemailer from 'nodemailer';
import { emailConfig, defaultEmailOptions } from './config.js';

/**
 * Create a nodemailer transporter
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email address
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text email content
 * @param {String} options.html - HTML email content
 * @returns {Promise} Promise that resolves with the send information
 */
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: emailConfig.from,
      ...defaultEmailOptions,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Verify email configuration by attempting to connect to the SMTP server
 * @returns {Promise<boolean>} True if connection is successful
 */
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
};
