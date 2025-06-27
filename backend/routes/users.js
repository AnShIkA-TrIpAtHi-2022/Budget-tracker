const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

const router = express.Router()

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email and password'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    )

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      })
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    )

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
router.put('/me', auth, async (req, res, next) => {
  try {
    const { name, email } = req.body

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update password
// @route   PUT /api/users/updatepassword
// @access  Private
router.put('/updatepassword', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide current and new password'
      })
    }

    const user = await User.findById(req.user.id).select('+password')

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()

    // Generate new JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    )

    res.status(200).json({
      success: true,
      token,
      message: 'Password updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
