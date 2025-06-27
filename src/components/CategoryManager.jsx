import { useState } from 'react'
import { Plus, Edit, Trash2, Tag, Palette } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'

const colorOptions = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6', '#f59e0b'
]

export default function CategoryManager() {
  const { categories, expenses, addCategory, updateCategory, deleteCategory } = useBudget()
  const [formData, setFormData] = useState({
    name: '',
    color: colorOptions[0]
  })
  const [editingId, setEditingId] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingId) {
      updateCategory(editingId, formData)
      setEditingId(null)
    } else {
      addCategory(formData)
    }

    setFormData({ name: '', color: colorOptions[0] })
  }

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      color: category.color
    })
    setEditingId(category._id)
  }

  const handleDelete = (id) => {
    const expenseCount = expenses.filter(expense => 
      (expense.category?._id || expense.category) === id
    ).length
    const message = expenseCount > 0 
      ? `This category has ${expenseCount} expense(s). Deleting it will also delete all related expenses. Are you sure?`
      : 'Are you sure you want to delete this category?'
    
    if (window.confirm(message)) {
      deleteCategory(id)
      if (editingId === id) {
        setEditingId(null)
        setFormData({ name: '', color: colorOptions[0] })
      }
    }
  }

  const getCategoryExpenseCount = (categoryId) => {
    return expenses.filter(expense => 
      (expense.category?._id || expense.category) === categoryId
    ).length
  }

  const getCategoryTotal = (categoryId) => {
    return expenses
      .filter(expense => 
        (expense.category?._id || expense.category) === categoryId
      )
      .reduce((total, expense) => total + expense.amount, 0)
  }

  return (
    <div className="space-y-8">
      {/* Add/Edit Category Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="h-4 w-4" />
                <span>Category Name</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter category name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                required
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Palette className="h-4 w-4" />
                <span>Color</span>
              </label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: formData.color }}
                />
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        formData.color === color 
                          ? 'border-gray-600 dark:border-gray-300 scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>{editingId ? 'Update Category' : 'Add Category'}</span>
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setFormData({ name: '', color: colorOptions[0] })
                }}
                className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Categories</h3>
        
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No categories yet. Add your first category above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const expenseCount = getCategoryExpenseCount(category._id)
              const total = getCategoryTotal(category._id)
              
              return (
                <div
                  key={category._id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h4>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Expenses:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{expenseCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Total:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
