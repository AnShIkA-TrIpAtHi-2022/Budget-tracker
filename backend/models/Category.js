const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [30, 'Category name cannot exceed 30 characters']
  },
  color: {
    type: String,
    required: [true, 'Category color is required'],
    match: [/^#[0-9A-Fa-f]{6}$/, 'Please provide a valid hex color']
  },
  icon: {
    type: String,
    default: 'tag',
    maxlength: [20, 'Icon name cannot exceed 20 characters']
  },
  description: {
    type: String,
    maxlength: [100, 'Description cannot exceed 100 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  budget: {
    monthly: {
      type: Number,
      min: [0, 'Monthly budget cannot be negative'],
      default: 0
    },
    yearly: {
      type: Number,
      min: [0, 'Yearly budget cannot be negative'],
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for performance
categorySchema.index({ user: 1, isActive: 1 })
categorySchema.index({ user: 1, name: 1 }, { unique: true })

// Virtual for expense count
categorySchema.virtual('expenseCount', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
})

// Virtual for total spent
categorySchema.virtual('totalSpent').get(function() {
  // This will be populated by aggregation queries
  return this._totalSpent || 0
})

// Pre-remove middleware to handle expense cleanup
categorySchema.pre('remove', async function(next) {
  try {
    // Check if there are expenses using this category
    const Expense = mongoose.model('Expense')
    const expenseCount = await Expense.countDocuments({ categoryId: this._id })
    
    if (expenseCount > 0) {
      const error = new Error(`Cannot delete category. ${expenseCount} expenses are using this category.`)
      error.statusCode = 400
      return next(error)
    }
    
    next()
  } catch (error) {
    next(error)
  }
})

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return [
    { name: 'Lunch', color: '#ef4444', icon: 'utensils' },
    { name: 'Dinner', color: '#f97316', icon: 'utensils' },
    { name: 'Snacks', color: '#eab308', icon: 'cookie' },
    { name: 'Travel', color: '#22c55e', icon: 'car' },
    { name: 'Necessities', color: '#3b82f6', icon: 'shopping-bag' },
    { name: 'Entertainment', color: '#8b5cf6', icon: 'film' },
    { name: 'Healthcare', color: '#ec4899', icon: 'heart' },
    { name: 'Education', color: '#14b8a6', icon: 'book' }
  ]
}

// Static method to create default categories for user
categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = this.getDefaultCategories()
  
  const categories = defaultCategories.map(cat => ({
    ...cat,
    userId,
    isDefault: true
  }))
  
  return await this.insertMany(categories)
}

module.exports = mongoose.model('Category', categorySchema)
