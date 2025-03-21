/**
 * Email service configuration
 * This file contains the configuration for the email service
 */
import dotenv from 'dotenv';

dotenv.config();

// Email configuration
export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  from: process.env.EMAIL_FROM || 'noreply@weddingapp.com',
};

// Default options for emails
export const defaultEmailOptions = {
  subject: 'Wedding App Notification',
};

// Email templates base URL (for password reset links, etc.)
export const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
