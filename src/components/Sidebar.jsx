import { useBudget } from '../context/BudgetContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { DollarSign, TrendingUp, Calendar, Target } from 'lucide-react'

export default function Sidebar() {
  const { expenses, categories, monthlyBudget } = useBudget()

  // Get current month data
  const currentMonth = new Date()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate >= monthStart && expenseDate <= monthEnd
  })

  const totalExpenses = currentMonthExpenses.reduce((total, expense) => total + expense.amount, 0)
  const budgetUsed = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0
  
  // Calculate no-expense days this month
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const expenseDays = new Set(currentMonthExpenses.map(expense => 
    new Date(expense.date).getDate()
  ))
  const noExpenseDays = daysInMonth - expenseDays.size

  // Get recent expenses
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c._id === categoryId)
    return category ? category.name : 'Unknown'
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c._id === categoryId)
    return category ? category.color : '#6b7280'
  }

  return (
    <div className="space-y-6">
      {/* Progress Tracker */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</span>
            <span className="font-semibold text-gray-900 dark:text-white">${totalExpenses.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Budget</span>
            <span className="font-semibold text-gray-900 dark:text-white">${monthlyBudget.toFixed(2)}</span>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Budget Used</span>
              <span className={`font-semibold ${budgetUsed > 100 ? 'text-red-600 dark:text-red-400' : budgetUsed > 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {budgetUsed.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetUsed > 100 ? 'bg-red-500' : budgetUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">No-Expense Days</span>
            <span className="font-semibold text-gray-900 dark:text-white">{noExpenseDays}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Transactions</span>
            <span className="font-semibold text-gray-900 dark:text-white">{currentMonthExpenses.length}</span>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
        </div>
        
        {recentExpenses.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No expenses yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start tracking your expenses!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div
                key={expense._id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(expense.category?._id || expense.category) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    ${expense.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {getCategoryName(expense.category?._id || expense.category)}
                  </p>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {format(new Date(expense.date), 'MMM dd')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Stats</h3>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Categories Used</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Set(currentMonthExpenses.map(e => e.category?._id || e.category)).size} / {categories.length}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Avg per Transaction</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${currentMonthExpenses.length > 0 ? (totalExpenses / currentMonthExpenses.length).toFixed(2) : '0.00'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Days with Expenses</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {expenseDays.size} / {daysInMonth}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
