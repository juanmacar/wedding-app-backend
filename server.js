/* eslint-disable import/no-unresolved */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './utils/db.js';
import { initializeDatabase } from './utils/dbInit.js';
import { verifyEmailConfig } from './services/email/index.js';

// Import routes
import lodgingRoutes from './routes/lodging.js';
import transportationRoutes from './routes/transportation.js';
import authRoutes from './routes/auth.js';
import weddingsRoutes from './routes/weddings.js';
import invitationsRoutes from './routes/invitations.js';
import userRoutes from './routes/user.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Request headers:', req.headers);
  // Set default content type to JSON
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Connect to MongoDB
const startServer = async () => {
  try {
    await connectToDatabase(MONGODB_URI);
    await initializeDatabase();
    console.log('Connected to MongoDB and initialized database');

    // Verify email configuration
    const emailConfigValid = await verifyEmailConfig();
    if (emailConfigValid) {
      console.log('Email service configured successfully');
    } else {
      console.warn('Email service configuration invalid or missing - email features will not work');
    }

    // Root route
    app.get('/', (req, res) => {
      res.json({
        message: 'Wedding App API is running',
        endpoints: [
          '/api/invitations',
          '/api/lodging',
          '/api/transportation',
          '/api/auth',
          '/api/weddings',
          '/api/user'
        ]
      });
    });

    // Routes
    app.use('/api/invitations', invitationsRoutes);
    app.use('/api/lodging', lodgingRoutes);
    app.use('/api/transportation', transportationRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/weddings', weddingsRoutes);
    app.use('/api/user', userRoutes);

    // Error handling middleware
    app.use(notFound);
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

startServer();
