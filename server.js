const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Middlewares & Routes
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const visitRoutes = require('./routes/visitRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// NewFlow Routes & Middleware
const newFlowRoutes = require('./NewFlow/routes');
const { flowMiddleware, newFlowErrorHandler, newFlowResponseFormatter } = require('./NewFlow/flowMiddleware');
const app = express();

// ====== Middleware ======
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://hospital-management-frontend.vercel.app',
    'https://hospital-management-frontend-git-main-bhupendra191292.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint for Railway healthcheck
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Digital Hospital Management System API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Fallback endpoint for when MongoDB is not available
app.get('/api/fallback/status', (req, res) => {
  res.status(200).json({
    status: 'fallback',
    message: 'Server is running in fallback mode - MongoDB not available',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Flow Middleware - must be before routes
app.use(flowMiddleware);
app.use(newFlowResponseFormatter);

// ====== Routes ======
// Current Flow Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// NewFlow Routes
console.log('🔍 Registering NewFlow routes...');
app.use('/api/newflow', newFlowRoutes);
console.log('✅ NewFlow routes registered');

// ====== Error Handling ======
app.use(newFlowErrorHandler);

// Global error handler for Vercel
app.use((err, req, res, next) => {
  console.error('🚨 Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// ====== MongoDB Connection ======
const connectToMongoDB = async () => {
  try {
    // Skip connection if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return true;
    }

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/digital-hospital';
    console.log('🔗 Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

// ====== Server Initialization ======
const initializeServer = async () => {
  const mongoConnected = await connectToMongoDB();
  
  if (!mongoConnected) {
    console.warn('⚠️ Server running without MongoDB connection');
    console.log('💡 Server will run with limited functionality');
  }
  
  console.log('🚀 Server initialized successfully');
};

// Initialize server on startup
initializeServer();

// ====== Development Server ======
// Only start the development server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    console.log(`✅ Development server running at http://localhost:${port}`);
    console.log(`🚀 NewFlow routes available at http://localhost:${port}/api/newflow`);
    console.log(`📊 Flow switcher enabled in development mode`);
  });
}

// ====== Vercel Serverless Export ======
// For Vercel serverless functions, we need to export the app
module.exports = app;
