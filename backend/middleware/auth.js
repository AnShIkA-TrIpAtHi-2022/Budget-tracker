const jwt = require('jsonwebtoken')
const User = require('../models/User')

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token.'
        })
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.'
        })
      }

      req.user = user
      next()
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    })
  }
}

// Optional auth - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId).select('-password')
        
        if (user && user.isActive) {
          req.user = user
        }
      } catch (jwtError) {
        // Invalid token, but continue without user
        console.log('Optional auth: Invalid token provided')
      }
    }
    
    next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    next() // Continue even if error
  }
}

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

module.exports = {
  auth,
  optionalAuth,
  generateToken,
  verifyToken
}
