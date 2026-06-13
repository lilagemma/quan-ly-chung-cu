const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

require("dotenv").config({
  path: path.resolve(__dirname, ".env.local"),
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const complaintRoutes = require('./routes/complaint.routes');
const gatelogRoutes = require('./routes/gatelog.routes');
const assetRoutes = require('./routes/asset.routes');

// ... các route khác
const serviceFeeRoutes = require('./routes/serviceFee.routes');
const expenseRoutes = require("./routes/expenses");
const reportRoutes = require("./routes/reports");
const residentRoutes = require("./routes/residentRoutes");


// Import cron jobs
const initCronJobs = require('./jobs');

// Import database connection
const connectDB = require('./config/db');

// Initialize express app
const app = express();

// BẢO EXPRESS TIN TƯỞNG PROXY (NGROK) [3†L29-L30]
app.set('trust proxy', 1); 


// Connect to MongoDB
connectDB();


// Middleware
app.use(helmet()); // Security headers
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:3000',
//   credentials: true, // Allow cookies
// }));
app.use(
  cors({
    // Lấy origin từ biến môi trường, đảm bảo nó là link HTTPS ngrok của bạn
    origin: process.env.CLIENT_URL,
    credentials: true, // Cho phép gửi cookie
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// ==================== STATIC FILES ====================
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// app.use("/uploads", express.static("uploads"));
console.log('📁 Static uploads path:', uploadsPath);
// ====================================================

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Rajarshi Darshan Society Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Landing page route
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'templates', 'landing.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Replace placeholder with actual client URL
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  html = html.replace(/\{\{CLIENT_URL\}\}/g, clientUrl);
  
  res.type('html').send(html);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/gatelog', gatelogRoutes);
app.use('/api/assets', assetRoutes);

app.use("/api/service-fees", serviceFeeRoutes);
app.use("/api/admin/expenses", expenseRoutes);
app.use("/api/admin/reports", reportRoutes);
app.use("/api/residents", residentRoutes);



// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize cron jobs
  initCronJobs();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = app;
