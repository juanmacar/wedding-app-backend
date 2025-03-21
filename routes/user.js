import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { AppError } from '../services/errors.js';
import { sendPasswordChangeConfirmationEmail } from '../services/email/index.js';

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile information based on token
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    // req.user is already set by the protect middleware with password excluded
    // We only need to populate the weddings to get their details
    await req.user.populate('weddings');

    // Return the user object that's already in req.user
    return res.status(200).json(req.user);
  } catch (error) {
    console.error('Error in GET /api/user/me:', error);
    return res.status(500).json({ error: 'An error occurred while fetching user profile' });
  }
});

/**
 * @route   PUT /api/user/change-password
 * @desc    Change user password (requires authentication and old password)
 * @access  Private
 */
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return next(new AppError('Current password and new password are required', 400));
    }

    // Get user with password field
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Validate new password (optional: add more validation rules as needed)
    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters long', 400));
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    // Send confirmation email (don't wait for it to complete)
    sendPasswordChangeConfirmationEmail(user).catch(error => {
      console.error('Error sending password change confirmation email:', error);
    });

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error in PUT /api/user/change-password:', error);
    return next(new AppError('An error occurred while changing password', 500));
  }
});

export default router;
