import { useMemo, useState } from 'react'
import { PieChart, BarChart3, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

export default function Analytics() {
  const { expenses, categories } = useBudget()

  // State for selected month/year
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Ensure we have arrays to work with
  const safeExpenses = Array.isArray(expenses) ? expenses : []
  const safeCategories = Array.isArray(categories) ? categories : []

  console.log('📊 Analytics: Safe expenses:', safeExpenses.length)
  console.log('📊 Analytics: Safe categories:', safeCategories.length)
  console.log('📊 Analytics: All expenses dates:', safeExpenses.map(e => e.date))
  console.log('📊 Analytics: All expenses full data:', safeExpenses)

  // Get selected month expenses
  const selectedMonth = selectedDate.getMonth()
  const selectedYear = selectedDate.getFullYear()
  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1))
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1))
  
  console.log('📅 Analytics: Selected date:', selectedDate)
  console.log('📅 Analytics: Month start:', monthStart)
  console.log('📅 Analytics: Month end:', monthEnd)
  
  const selectedMonthExpenses = safeExpenses.filter(expense => {
    // Parse the expense date and normalize to local timezone
    const expenseDate = new Date(expense.date)
    const expenseYear = expenseDate.getFullYear()
    const expenseMonth = expenseDate.getMonth()
    
    // Compare year and month directly to avoid timezone issues
    const isInSelectedMonth = expenseYear === selectedYear && expenseMonth === selectedMonth
    
    // Only log if we're in May for debugging
    if (selectedMonth === 4) { // May is month 4 (0-indexed)
      console.log('📅 Analytics: May expense check:', {
        expenseDate: expense.date,
        expenseYear,
        expenseMonth,
        selectedYear,
        selectedMonth,
        isInSelectedMonth
      })
    }
    
    return isInSelectedMonth
  })

  console.log('📊 Analytics: Selected month expenses:', selectedMonthExpenses.length, 'for', format(selectedDate, 'MMMM yyyy'))
  console.log('📊 Analytics: Selected month expenses data:', selectedMonthExpenses)

  // Get current week expenses (treating today as the last day of the week)
  const today = new Date()
  const weekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6, 0, 0, 0, 0)
  
  console.log('📅 Analytics: Custom week start:', weekStart)
  console.log('📅 Analytics: Custom week end (today):', weekEnd)
  
  const currentWeekExpenses = safeExpenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate >= weekStart && expenseDate <= weekEnd
  })

  // Category-wise data for pie chart
  const categoryData = useMemo(() => {
    console.log('📊 Analytics: Processing category data...')
    console.log('📊 Analytics: Selected month expenses:', selectedMonthExpenses)
    console.log('📊 Analytics: Available categories:', safeCategories)
    
    const categoryTotals = {}
    selectedMonthExpenses.forEach(expense => {
      // expense.category is populated with {_id, name, color} by the backend
      const category = expense.category
      if (category && category.name) {
        categoryTotals[category.name] = (categoryTotals[category.name] || 0) + expense.amount
      } else {
        console.log('📊 Analytics: Category not found or not populated for expense:', expense)
      }
    })

    console.log('📊 Analytics: Category totals:', categoryTotals)

    const labels = Object.keys(categoryTotals)
    const data = Object.values(categoryTotals)
    const colors = labels.map(label => {
      // Find the category by name since expenses have populated category objects
      const categoryFromExpense = selectedMonthExpenses.find(e => e.category?.name === label)?.category
      return categoryFromExpense ? categoryFromExpense.color : '#6b7280'
    })

    const result = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
          borderWidth: 2,
        },
      ],
    }
    
    console.log('📊 Analytics: Final category chart data:', result)
    return result
  }, [selectedMonthExpenses])

  // Daily expenses for bar chart (this week with today as last day)
  const dailyData = useMemo(() => {
    // Create array of 7 days ending with today
    const days = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      days.push(day)
    }
    
    console.log('📊 Analytics: Week days (today as last):', days.map(d => format(d, 'yyyy-MM-dd')))
    
    const dailyTotals = days.map(day => {
      const dayExpenses = currentWeekExpenses.filter(expense => 
        format(new Date(expense.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      )
      const total = dayExpenses.reduce((total, expense) => total + expense.amount, 0)
      console.log(`📊 Analytics: ${format(day, 'EEE yyyy-MM-dd')}: $${total}`)
      return total
    })

    return {
      labels: days.map(day => format(day, 'EEE')),
      datasets: [
        {
          label: 'Daily Expenses',
          data: dailyTotals,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    }
  }, [currentWeekExpenses, today])

  // Monthly trend (last 6 months)
  const monthlyTrendData = useMemo(() => {
    const months = []
    const monthlyTotals = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      
      const monthExpenses = safeExpenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= monthStart && expenseDate <= monthEnd
      })
      
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      
      months.push(format(date, 'MMM'))
      monthlyTotals.push(total)
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Monthly Expenses',
          data: monthlyTotals,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    }
  }, [safeExpenses])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
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
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        },
      },
    },
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
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
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
          }
        }
      },
    },
  }

  const totalExpenses = selectedMonthExpenses.reduce((total, expense) => total + expense.amount, 0)
  const weeklyTotal = currentWeekExpenses.reduce((total, expense) => total + expense.amount, 0)

  // Helper functions for month navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() - 1)
    console.log('⬅️ Analytics: Going to previous month:', format(newDate, 'MMMM yyyy'))
    setSelectedDate(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + 1)
    console.log('➡️ Analytics: Going to next month:', format(newDate, 'MMMM yyyy'))
    setSelectedDate(newDate)
  }

  const goToCurrentMonth = () => {
    const newDate = new Date()
    console.log('🏠 Analytics: Going to current month:', format(newDate, 'MMMM yyyy'))
    setSelectedDate(newDate)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      goToPreviousMonth()
    } else if (e.key === 'ArrowRight') {
      goToNextMonth()
    } else if (e.key === 'Home') {
      goToCurrentMonth()
    }
  }

  return (
    <div className="space-y-8" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Month Selector */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h2>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Previous month (←)"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-medium text-gray-900 dark:text-white min-w-[140px] text-center">
                {format(selectedDate, 'MMMM yyyy')}
              </span>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Next month (→)"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={goToCurrentMonth}
              className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors"
              title="Go to current month (Home)"
            >
              Current Month
            </button>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          Use ← → arrow keys to navigate months, Home key for current month
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalExpenses.toFixed(2)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMonthExpenses.length} expenses</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last 7 Days</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${weeklyTotal.toFixed(2)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{currentWeekExpenses.length} expenses</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Average</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${currentWeekExpenses.length > 0 ? (weeklyTotal / 7).toFixed(2) : '0.00'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart - Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <PieChart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Category Distribution ({format(selectedDate, 'MMM yyyy')})
            </h3>
          </div>
          <div className="h-80">
            {categoryData.labels.length > 0 ? (
              <Pie data={categoryData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  No expenses in {format(selectedDate, 'MMMM yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart - Daily Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Expenses (Last 7 Days)
            </h3>
          </div>
          <div className="h-80">
            <Bar data={dailyData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Line Chart - Monthly Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Trend (Last 6 Months)
          </h3>
        </div>
        <div className="h-80">
          <Line data={monthlyTrendData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}
