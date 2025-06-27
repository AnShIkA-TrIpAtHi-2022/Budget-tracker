const mongoose = require('mongoose')

const recurringExpenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Recurring expense title is required'],
    trim: true,
    maxlength: [50, 'Title cannot exceed 50 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  cycleDetails: {
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6, // 0 = Sunday, 6 = Saturday
      validate: {
        validator: function(v) {
          return this.cycle !== 'weekly' || (v >= 0 && v <= 6)
        },
        message: 'Day of week must be between 0-6 for weekly cycles'
      }
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      validate: {
        validator: function(v) {
          return !['monthly', 'quarterly', 'yearly'].includes(this.cycle) || (v >= 1 && v <= 31)
        },
        message: 'Day of month must be between 1-31 for monthly/quarterly/yearly cycles'
      }
    },
    monthOfYear: {
      type: Number,
      min: 1,
      max: 12,
      validate: {
        validator: function(v) {
          return this.cycle !== 'yearly' || (v >= 1 && v <= 12)
        },
        message: 'Month of year must be between 1-12 for yearly cycles'
      }
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.startDate
      },
      message: 'End date must be after start date'
    }
  },
  nextDue: {
    type: Date,
    required: true
  },
  lastProcessedDate: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  autoCreate: {
    type: Boolean,
    default: true
  },
  reminderDays: {
    type: Number,
    default: 1,
    min: [0, 'Reminder days cannot be negative'],
    max: [30, 'Reminder days cannot exceed 30']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  createdExpenses: [{
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense'
    },
    dateCreated: {
      type: Date,
      default: Date.now
    },
    amount: Number
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for performance
recurringExpenseSchema.index({ user: 1, active: 1 })
recurringExpenseSchema.index({ user: 1, nextDue: 1 })
recurringExpenseSchema.index({ active: 1, nextDue: 1 })

// Remove virtual since we have direct category reference

// Virtual for days until next due
recurringExpenseSchema.virtual('daysUntilDue').get(function() {
  if (!this.nextDue) return null
  
  const today = new Date()
  const dueDate = new Date(this.nextDue)
  const diffTime = dueDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
})

// Virtual for status
recurringExpenseSchema.virtual('status').get(function() {
  if (!this.active) return 'inactive'
  
  const daysUntilDue = this.daysUntilDue
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue === 0) return 'due_today'
  if (daysUntilDue <= this.reminderDays) return 'reminder'
  
  return 'scheduled'
})

// Pre-save middleware to calculate next due date
recurringExpenseSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('frequency') || this.isModified('startDate') || this.isModified('cycleDetails')) {
    this.nextDue = this.calculateNextDueDate(this.startDate || new Date())
  }
  next()
})

// Method to calculate next due date
recurringExpenseSchema.methods.calculateNextDueDate = function(fromDate = new Date()) {
  const date = new Date(fromDate)
  
  switch (this.frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
      
    case 'weekly':
      const dayOfWeek = this.cycleDetails.dayOfWeek || 1 // Default to Monday
      const daysUntilTarget = (dayOfWeek - date.getDay() + 7) % 7
      date.setDate(date.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
      break
      
    case 'monthly':
      const dayOfMonth = this.cycleDetails.dayOfMonth || 1
      date.setMonth(date.getMonth() + 1)
      date.setDate(Math.min(dayOfMonth, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()))
      break
      
    case 'yearly':
      const yearDay = this.cycleDetails.dayOfMonth || 1
      const yearMonth = this.cycleDetails.monthOfYear || 1
      date.setFullYear(date.getFullYear() + 1)
      date.setMonth(yearMonth - 1)
      date.setDate(Math.min(yearDay, new Date(date.getFullYear(), yearMonth, 0).getDate()))
      break
  }
  
  return date
}

// Method to create expense from recurring
recurringExpenseSchema.methods.createExpense = async function() {
  try {
    const Expense = mongoose.model('Expense')
    
    const expense = new Expense({
      amount: this.amount,
      date: this.nextDue,
      category: this.category,
      user: this.user,
      remarks: `${this.title} (Recurring)`,
      isRecurring: true,
      recurringId: this._id
    })
    
    await expense.save()
    
    // Update recurring expense
    this.createdExpenses.push({
      expenseId: expense._id,
      dateCreated: new Date(),
      amount: this.amount
    })
    
    this.lastProcessedDate = new Date()
    this.nextDue = this.calculateNextDueDate(this.nextDue)
    
    await this.save()
    
    return expense
  } catch (error) {
    throw error
  }
}

// Static method to process due recurring expenses
recurringExpenseSchema.statics.processDueExpenses = async function() {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  
  const dueRecurring = await this.find({
    active: true,
    autoCreate: true,
    nextDue: { $lte: today },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gt: today } }
    ]
  }).populate('category')
  
  const results = []
  
  for (const recurring of dueRecurring) {
    try {
      const expense = await recurring.createExpense()
      results.push({
        success: true,
        recurringId: recurring._id,
        expenseId: expense._id,
        name: recurring.title,
        amount: recurring.amount
      })
    } catch (error) {
      results.push({
        success: false,
        recurringId: recurring._id,
        name: recurring.title,
        error: error.message
      })
    }
  }
  
  return results
}

// Static method to get upcoming recurring expenses
recurringExpenseSchema.statics.getUpcoming = async function(userId, days = 30) {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)
  
  return await this.find({
    user: new mongoose.Types.ObjectId(userId),
    active: true,
    nextDue: {
      $gte: new Date(),
      $lte: endDate
    }
  }).populate('category').sort({ nextDue: 1 })
}

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema)
