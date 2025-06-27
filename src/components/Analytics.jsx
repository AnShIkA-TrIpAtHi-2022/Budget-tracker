import { useMemo } from 'react'
import { PieChart, BarChart3, TrendingUp, Calendar } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
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
  LineElement
)

export default function Analytics() {
  const { expenses, categories } = useBudget()

  // Get current month expenses
  const currentMonth = new Date()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate >= monthStart && expenseDate <= monthEnd
  })

  // Get current week expenses
  const weekStart = startOfWeek(new Date())
  const weekEnd = endOfWeek(new Date())
  
  const currentWeekExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate >= weekStart && expenseDate <= weekEnd
  })

  // Category-wise data for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals = {}
    currentMonthExpenses.forEach(expense => {
      const category = categories.find(c => c.id === expense.categoryId)
      if (category) {
        categoryTotals[category.name] = (categoryTotals[category.name] || 0) + expense.amount
      }
    })

    const labels = Object.keys(categoryTotals)
    const data = Object.values(categoryTotals)
    const colors = labels.map(label => {
      const category = categories.find(c => c.name === label)
      return category ? category.color : '#6b7280'
    })

    return {
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
  }, [currentMonthExpenses, categories])

  // Daily expenses for bar chart (current week)
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const dailyTotals = days.map(day => {
      const dayExpenses = currentWeekExpenses.filter(expense => 
        format(new Date(expense.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      )
      return dayExpenses.reduce((total, expense) => total + expense.amount, 0)
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
  }, [currentWeekExpenses, weekStart, weekEnd])

  // Monthly trend (last 6 months)
  const monthlyTrendData = useMemo(() => {
    const months = []
    const monthlyTotals = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      
      const monthExpenses = expenses.filter(expense => {
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
  }, [expenses])

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

  const totalExpenses = currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0)
  const weeklyTotal = currentWeekExpenses.reduce((total, expense) => total + expense.amount, 0)

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalExpenses.toFixed(2)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{currentMonthExpenses.length} expenses</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</h3>
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
              Category Distribution (This Month)
            </h3>
          </div>
          <div className="h-80">
            {categoryData.labels.length > 0 ? (
              <Pie data={categoryData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No expenses this month</p>
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
              Daily Expenses (This Week)
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
