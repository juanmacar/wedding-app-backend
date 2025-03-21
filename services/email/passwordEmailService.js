/**
 * Password Email Service
 * This service handles sending password-related emails
 */
import { sendEmail } from './emailService.js';
import { passwordResetTemplate, passwordChangeConfirmationTemplate } from './emailTemplates.js';

/**
 * Send a password reset email
 * @param {Object} user - User object with email and optional name
 * @param {String} resetToken - Password reset token
 * @returns {Promise} Promise that resolves with the send information
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  if (!user || !user.email) {
    throw new Error('User email is required to send password reset email');
  }

  const template = passwordResetTemplate({
    name: user.name || user.email.split('@')[0], // Use first part of email if name not available
    resetToken,
  });

  return sendEmail({
    to: user.email,
    ...template,
  });
};

/**
 * Send a password change confirmation email
 * @param {Object} user - User object with email and optional name
 * @returns {Promise} Promise that resolves with the send information
 */
export const sendPasswordChangeConfirmationEmail = async (user) => {
  if (!user || !user.email) {
    throw new Error('User email is required to send password change confirmation email');
  }

  const template = passwordChangeConfirmationTemplate({
    name: user.name || user.email.split('@')[0], // Use first part of email if name not available
  });

  return sendEmail({
    to: user.email,
    ...template,
  });
};
