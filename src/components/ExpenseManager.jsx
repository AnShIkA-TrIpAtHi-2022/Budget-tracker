import { useState } from 'react'
import { Plus, Edit, Trash2, Calendar, DollarSign, Tag, FileText, Filter } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function ExpenseManager() {
  const { expenses, categories, addExpense, updateExpense, deleteExpense } = useBudget()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    remarks: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState('all')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.category) return

    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      createdAt: new Date().toISOString()
    }

    console.log('📝 ExpenseManager: Form submitted with data:', expenseData)
    console.log('📝 ExpenseManager: Edit mode:', !!editingId, 'ID:', editingId)

    if (editingId) {
      console.log('✏️ ExpenseManager: Calling updateExpense with:', { ...expenseData, id: editingId })
      updateExpense({ ...expenseData, id: editingId })
      setEditingId(null)
      // Reset form completely after editing
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        remarks: ''
      })
    } else {
      console.log('➕ ExpenseManager: Calling addExpense with:', expenseData)
      addExpense(expenseData)
      // Keep the same date when adding multiple expenses
      setFormData({
        date: formData.date, // Keep the current date
        amount: '',
        category: '',
        remarks: ''
      })
    }
  }

  const handleEdit = (expense) => {
    console.log('✏️ ExpenseManager: Editing expense:', expense)
    
    setFormData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category._id || expense.category,
      remarks: expense.remarks || ''
    })
    setEditingId(expense._id)
    setSelectedExpense(expense)
    
    console.log('✏️ ExpenseManager: Form data set for editing:', {
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category._id || expense.category,
      remarks: expense.remarks || ''
    })
  }

  const handleDelete = (id) => {
    console.log('🗑️ ExpenseManager: Delete requested for expense ID:', id)
    
    if (window.confirm('Are you sure you want to delete this expense?')) {
      console.log('🗑️ ExpenseManager: Calling deleteExpense with ID:', id)
      deleteExpense(id)
      
      if (editingId === id) {
        setEditingId(null)
        setFormData({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          category: '',
          remarks: ''
        })
      }
    } else {
      console.log('🗑️ ExpenseManager: Delete cancelled by user')
    }
  }

  const handleCancelEdit = () => {
    console.log('❌ ExpenseManager: Cancelling edit mode')
    setEditingId(null)
    setSelectedExpense(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      remarks: ''
    })
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c._id === categoryId)
    return category ? category.name : 'Unknown'
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c._id === categoryId)
    return category ? category.color : '#6b7280'
  }

  // Filter expenses based on selected month
  const getFilteredExpenses = () => {
    if (selectedMonth === 'all') {
      return expenses
    }
    
    const [year, month] = selectedMonth.split('-')
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(new Date(year, month - 1))
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= monthStart && expenseDate <= monthEnd
    })
  }

  // Get unique months from expenses for filter dropdown
  const getAvailableMonths = () => {
    const months = new Set()
    expenses.forEach(expense => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.add(monthKey)
    })
    return Array.from(months).sort().reverse()
  }

  const filteredExpenses = getFilteredExpenses()
  const availableMonths = getAvailableMonths()

  return (
    <div className="space-y-8">
      {/* Add/Edit Expense Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          {!editingId && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              💡 Tip: Date will be preserved when adding multiple expenses
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Date</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    console.log('📅 ExpenseManager: Date changed to:', e.target.value)
                    setFormData({ ...formData, date: e.target.value })
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setFormData({ ...formData, date: today })
                  }}
                  className="px-3 py-3 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  title="Set to today"
                >
                  Today
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="h-4 w-4" />
                <span>Amount</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => {
                  console.log('💰 ExpenseManager: Amount changed to:', e.target.value)
                  setFormData({ ...formData, amount: e.target.value })
                }}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                required
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="h-4 w-4" />
                <span>Category</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  console.log('🏷️ ExpenseManager: Category changed to:', e.target.value)
                  setFormData({ ...formData, category: e.target.value })
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                required
              >
                <option value="">Select category</option>
                {Array.isArray(categories) && categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="h-4 w-4" />
                <span>Remarks</span>
              </label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => {
                  console.log('📝 ExpenseManager: Remarks changed to:', e.target.value)
                  setFormData({ ...formData, remarks: e.target.value })
                }}
                placeholder="Optional remarks"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>{editingId ? 'Update Expense' : 'Add Expense'}</span>
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Expenses</h3>
          
          <div className="flex items-center space-x-4">
            {expenses.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedMonth === 'all' ? `${expenses.length} total` : `${filteredExpenses.length} in ${format(new Date(selectedMonth + '-01'), 'MMM yyyy')}`}
              </span>
            )}
            
            {availableMonths.length > 0 && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Months</option>
                  {availableMonths.map(month => {
                    const [year, monthNum] = month.split('-')
                    const monthName = format(new Date(year, monthNum - 1), 'MMM yyyy')
                    return (
                      <option key={month} value={month}>{monthName}</option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>
        </div>
        
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {selectedMonth === 'all' ? 'No expenses yet. Add your first expense above!' : 'No expenses found for the selected month.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(expense.category?._id || expense.category) }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${expense.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getCategoryName(expense.category?._id || expense.category)} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </p>
                      {expense.remarks && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {expense.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense._id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
