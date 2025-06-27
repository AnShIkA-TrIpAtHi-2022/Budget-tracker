const express = require('express')
const Expense = require('../models/Expense')
const Category = require('../models/Category')

const router = express.Router()

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query

    // Build filter object
    const filter = {}

    if (category) {
      filter.category = category
    }

    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    if (minAmount || maxAmount) {
      filter.amount = {}
      if (minAmount) filter.amount.$gte = parseFloat(minAmount)
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount)
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    const expenses = await Expense.find(filter)
      .populate('category', 'name color')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    const total = await Expense.countDocuments(filter)

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: expenses
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('category', 'name color')

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      })
    }

    res.status(200).json({
      success: true,
      data: expense
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { title, amount, category, date, description } = req.body

    // Validation
    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, amount, and category'
      })
    }

    // Check if category exists
    const categoryExists = await Category.findById(category)

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category'
      })
    }

    const expense = await Expense.create({
      ...req.body
    })

    await expense.populate('category', 'name color')

    res.status(201).json({
      success: true,
      data: expense
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Public
router.put('/:id', async (req, res, next) => {
  try {
    let expense = await Expense.findById(req.params.id)

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
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

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name color')

    res.status(200).json({
      success: true,
      data: expense
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Public
router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      })
    }

    await expense.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Delete multiple expenses
// @route   DELETE /api/expenses
// @access  Private
router.delete('/', async (req, res, next) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of expense IDs'
      })
    }

    const result = await Expense.deleteMany({
      _id: { $in: ids },
      user: req.user.id
    })

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} expenses deleted successfully`
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
