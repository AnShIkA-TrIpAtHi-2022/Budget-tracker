import { useState } from 'react'
import { Plus, Edit, Trash2, Calendar, DollarSign, ToggleLeft, ToggleRight, Clock } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { format, addMonths } from 'date-fns'

export default function RecurringManager() {
  const { recurringExpenses, addRecurring, updateRecurring, deleteRecurring } = useBudget()
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    cycle: 'monthly',
    active: true,
    nextDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  })
  const [editingId, setEditingId] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.amount) return

    const recurringData = {
      ...formData,
      amount: parseFloat(formData.amount)
    }

    if (editingId) {
      updateRecurring({ ...recurringData, id: editingId })
      setEditingId(null)
    } else {
      addRecurring(recurringData)
    }

    setFormData({
      name: '',
      amount: '',
      cycle: 'monthly',
      active: true,
      nextDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
    })
  }

  const handleEdit = (recurring) => {
    setFormData({
      name: recurring.name,
      amount: recurring.amount.toString(),
      cycle: recurring.cycle,
      active: recurring.active,
      nextDate: recurring.nextDate
    })
    setEditingId(recurring.id)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this recurring expense?')) {
      deleteRecurring(id)
      if (editingId === id) {
        setEditingId(null)
        setFormData({
          name: '',
          amount: '',
          cycle: 'monthly',
          active: true,
          nextDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
        })
      }
    }
  }

  const toggleActive = (recurring) => {
    updateRecurring({ ...recurring, active: !recurring.active })
  }

  const getNextDueText = (nextDate) => {
    const date = new Date(nextDate)
    const today = new Date()
    const diffTime = date - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${diffDays} days`
    }
  }

  return (
    <div className="space-y-8">
      {/* Add/Edit Recurring Expense Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Edit className="h-4 w-4" />
                <span>Name</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monthly Rent"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                required
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="h-4 w-4" />
                <span>Cycle</span>
              </label>
              <select
                value={formData.cycle}
                onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Next Due Date</span>
              </label>
              <input
                type="date"
                value={formData.nextDate}
                onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Active</span>
            </label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                formData.active 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {formData.active ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              <span>{formData.active ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
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
                    name: '',
                    amount: '',
                    cycle: 'monthly',
                    active: true,
                    nextDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
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

      {/* Recurring Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recurring Expenses</h3>
        
        {recurringExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No recurring expenses yet. Add your first one above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recurringExpenses.map((recurring) => (
              <div
                key={recurring.id}
                className={`p-4 rounded-lg border transition-colors ${
                  recurring.active
                    ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {recurring.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        recurring.active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {recurring.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">${recurring.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Cycle:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{recurring.cycle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Next:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {getNextDueText(recurring.nextDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleActive(recurring)}
                      className={`p-2 rounded-lg transition-colors ${
                        recurring.active
                          ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {recurring.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(recurring)}
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(recurring.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
