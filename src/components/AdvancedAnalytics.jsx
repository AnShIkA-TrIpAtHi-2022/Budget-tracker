import { useState, useMemo } from 'react'
import { TrendingUp, Target, AlertTriangle, Calendar, DollarSign, PieChart, BarChart3, Activity, Zap, Clock, Repeat } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  subMonths, 
  subWeeks,
  eachMonthOfInterval,
  differenceInDays,
  parseISO,
  isWeekend
} from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  ArcElement
)

export default function AdvancedAnalytics() {
  const { expenses, categories, recurringExpenses } = useBudget()
  const [timeRange, setTimeRange] = useState('6months') // '3months', '6months', '1year', 'all'
  const [analysisType, setAnalysisType] = useState('spending') // 'spending', 'patterns', 'forecasts', 'insights'

  // Ensure we have arrays to work with
  const safeExpenses = Array.isArray(expenses) ? expenses : []
  const safeCategories = Array.isArray(categories) ? categories : []
  const safeRecurring = Array.isArray(recurringExpenses) ? recurringExpenses : []

  // Calculate date ranges
  const now = new Date()
  const timeRanges = {
    '3months': { start: subMonths(now, 3), end: now },
    '6months': { start: subMonths(now, 6), end: now },
    '1year': { start: subMonths(now, 12), end: now },
    'all': { start: new Date(2020, 0, 1), end: now }
  }

  const { start: rangeStart, end: rangeEnd } = timeRanges[timeRange]

  // Filter expenses by time range
  const filteredExpenses = safeExpenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate >= rangeStart && expenseDate <= rangeEnd
  })

  // Advanced Analytics Calculations
  const advancedAnalytics = useMemo(() => {
    // 1. Spending Velocity (rate of spending increase/decrease)
    const monthlyTotals = []
    const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd })
    
    months.forEach(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const monthExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= monthStart && expenseDate <= monthEnd
      })
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      monthlyTotals.push({ month, total, count: monthExpenses.length })
    })

    // Calculate velocity (month-over-month change)
    const velocity = monthlyTotals.slice(1).map((current, index) => {
      const previous = monthlyTotals[index]
      const change = previous.total > 0 ? ((current.total - previous.total) / previous.total) * 100 : 0
      return { month: current.month, change, currentTotal: current.total, previousTotal: previous.total }
    })

    // 2. Category Growth Analysis
    const categoryGrowth = {}
    safeCategories.forEach(category => {
      const categoryExpenses = filteredExpenses.filter(expense => expense.category?.name === category.name)
      const monthlyData = months.map(month => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        const monthCategoryExpenses = categoryExpenses.filter(expense => {
          const expenseDate = new Date(expense.date)
          return expenseDate >= monthStart && expenseDate <= monthEnd
        })
        return monthCategoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      })
      
      // Calculate average growth rate
      const growthRates = []
      for (let i = 1; i < monthlyData.length; i++) {
        if (monthlyData[i - 1] > 0) {
          growthRates.push(((monthlyData[i] - monthlyData[i - 1]) / monthlyData[i - 1]) * 100)
        }
      }
      
      categoryGrowth[category.name] = {
        averageGrowth: growthRates.length > 0 ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0,
        totalSpent: categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        monthlyData,
        color: category.color
      }
    })

    // 3. Spending Patterns Analysis
    const dayOfWeekSpending = Array(7).fill(0)
    const hourOfDaySpending = Array(24).fill(0)
    const weekdayVsWeekendSpending = { weekday: 0, weekend: 0 }

    filteredExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date)
      const dayOfWeek = expenseDate.getDay()
      const hour = expenseDate.getHours()
      
      dayOfWeekSpending[dayOfWeek] += expense.amount
      hourOfDaySpending[hour] += expense.amount
      
      if (isWeekend(expenseDate)) {
        weekdayVsWeekendSpending.weekend += expense.amount
      } else {
        weekdayVsWeekendSpending.weekday += expense.amount
      }
    })

    // 4. Expense Size Distribution
    const expenseSizeDistribution = {
      small: 0,    // < $25
      medium: 0,   // $25 - $100
      large: 0,    // $100 - $500
      xlarge: 0    // > $500
    }

    filteredExpenses.forEach(expense => {
      if (expense.amount < 25) expenseSizeDistribution.small++
      else if (expense.amount < 100) expenseSizeDistribution.medium++
      else if (expense.amount < 500) expenseSizeDistribution.large++
      else expenseSizeDistribution.xlarge++
    })

    // 5. Seasonal Analysis
    const seasonalSpending = { spring: 0, summer: 0, fall: 0, winter: 0 }
    filteredExpenses.forEach(expense => {
      const month = new Date(expense.date).getMonth()
      if (month >= 2 && month <= 4) seasonalSpending.spring += expense.amount
      else if (month >= 5 && month <= 7) seasonalSpending.summer += expense.amount
      else if (month >= 8 && month <= 10) seasonalSpending.fall += expense.amount
      else seasonalSpending.winter += expense.amount
    })

    // 6. Spending Efficiency Metrics
    const totalSpent = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const averageTransactionSize = totalSpent / filteredExpenses.length
    const spendingDays = new Set(filteredExpenses.map(expense => format(new Date(expense.date), 'yyyy-MM-dd'))).size
    const totalDays = differenceInDays(rangeEnd, rangeStart)
    const spendingFrequency = (spendingDays / totalDays) * 100

    return {
      monthlyTotals,
      velocity,
      categoryGrowth,
      dayOfWeekSpending,
      hourOfDaySpending,
      weekdayVsWeekendSpending,
      expenseSizeDistribution,
      seasonalSpending,
      totalSpent,
      averageTransactionSize,
      spendingFrequency,
      spendingDays,
      totalDays
    }
  }, [filteredExpenses, safeCategories, rangeStart, rangeEnd])

  // Spending Velocity Chart
  const velocityChartData = {
    labels: advancedAnalytics.velocity.map(v => format(v.month, 'MMM yyyy')),
    datasets: [
      {
        label: 'Spending Change (%)',
        data: advancedAnalytics.velocity.map(v => v.change),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: advancedAnalytics.velocity.map(v => v.change > 0 ? '#ef4444' : '#10b981'),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  }

  // Day of Week Spending Chart
  const dayOfWeekChartData = {
    labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    datasets: [
      {
        label: 'Spending by Day',
        data: advancedAnalytics.dayOfWeekSpending,
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  }

  // Category Growth Radar Chart
  const topGrowingCategories = Object.entries(advancedAnalytics.categoryGrowth)
    .sort(([,a], [,b]) => b.averageGrowth - a.averageGrowth)
    .slice(0, 6)

  const radarChartData = {
    labels: topGrowingCategories.map(([name]) => name),
    datasets: [
      {
        label: 'Growth Rate (%)',
        data: topGrowingCategories.map(([, data]) => Math.max(0, data.averageGrowth)),
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  }

  // Expense Size Distribution Chart
  const sizeDistributionData = {
    labels: ['Small (<$25)', 'Medium ($25-$100)', 'Large ($100-$500)', 'X-Large (>$500)'],
    datasets: [
      {
        data: Object.values(advancedAnalytics.expenseSizeDistribution),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 12 },
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        titleColor: document.documentElement.classList.contains('dark') ? '#f9fafb' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
      },
    },
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
        },
        pointLabels: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
      },
    },
  }

  // Calculate insights and recommendations
  const insights = useMemo(() => {
    const results = []

    // High spending velocity warning
    const recentVelocity = advancedAnalytics.velocity.slice(-2)
    if (recentVelocity.length > 0 && recentVelocity[recentVelocity.length - 1]?.change > 20) {
      results.push({
        type: 'warning',
        title: 'Spending Acceleration',
        description: `Your spending increased by ${recentVelocity[recentVelocity.length - 1].change.toFixed(1)}% last month`,
        icon: AlertTriangle,
        color: 'red'
      })
    }

    // Weekend vs Weekday spending pattern
    const weekendRatio = advancedAnalytics.weekdayVsWeekendSpending.weekend / 
      (advancedAnalytics.weekdayVsWeekendSpending.weekday + advancedAnalytics.weekdayVsWeekendSpending.weekend)
    if (weekendRatio > 0.4) {
      results.push({
        type: 'insight',
        title: 'Weekend Spending Pattern',
        description: `${(weekendRatio * 100).toFixed(1)}% of your spending happens on weekends`,
        icon: Calendar,
        color: 'blue'
      })
    }

    // Large transaction frequency
    const largeTransactionRatio = (advancedAnalytics.expenseSizeDistribution.large + 
      advancedAnalytics.expenseSizeDistribution.xlarge) / filteredExpenses.length
    if (largeTransactionRatio > 0.3) {
      results.push({
        type: 'insight',
        title: 'Large Transaction Pattern',
        description: `${(largeTransactionRatio * 100).toFixed(1)}% of your transactions are over $100`,
        icon: DollarSign,
        color: 'purple'
      })
    }

    // High frequency spending days
    if (advancedAnalytics.spendingFrequency > 80) {
      results.push({
        type: 'info',
        title: 'High Spending Frequency',
        description: `You spend money ${advancedAnalytics.spendingFrequency.toFixed(1)}% of days`,
        icon: Activity,
        color: 'green'
      })
    }

    // Category growth insights
    const fastestGrowingCategory = Object.entries(advancedAnalytics.categoryGrowth)
      .sort(([,a], [,b]) => b.averageGrowth - a.averageGrowth)[0]
    
    if (fastestGrowingCategory && fastestGrowingCategory[1].averageGrowth > 10) {
      results.push({
        type: 'insight',
        title: 'Fastest Growing Category',
        description: `${fastestGrowingCategory[0]} spending is growing ${fastestGrowingCategory[1].averageGrowth.toFixed(1)}% per month`,
        icon: TrendingUp,
        color: 'orange'
      })
    }

    return results
  }, [advancedAnalytics, filteredExpenses])

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Deep insights into your spending patterns and behaviors
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { id: '3months', label: '3M' },
                { id: '6months', label: '6M' },
                { id: '1year', label: '1Y' },
                { id: 'all', label: 'All' }
              ].map(range => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Analysis Type Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { id: 'spending', label: 'Spending', icon: DollarSign },
                { id: 'patterns', label: 'Patterns', icon: Activity },
                { id: 'insights', label: 'Insights', icon: Zap }
              ].map(type => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setAnalysisType(type.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      analysisType === type.id
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Analyzed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${advancedAnalytics.totalSpent.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredExpenses.length} transactions
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${advancedAnalytics.averageTransactionSize.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Per transaction
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Spending Frequency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {advancedAnalytics.spendingFrequency.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {advancedAnalytics.spendingDays} of {advancedAnalytics.totalDays} days
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekend Spending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {((advancedAnalytics.weekdayVsWeekendSpending.weekend / 
                  (advancedAnalytics.weekdayVsWeekendSpending.weekday + advancedAnalytics.weekdayVsWeekendSpending.weekend)) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Of total spending
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      {insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Insights & Recommendations
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon
              const colorClasses = {
                red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
                orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
              }
              
              return (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses[insight.color]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Velocity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Spending Velocity
            </h3>
          </div>
          <div className="h-80">
            {advancedAnalytics.velocity.length > 0 ? (
              <Line data={velocityChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  Not enough data for velocity analysis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Day of Week Spending */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Spending by Day of Week
            </h3>
          </div>
          <div className="h-80">
            <Bar data={dayOfWeekChartData} options={chartOptions} />
          </div>
        </div>

        {/* Category Growth Radar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Category Growth Rates
            </h3>
          </div>
          <div className="h-80">
            {topGrowingCategories.length > 0 ? (
              <Radar data={radarChartData} options={radarOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  Not enough category data
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Expense Size Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <PieChart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Transaction Size Distribution
            </h3>
          </div>
          <div className="h-80">
            <Doughnut 
              data={sizeDistributionData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    ...chartOptions.plugins.tooltip,
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: ${context.parsed} transactions (${percentage}%)`;
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
