const express = require('express')
const Expense = require('../models/Expense')
const Category = require('../models/Category')
const RecurringExpense = require('../models/RecurringExpense')
const { auth } = require('../middleware/auth')

const router = express.Router()

// Apply auth middleware to all routes
router.use(auth)

// @desc    Get dashboard overview
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query
    const now = new Date()
    let startDate, endDate

    // Calculate date range based on period
    switch (period) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        endDate = now
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    const filter = {
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }

    // Get total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])

    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          total: 1,
          count: 1,
          name: '$category.name',
          color: '$category.color',
          icon: '$category.icon'
        }
      },
      { $sort: { total: -1 } }
    ])

    // Get recent expenses
    const recentExpenses = await Expense.find(filter)
      .populate('category', 'name color icon')
      .sort({ date: -1 })
      .limit(10)

    // Get upcoming recurring expenses
    const upcomingRecurring = await RecurringExpense.find({
      user: req.user.id,
      isActive: true,
      nextDue: { 
        $gte: now,
        $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
      }
    })
      .populate('category', 'name color icon')
      .sort({ nextDue: 1 })
      .limit(5)

    res.status(200).json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalAmount: totalExpenses[0]?.total || 0,
          totalCount: totalExpenses[0]?.count || 0,
          averagePerDay: totalExpenses[0] ? 
            (totalExpenses[0].total / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))) : 0
        },
        expensesByCategory,
        recentExpenses,
        upcomingRecurring
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get spending trends
// @route   GET /api/analytics/trends
// @access  Private
router.get('/trends', async (req, res, next) => {
  try {
    const { period = 'month', months = 12 } = req.query
    const now = new Date()
    const monthsNum = parseInt(months)

    const trends = []

    for (let i = monthsNum - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const result = await Expense.aggregate([
        {
          $match: {
            user: req.user.id,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])

      trends.push({
        period: date.toISOString().substring(0, 7), // YYYY-MM format
        month: date.toLocaleString('default', { month: 'long' }),
        year: date.getFullYear(),
        totalAmount: result[0]?.total || 0,
        totalCount: result[0]?.count || 0
      })
    }

    res.status(200).json({
      success: true,
      data: trends
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get category analysis
// @route   GET /api/analytics/categories
// @access  Private
router.get('/categories', async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query
    
    const filter = { user: req.user.id }
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    const categoryAnalysis = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          name: '$category.name',
          color: '$category.color',
          icon: '$category.icon',
          totalAmount: 1,
          count: 1,
          avgAmount: 1,
          minAmount: 1,
          maxAmount: 1
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: parseInt(limit) }
    ])

    // Calculate percentages
    const totalSpent = categoryAnalysis.reduce((sum, cat) => sum + cat.totalAmount, 0)
    const analysisWithPercentages = categoryAnalysis.map(cat => ({
      ...cat,
      percentage: totalSpent > 0 ? (cat.totalAmount / totalSpent * 100) : 0
    }))

    res.status(200).json({
      success: true,
      data: {
        categories: analysisWithPercentages,
        summary: {
          totalSpent,
          totalTransactions: categoryAnalysis.reduce((sum, cat) => sum + cat.count, 0),
          categoriesCount: categoryAnalysis.length
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get monthly comparison
// @route   GET /api/analytics/monthly-comparison
// @access  Private
router.get('/monthly-comparison', async (req, res, next) => {
  try {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Current month data
    const currentMonthData = await Expense.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: currentMonth, $lte: currentMonthEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          name: '$category.name',
          color: '$category.color',
          total: 1,
          count: 1
        }
      }
    ])

    // Last month data
    const lastMonthData = await Expense.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: lastMonth, $lte: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 1,
          name: '$category.name',
          color: '$category.color',
          total: 1,
          count: 1
        }
      }
    ])

    // Combine and calculate changes
    const allCategories = await Category.find({ user: req.user.id })
    const comparison = allCategories.map(cat => {
      const current = currentMonthData.find(c => c._id.toString() === cat._id.toString())
      const last = lastMonthData.find(c => c._id.toString() === cat._id.toString())
      
      const currentTotal = current?.total || 0
      const lastTotal = last?.total || 0
      const change = currentTotal - lastTotal
      const percentageChange = lastTotal > 0 ? (change / lastTotal * 100) : 0

      return {
        category: {
          _id: cat._id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon
        },
        currentMonth: {
          total: currentTotal,
          count: current?.count || 0
        },
        lastMonth: {
          total: lastTotal,
          count: last?.count || 0
        },
        change: {
          amount: change,
          percentage: percentageChange
        }
      }
    }).filter(comp => comp.currentMonth.total > 0 || comp.lastMonth.total > 0)

    const currentTotal = currentMonthData.reduce((sum, cat) => sum + cat.total, 0)
    const lastTotal = lastMonthData.reduce((sum, cat) => sum + cat.total, 0)

    res.status(200).json({
      success: true,
      data: {
        comparison,
        summary: {
          currentMonth: {
            total: currentTotal,
            period: currentMonth.toISOString().substring(0, 7)
          },
          lastMonth: {
            total: lastTotal,
            period: lastMonth.toISOString().substring(0, 7)
          },
          change: {
            amount: currentTotal - lastTotal,
            percentage: lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal * 100) : 0
          }
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get daily spending pattern
// @route   GET /api/analytics/daily-pattern
// @access  Private
router.get('/daily-pattern', async (req, res, next) => {
  try {
    const { days = 30 } = req.query
    const now = new Date()
    const startDate = new Date(now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000)

    const dailyData = await Expense.aggregate([
      {
        $match: {
          user: req.user.id,
          date: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])

    // Fill in missing days with zero values
    const dailyPattern = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= now) {
      const dateKey = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate()
      }

      const existingData = dailyData.find(d => 
        d._id.year === dateKey.year && 
        d._id.month === dateKey.month && 
        d._id.day === dateKey.day
      )

      dailyPattern.push({
        date: new Date(currentDate).toISOString().substring(0, 10),
        total: existingData?.total || 0,
        count: existingData?.count || 0,
        dayOfWeek: currentDate.getDay()
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    res.status(200).json({
      success: true,
      data: dailyPattern
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
