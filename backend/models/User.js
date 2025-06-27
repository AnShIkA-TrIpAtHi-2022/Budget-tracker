const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const validator = require('validator')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  monthlyBudget: {
    type: Number,
    default: 3000,
    min: [0, 'Monthly budget cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR']
  },
  preferences: {
    darkMode: {
      type: Boolean,
      default: false
    },
    defaultCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    notifications: {
      budgetAlerts: {
        type: Boolean,
        default: true
      },
      recurringReminders: {
        type: Boolean,
        default: true
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for performance
userSchema.index({ isActive: 1 })

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    monthlyBudget: this.monthlyBudget,
    currency: this.currency,
    preferences: this.preferences
  }
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    this.password = await bcrypt.hash(this.password, saltRounds)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date()
  return this.save({ validateBeforeSave: false })
}

module.exports = mongoose.model('User', userSchema)
