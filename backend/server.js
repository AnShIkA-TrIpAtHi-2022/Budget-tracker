const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

// Import routes
const expenseRoutes = require('./routes/expenses')
const categoryRoutes = require('./routes/categories')
const recurringRoutes = require('./routes/recurring')
const userRoutes = require('./routes/users')
const analyticsRoutes = require('./routes/analytics')

// Import middleware
const { errorHandler } = require('./middleware/errorHandler')
const { notFound } = require('./middleware/notFound')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
})
app.use('/api/', limiter)

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}))

// Compression and logging
app.use(compression())
app.use(morgan('combined'))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB')
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error)
  process.exit(1)
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  })
})

// API routes
app.use('/api/users', userRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/recurring', recurringRoutes)
app.use('/api/analytics', analyticsRoutes)

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Budget Tracker API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      users: 'POST /api/users/register, POST /api/users/login',
      expenses: 'GET|POST|PUT|DELETE /api/expenses',
      categories: 'GET|POST|PUT|DELETE /api/categories',
      recurring: 'GET|POST|PUT|DELETE /api/recurring',
      analytics: 'GET /api/analytics/*'
    },
    documentation: 'https://github.com/yourusername/budget-tracker/blob/main/API.md'
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  mongoose.connection.close(() => {
    console.log('Database connection closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  mongoose.connection.close(() => {
    console.log('Database connection closed')
    process.exit(0)
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Budget Tracker API running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
})

module.exports = app
