import { useState } from 'react'
import { Download, FileText, Calendar, Filter } from 'lucide-react'
import { useBudget } from '../context/BudgetContext'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import jsPDF from 'jspdf'

export default function ExportManager() {
  const { expenses, categories, recurringExpenses, monthlyBudget } = useBudget()
  const [exportOptions, setExportOptions] = useState({
    period: 'month',
    includeCharts: true,
    includeRecurring: true,
    includeCategoryBreakdown: true
  })
  const [isExporting, setIsExporting] = useState(false)

  const getExpensesForPeriod = () => {
    const now = new Date()
    let start, end

    switch (exportOptions.period) {
      case 'week':
        start = new Date(now.setDate(now.getDate() - now.getDay()))
        end = new Date(now.setDate(start.getDate() + 6))
        break
      case 'month':
        start = startOfMonth(new Date())
        end = endOfMonth(new Date())
        break
      case 'year':
        start = startOfYear(new Date())
        end = endOfYear(new Date())
        break
      default:
        start = startOfMonth(new Date())
        end = endOfMonth(new Date())
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= start && expenseDate <= end
    })
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : 'Unknown'
  }

  const generatePDF = async () => {
    setIsExporting(true)
    
    try {
      const doc = new jsPDF()
      const filteredExpenses = getExpensesForPeriod()
      const periodText = exportOptions.period.charAt(0).toUpperCase() + exportOptions.period.slice(1)
      
      // Header
      doc.setFontSize(20)
      doc.setTextColor(34, 82, 246) // Blue color
      doc.text('Budget Tracker Report', 20, 30)
      
      doc.setFontSize(12)
      doc.setTextColor(107, 114, 128) // Gray color
      doc.text(`${periodText} Report - Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 40)
      
      let yPosition = 60

      // Summary Section
      doc.setFontSize(16)
      doc.setTextColor(17, 24, 39) // Dark gray
      doc.text('Summary', 20, yPosition)
      yPosition += 20

      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const budgetUsed = monthlyBudget > 0 ? ((totalExpenses / monthlyBudget) * 100).toFixed(1) : 0
      
      doc.setFontSize(11)
      doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 30, yPosition)
      yPosition += 10
      doc.text(`Number of Transactions: ${filteredExpenses.length}`, 30, yPosition)
      yPosition += 10
      if (exportOptions.period === 'month') {
        doc.text(`Monthly Budget: $${monthlyBudget.toFixed(2)}`, 30, yPosition)
        yPosition += 10
        doc.text(`Budget Utilization: ${budgetUsed}%`, 30, yPosition)
        yPosition += 15
      }

      // Category Breakdown
      if (exportOptions.includeCategoryBreakdown && filteredExpenses.length > 0) {
        doc.setFontSize(16)
        doc.text('Category Breakdown', 20, yPosition)
        yPosition += 20

        const categoryTotals = {}
        filteredExpenses.forEach(expense => {
          const categoryName = getCategoryName(expense.categoryId)
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.amount
        })

        doc.setFontSize(11)
        Object.entries(categoryTotals)
          .sort(([,a], [,b]) => b - a)
          .forEach(([category, amount]) => {
            const percentage = ((amount / totalExpenses) * 100).toFixed(1)
            doc.text(`${category}: $${amount.toFixed(2)} (${percentage}%)`, 30, yPosition)
            yPosition += 10
          })
        
        yPosition += 10
      }

      // Recurring Expenses
      if (exportOptions.includeRecurring && recurringExpenses.length > 0) {
        doc.setFontSize(16)
        doc.text('Recurring Expenses', 20, yPosition)
        yPosition += 20

        doc.setFontSize(11)
        recurringExpenses.forEach(recurring => {
          const status = recurring.active ? 'Active' : 'Inactive'
          doc.text(`${recurring.name}: $${recurring.amount.toFixed(2)} (${recurring.cycle}, ${status})`, 30, yPosition)
          yPosition += 10
        })
        
        yPosition += 10
      }

      // Detailed Expenses List
      if (filteredExpenses.length > 0) {
        // Check if we need a new page
        if (yPosition > 240) {
          doc.addPage()
          yPosition = 30
        }

        doc.setFontSize(16)
        doc.text('Detailed Expenses', 20, yPosition)
        yPosition += 20

        // Table headers
        doc.setFontSize(10)
        doc.setFont(undefined, 'bold')
        doc.text('Date', 20, yPosition)
        doc.text('Category', 60, yPosition)
        doc.text('Amount', 110, yPosition)
        doc.text('Remarks', 150, yPosition)
        yPosition += 5
        
        // Draw line under headers
        doc.line(20, yPosition, 190, yPosition)
        yPosition += 10

        // Table rows
        doc.setFont(undefined, 'normal')
        filteredExpenses
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach(expense => {
            // Check if we need a new page
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 30
            }

            doc.text(format(new Date(expense.date), 'MM/dd/yyyy'), 20, yPosition)
            doc.text(getCategoryName(expense.categoryId), 60, yPosition)
            doc.text(`$${expense.amount.toFixed(2)}`, 110, yPosition)
            doc.text(expense.remarks || '', 150, yPosition)
            yPosition += 8
          })
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175) // Light gray
        doc.text(`Generated by Budget Tracker - Page ${i} of ${pageCount}`, 20, 285)
      }

      // Save the PDF
      const fileName = `budget-report-${exportOptions.period}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const filteredExpenses = getExpensesForPeriod()
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-8">
      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Options</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Calendar className="h-4 w-4" />
              <span>Time Period</span>
            </label>
            <select
              value={exportOptions.period}
              onChange={(e) => setExportOptions({ ...exportOptions, period: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Filter className="h-4 w-4" />
              <span>Include in Report</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCategoryBreakdown}
                  onChange={(e) => setExportOptions({ 
                    ...exportOptions, 
                    includeCategoryBreakdown: e.target.checked 
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Category Breakdown</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeRecurring}
                  onChange={(e) => setExportOptions({ 
                    ...exportOptions, 
                    includeRecurring: e.target.checked 
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Recurring Expenses</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Period:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                {exportOptions.period}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Expenses:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filteredExpenses.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                ${totalExpenses.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={generatePDF}
            disabled={isExporting || filteredExpenses.length === 0}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Export to PDF'}</span>
          </button>
          
          {filteredExpenses.length === 0 && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No expenses found for the selected period.
            </p>
          )}
        </div>
      </div>

      {/* Export History/Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Tips</h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
            <span>Reports include a summary, category breakdown, and detailed expense list</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
            <span>PDF files are saved with the format: budget-report-period-date.pdf</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
            <span>Use different time periods to analyze spending patterns over time</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
            <span>Reports can be shared with financial advisors or used for tax purposes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
