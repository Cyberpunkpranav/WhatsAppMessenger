import express from 'express';
import cors from 'cors';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv/config';
import { testConnection, initializeTables } from './config/database.js';
import userRoutes from './routes/user.routes.js';
import templateRoutes from './routes/template.routes.js';
import contactRoutes from './routes/contact.routes.js';
import facebookRoutes from './routes/facebook.routes.js';
import tenantRoutes from './routes/tenants.routes.ts';
import libraryRoutes from './routes/library.controller.js'
import cookieParser from 'cookie-parser';
import mongoDB from './database/mongodb.js';

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   }
// });

// app.use('/api/', limiter);

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://whats-app-messenger-steel.vercel.app','https://www.impretio.com',null];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

/**
 * API Routes
 * Mount all route modules under /api prefix
 */
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/library', libraryRoutes)

/**
 * Health check endpoint
 * Used for monitoring server status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Root endpoint
 * Provides basic API information
 */
app.get('/api', (req, res) => {
  res.json({
    message: 'WhatsApp Campaign Manager API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      templates: '/api/templates',
      // contacts: '/api/contacts',
      tenants: '/api/tenants',
      health: '/api/health'
    }
  });
});

/**
 * 404 handler for API routes
 */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.path} does not exist`
  });
});

/**
 * Global error handler
 * Catches and handles all unhandled errors
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

/**
 * Initialize database and start server
 */
async function startServer() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const dbConnected = await testConnection();
    const mongo = await mongoDB()
     if (!mongo) {
      console.error('Failed to connect to mongodb. Please check your database configuration.');
      process.exit(1);
    }
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    // Initialize database tables
    console.log('Initializing database tables...');
    await initializeTables();

    // Start the server
    app.listen(PORT, () => {
      console.log(`
🚀 WhatsApp Campaign Manager API Server Started
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health Check: http://localhost:${PORT}/api/health
📊 API Documentation: http://localhost:${PORT}/api
      `);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handling
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();