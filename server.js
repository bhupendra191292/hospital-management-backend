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
    version: '1.0.0'
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

// ====== Mongo Connection & Start ======
const startServer = () => {
  app.listen(process.env.PORT || 5001, () => {
    console.log(`✅ Server running at http://localhost:${process.env.PORT || 5001}`);
    console.log(`🚀 NewFlow routes available at http://localhost:${process.env.PORT || 5001}/api/newflow`);
    console.log(`📊 Flow switcher enabled in development mode`);
  });
};

// Try to connect to MongoDB, but start server even if it fails
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digital-hospital')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    startServer();
  })
  .catch(err => {
    console.warn('⚠️ MongoDB connection failed, starting server in fallback mode:', err.message);
    console.log('💡 Server will run with mock data for NewFlow development');
    startServer();
  });
