import { useState, useMemo } from 'react'
import { Calendar, DollarSign, TrendingUp, TrendingDown, BarChart3, ChevronLeft, ChevronRight, Clock, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, isToday, isYesterday } from 'date-fns'
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
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DayWiseAnalytics() {
  const { expenses, categories } = useBudget()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('daily') // 'daily', 'comparison', 'heatmap'

  // Ensure we have arrays to work with
  const safeExpenses = Array.isArray(expenses) ? expenses : []
  const safeCategories = Array.isArray(categories) ? categories : []

  // Get selected month data
  const selectedMonth = selectedDate.getMonth()
  const selectedYear = selectedDate.getFullYear()
  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1))
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1))

  // Generate all days in the selected month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Day-wise expense data for selected month
  const dayWiseData = useMemo(() => {
    const dailyExpenses = {}
    
    // Initialize all days with 0
    daysInMonth.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      dailyExpenses[dayKey] = {
        date: day,
        total: 0,
        expenses: [],
        categories: {}
      }
    })

    // Populate with actual expenses
    safeExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date)
      if (expenseDate >= monthStart && expenseDate <= monthEnd) {
        const dayKey = format(expenseDate, 'yyyy-MM-dd')
        if (dailyExpenses[dayKey]) {
          dailyExpenses[dayKey].total += expense.amount
          dailyExpenses[dayKey].expenses.push(expense)
          
          // Category breakdown
          const categoryName = expense.category?.name || 'Uncategorized'
          if (!dailyExpenses[dayKey].categories[categoryName]) {
            dailyExpenses[dayKey].categories[categoryName] = {
              total: 0,
              count: 0,
              color: expense.category?.color || '#6b7280'
            }
          }
          dailyExpenses[dayKey].categories[categoryName].total += expense.amount
          dailyExpenses[dayKey].categories[categoryName].count += 1
        }
      }
    })

    return dailyExpenses
  }, [safeExpenses, daysInMonth, monthStart, monthEnd])

  // Calculate statistics
  const monthStats = useMemo(() => {
    const dailyTotals = Object.values(dayWiseData).map(day => day.total)
    const nonZeroDays = dailyTotals.filter(total => total > 0)
    
    return {
      totalExpenses: dailyTotals.reduce((sum, total) => sum + total, 0),
      averageDaily: nonZeroDays.length > 0 ? nonZeroDays.reduce((sum, total) => sum + total, 0) / nonZeroDays.length : 0,
      highestDay: Math.max(...dailyTotals),
      lowestDay: Math.min(...nonZeroDays),
      spendingDays: nonZeroDays.length,
      totalDays: daysInMonth.length,
      spendingRate: (nonZeroDays.length / daysInMonth.length) * 100
    }
  }, [dayWiseData, daysInMonth])

  // Previous month comparison
  const previousMonthStats = useMemo(() => {
    const prevMonth = subMonths(selectedDate, 1)
    const prevMonthStart = startOfMonth(prevMonth)
    const prevMonthEnd = endOfMonth(prevMonth)
    
    const prevMonthExpenses = safeExpenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= prevMonthStart && expenseDate <= prevMonthEnd
    })
    
    return {
      totalExpenses: prevMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      count: prevMonthExpenses.length
    }
  }, [safeExpenses, selectedDate])

  // Chart data for daily expenses
  const dailyChartData = useMemo(() => {
    const labels = daysInMonth.map(day => format(day, 'dd'))
    const data = daysInMonth.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      return dayWiseData[dayKey]?.total || 0
    })

    return {
      labels,
      datasets: [
        {
          label: 'Daily Expenses',
          data,
          backgroundColor: data.map(value => 
            value > monthStats.averageDaily ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'
          ),
          borderColor: data.map(value => 
            value > monthStats.averageDaily ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 1)'
          ),
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    }
  }, [daysInMonth, dayWiseData, monthStats.averageDaily])

  // Spending trend chart
  const trendChartData = useMemo(() => {
    const labels = daysInMonth.map(day => format(day, 'dd'))
    const cumulativeData = []
    let cumulative = 0
    
    daysInMonth.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      cumulative += dayWiseData[dayKey]?.total || 0
      cumulativeData.push(cumulative)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Cumulative Spending',
          data: cumulativeData,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    }
  }, [daysInMonth, dayWiseData])

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
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
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
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        },
      },
    },
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setSelectedDate(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setSelectedDate(newDate)
  }

  const goToCurrentMonth = () => {
    setSelectedDate(new Date())
  }

  // Calculate percentage change from previous month
  const percentageChange = previousMonthStats.totalExpenses > 0 
    ? ((monthStats.totalExpenses - previousMonthStats.totalExpenses) / previousMonthStats.totalExpenses) * 100
    : 0

  // Get highest and lowest spending days
  const sortedDays = Object.entries(dayWiseData)
    .filter(([_, data]) => data.total > 0)
    .sort(([_, a], [__, b]) => b.total - a.total)

  const highestSpendingDay = sortedDays[0]
  const lowestSpendingDay = sortedDays[sortedDays.length - 1]

  return (
    <div className="space-y-8">
      {/* Header with Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Day-wise Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Detailed daily spending analysis and insights
            </p>
          </div>
          
          <div className="flex items-center justify-between lg:justify-end gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { id: 'daily', label: 'Daily', icon: BarChart3 },
                { id: 'comparison', label: 'Compare', icon: TrendingUp },
                { id: 'heatmap', label: 'Heatmap', icon: Calendar }
              ].map(mode => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === mode.id
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Month Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex items-center space-x-2 min-w-[160px] justify-center">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  {format(selectedDate, 'MMMM yyyy')}
                </span>
              </div>
              
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <button
              onClick={goToCurrentMonth}
              className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors"
            >
              Current
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${monthStats.totalExpenses.toFixed(2)}
              </p>
              <div className="flex items-center mt-2 space-x-1">
                {percentageChange !== 0 && (
                  <>
                    {percentageChange > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    )}
                    <span className={`text-sm ${percentageChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {Math.abs(percentageChange).toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${monthStats.averageDaily.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {monthStats.spendingDays} spending days
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Highest Day</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${monthStats.highestDay.toFixed(2)}
              </p>
              {highestSpendingDay && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {format(new Date(highestSpendingDay[0]), 'MMM dd')}
                </p>
              )}
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Spending Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthStats.spendingRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {monthStats.spendingDays}/{monthStats.totalDays} days
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Expenses Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Expenses
            </h3>
          </div>
          <div className="h-80">
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Cumulative Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cumulative Spending
            </h3>
          </div>
          <div className="h-80">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daily Breakdown
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Transactions</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Top Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(dayWiseData)
                .filter(([_, data]) => data.total > 0)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .slice(0, 10)
                .map(([dateKey, data]) => {
                  const topCategory = Object.entries(data.categories)
                    .sort(([, a], [, b]) => b.total - a.total)[0]
                  
                  return (
                    <tr key={dateKey} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(data.date, 'MMM dd, yyyy')}
                          </span>
                          {isToday(data.date) && (
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                              Today
                            </span>
                          )}
                          {isYesterday(data.date) && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-full">
                              Yesterday
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(data.date, 'EEEE')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${data.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {data.expenses.length}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {topCategory && (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: topCategory[1].color }}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {topCategory[0]} (${topCategory[1].total.toFixed(2)})
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
