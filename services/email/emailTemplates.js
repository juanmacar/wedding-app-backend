/**
 * Email Templates
 * This file contains templates for various emails sent by the application
 */
import { baseUrl } from './config.js';

/**
 * Generate a password reset email
 * @param {Object} options - Options for the email
 * @param {String} options.name - User's name or email
 * @param {String} options.resetToken - Password reset token
 * @returns {Object} Email template with subject, text and html content
 */
export const passwordResetTemplate = ({ name, resetToken }) => {
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
  const userIdentifier = name || 'there'; // Fallback if name is not provided

  return {
    subject: 'Password Reset Request',
    text: `Hello ${userIdentifier},\n\nYou requested a password reset for your Wedding App account. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this reset, please ignore this email and your password will remain unchanged.\n\nRegards,\nThe Wedding App Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a4a4a;">Password Reset Request</h2>
        <p>Hello ${userIdentifier},</p>
        <p>You requested a password reset for your Wedding App account. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this reset, please ignore this email and your password will remain unchanged.</p>
        <p>Regards,<br>The Wedding App Team</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">If the button doesn't work, copy and paste this URL into your browser: ${resetUrl}</p>
      </div>
    `,
  };
};

/**
 * Generate a password change confirmation email
 * @param {Object} options - Options for the email
 * @param {String} options.name - User's name or email
 * @returns {Object} Email template with subject, text and html content
 */
export const passwordChangeConfirmationTemplate = ({ name }) => {
  const userIdentifier = name || 'there'; // Fallback if name is not provided

  return {
    subject: 'Password Changed Successfully',
    text: `Hello ${userIdentifier},\n\nYour password for the Wedding App has been successfully changed.\n\nIf you did not make this change, please contact our support team immediately.\n\nRegards,\nThe Wedding App Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a4a4a;">Password Changed Successfully</h2>
        <p>Hello ${userIdentifier},</p>
        <p>Your password for the Wedding App has been successfully changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <p>Regards,<br>The Wedding App Team</p>
      </div>
    `,
  };
};
