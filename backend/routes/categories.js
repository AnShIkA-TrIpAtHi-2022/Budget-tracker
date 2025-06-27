const express = require('express')
const Category = require('../models/Category')
const Expense = require('../models/Expense')

const router = express.Router()

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .sort({ name: 1 })

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }

    res.status(200).json({
      success: true,
      data: category
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Create new category
// @route   POST /api/categories
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { name, color, icon } = req.body

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide category name'
      })
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    })

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      })
    }

    const category = await Category.create({
      name,
      color: color || '#3B82F6', // Default blue color
      icon: icon || 'folder'
    })

    res.status(201).json({
      success: true,
      data: category
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Public
router.put('/:id', async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }

    // If name is being updated, check for duplicates
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        user: req.user.id,
        _id: { $ne: req.params.id }
      })

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category with this name already exists'
        })
      }
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )

    res.status(200).json({
      success: true,
      data: category
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Public
router.delete('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }

    // Check if category is used by any expenses
    const expenseCount = await Expense.countDocuments({
      category: req.params.id
    })

    if (expenseCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It is used by ${expenseCount} expense(s). Please reassign or delete those expenses first.`
      })
    }

    await category.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get category statistics
// @route   GET /api/categories/:id/stats
// @access  Private
router.get('/:id/stats', async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }

    const { startDate, endDate } = req.query
    const filter = {
      category: req.params.id,
      user: req.user.id
    }

    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    const stats = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      }
    ])

    const result = stats.length > 0 ? stats[0] : {
      totalAmount: 0,
      expenseCount: 0,
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0
    }

    res.status(200).json({
      success: true,
      data: {
        category,
        stats: result
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Initialize default categories for new user
// @route   POST /api/categories/initialize
// @access  Private
router.post('/initialize', async (req, res, next) => {
  try {
    // Check if user already has categories
    const existingCategories = await Category.findOne({ user: req.user.id })
    
    if (existingCategories) {
      return res.status(400).json({
        success: false,
        error: 'User already has categories'
      })
    }

    const defaultCategories = [
      { name: 'Food & Dining', color: '#EF4444', icon: 'utensils' },
      { name: 'Transportation', color: '#F59E0B', icon: 'car' },
      { name: 'Shopping', color: '#8B5CF6', icon: 'shopping-bag' },
      { name: 'Entertainment', color: '#EC4899', icon: 'film' },
      { name: 'Bills & Utilities', color: '#10B981', icon: 'receipt' },
      { name: 'Healthcare', color: '#06B6D4', icon: 'heart' },
      { name: 'Education', color: '#3B82F6', icon: 'book' },
      { name: 'Travel', color: '#84CC16', icon: 'plane' },
      { name: 'Personal Care', color: '#F97316', icon: 'user' },
      { name: 'Other', color: '#6B7280', icon: 'more-horizontal' }
    ]

    const categories = await Category.insertMany(
      defaultCategories.map(cat => ({
        ...cat,
        user: req.user.id
      }))
    )

    res.status(201).json({
      success: true,
      count: categories.length,
      data: categories
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
