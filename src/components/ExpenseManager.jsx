import { useState } from 'react'
import { Plus, Edit, Trash2, Calendar, DollarSign, Tag, FileText } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { format } from 'date-fns'

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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.category) return

    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      createdAt: new Date().toISOString()
    }

    if (editingId) {
      updateExpense({ ...expenseData, id: editingId })
      setEditingId(null)
    } else {
      addExpense(expenseData)
    }

    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      remarks: ''
    })
  }

  const handleEdit = (expense) => {
    setFormData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category._id || expense.category,
      remarks: expense.remarks || ''
    })
    setEditingId(expense._id)
    setSelectedExpense(expense)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
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
    }
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c._id === categoryId)
    return category ? category.name : 'Unknown'
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c._id === categoryId)
    return category ? category.color : '#6b7280'
  }

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
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                required
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="h-4 w-4" />
                <span>Amount</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
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
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
                onClick={() => {
                  setEditingId(null)
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    categoryId: '',
                    remarks: ''
                  })
                }}
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Expenses</h3>
        
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No expenses yet. Add your first expense above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
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
