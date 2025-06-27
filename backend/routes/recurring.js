const express = require('express')
const RecurringExpense = require('../models/RecurringExpense')
const Category = require('../models/Category')
const Expense = require('../models/Expense')
const { auth } = require('../middleware/auth')

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get all recurring expenses for user
// @route   GET /api/recurring
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { status, frequency } = req.query
    const filter = { user: req.user.id }

    if (status) {
      filter.isActive = status === 'active'
    }

    if (frequency) {
      filter.frequency = frequency
    }

    const recurringExpenses = await RecurringExpense.find(filter)
      .populate('category', 'name color icon')
      .sort({ nextDue: 1 })

    res.status(200).json({
      success: true,
      count: recurringExpenses.length,
      data: recurringExpenses
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get single recurring expense
// @route   GET /api/recurring/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const recurringExpense = await RecurringExpense.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('category', 'name color icon')

    if (!recurringExpense) {
      return res.status(404).json({
        success: false,
        error: 'Recurring expense not found'
      })
    }

    res.status(200).json({
      success: true,
      data: recurringExpense
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Create new recurring expense
// @route   POST /api/recurring
// @access  Private
router.post('/', async (req, res, next) => {
  try {
    const { title, amount, category, frequency, startDate, description } = req.body

    // Validation
    if (!title || !amount || !category || !frequency || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, amount, category, frequency, and start date'
      })
    }

    // Check if category exists and belongs to user
    const categoryExists = await Category.findOne({
      _id: category,
      user: req.user.id
    })

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category'
      })
    }

    // Calculate next due date based on frequency
    const nextDue = calculateNextDue(new Date(startDate), frequency)

    const recurringExpense = await RecurringExpense.create({
      title,
      amount,
      category,
      frequency,
      startDate,
      nextDue,
      description,
      user: req.user.id
    })

    await recurringExpense.populate('category', 'name color icon')

    res.status(201).json({
      success: true,
      data: recurringExpense
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update recurring expense
// @route   PUT /api/recurring/:id
// @access  Private
router.put('/:id', async (req, res, next) => {
  try {
    let recurringExpense = await RecurringExpense.findOne({
      _id: req.params.id,
      user: req.user.id
    })

    if (!recurringExpense) {
      return res.status(404).json({
        success: false,
        error: 'Recurring expense not found'
      })
    }

    // If category is being updated, check if it exists and belongs to user
    if (req.body.category) {
      const categoryExists = await Category.findOne({
        _id: req.body.category,
        user: req.user.id
      })

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category'
        })
      }
    }

    // If frequency or startDate is being updated, recalculate nextDue
    if (req.body.frequency || req.body.startDate) {
      const frequency = req.body.frequency || recurringExpense.frequency
      const startDate = req.body.startDate || recurringExpense.startDate
      req.body.nextDue = calculateNextDue(new Date(startDate), frequency)
    }

    recurringExpense = await RecurringExpense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name color icon')

    res.status(200).json({
      success: true,
      data: recurringExpense
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Delete recurring expense
// @route   DELETE /api/recurring/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const recurringExpense = await RecurringExpense.findOne({
      _id: req.params.id,
      user: req.user.id
    })

    if (!recurringExpense) {
      return res.status(404).json({
        success: false,
        error: 'Recurring expense not found'
      })
    }

    await recurringExpense.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Recurring expense deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Process due recurring expenses (create actual expenses)
// @route   POST /api/recurring/process
// @access  Private
router.post('/process', async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all active recurring expenses that are due
    const dueRecurringExpenses = await RecurringExpense.find({
      user: req.user.id,
      isActive: true,
      nextDue: { $lte: today }
    }).populate('category')

    const processedExpenses = []

    for (const recurring of dueRecurringExpenses) {
      // Create the actual expense
      const expense = await Expense.create({
        title: recurring.title,
        amount: recurring.amount,
        category: recurring.category._id,
        date: recurring.nextDue,
        description: `${recurring.description} (Recurring)`,
        user: req.user.id
      })

      // Update the next due date
      const nextDue = calculateNextDue(recurring.nextDue, recurring.frequency)
      await RecurringExpense.findByIdAndUpdate(recurring._id, { 
        nextDue,
        lastProcessed: new Date()
      })

      processedExpenses.push({
        recurringId: recurring._id,
        expenseId: expense._id,
        title: expense.title,
        amount: expense.amount,
        nextDue
      })
    }

    res.status(200).json({
      success: true,
      count: processedExpenses.length,
      data: processedExpenses
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Manually process a specific recurring expense
// @route   POST /api/recurring/:id/process
// @access  Private
router.post('/:id/process', async (req, res, next) => {
  try {
    const recurringExpense = await RecurringExpense.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('category')

    if (!recurringExpense) {
      return res.status(404).json({
        success: false,
        error: 'Recurring expense not found'
      })
    }

    if (!recurringExpense.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot process inactive recurring expense'
      })
    }

    // Create the actual expense
    const expense = await Expense.create({
      title: recurringExpense.title,
      amount: recurringExpense.amount,
      category: recurringExpense.category._id,
      date: req.body.date || new Date(),
      description: `${recurringExpense.description} (Recurring)`,
      user: req.user.id
    })

    // Update the next due date
    const nextDue = calculateNextDue(
      new Date(req.body.date || new Date()),
      recurringExpense.frequency
    )
    
    await RecurringExpense.findByIdAndUpdate(recurringExpense._id, { 
      nextDue,
      lastProcessed: new Date()
    })

    await expense.populate('category', 'name color icon')

    res.status(201).json({
      success: true,
      data: {
        expense,
        nextDue
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Toggle recurring expense active status
// @route   PATCH /api/recurring/:id/toggle
// @access  Private
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const recurringExpense = await RecurringExpense.findOne({
      _id: req.params.id,
      user: req.user.id
    })

    if (!recurringExpense) {
      return res.status(404).json({
        success: false,
        error: 'Recurring expense not found'
      })
    }

    recurringExpense.isActive = !recurringExpense.isActive
    await recurringExpense.save()

    await recurringExpense.populate('category', 'name color icon')

    res.status(200).json({
      success: true,
      data: recurringExpense
    })
  } catch (error) {
    next(error)
  }
})

// Helper function to calculate next due date
function calculateNextDue(currentDate, frequency) {
  const nextDate = new Date(currentDate)
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    default:
      throw new Error('Invalid frequency')
  }
  
  return nextDate
}

module.exports = router
