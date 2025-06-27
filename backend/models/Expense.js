const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        return value <= new Date()
      },
      message: 'Expense date cannot be in the future'
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks cannot exceed 200 characters']
  },
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital', 'bank_transfer', 'other'],
    default: 'card'
  },
  receipt: {
    filename: String,
    url: String,
    size: Number
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecurringExpense'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for performance
expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ user: 1, category: 1 })
expenseSchema.index({ user: 1, createdAt: -1 })
expenseSchema.index({ date: 1 })

// Virtual for formatted date
expenseSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0]
})

// Virtual for month/year for aggregation
expenseSchema.virtual('month').get(function() {
  return this.date.getMonth() + 1
})

expenseSchema.virtual('year').get(function() {
  return this.date.getFullYear()
})

// Static method for expense statistics
expenseSchema.statics.getStatistics = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        maxAmount: { $max: '$amount' },
        minAmount: { $min: '$amount' }
      }
    }
  ]
  
  const result = await this.aggregate(pipeline)
  return result[0] || {
    totalAmount: 0,
    totalCount: 0,
    avgAmount: 0,
    maxAmount: 0,
    minAmount: 0
  }
}

// Static method for category-wise expenses
expenseSchema.statics.getCategoryStats = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $group: {
        _id: '$categoryId',
        categoryName: { $first: '$category.name' },
        categoryColor: { $first: '$category.color' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]
  
  return await this.aggregate(pipeline)
}

// Static method for monthly trends
expenseSchema.statics.getMonthlyTrends = async function(userId, months = 6) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(endDate.getMonth() - months)
  
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]
  
  return await this.aggregate(pipeline)
}

module.exports = mongoose.model('Expense', expenseSchema)
