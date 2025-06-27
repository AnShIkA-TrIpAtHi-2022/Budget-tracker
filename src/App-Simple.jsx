import { useState, useEffect } from 'react'
import { Moon, Sun, Plus, Edit, TrendingUp, PieChart } from 'lucide-react'
import { BudgetProvider } from './context/BudgetContext'
import ExpenseManager from './components/ExpenseManager'
import CategoryManager from './components/CategoryManager'
import Analytics from './components/Analytics'
import Sidebar from './components/Sidebar'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('expenses')

  useEffect(() => {
    // Check for saved dark mode preference or system preference
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      setDarkMode(JSON.parse(savedMode))
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }, [])

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Save preference
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: Plus },
    { id: 'categories', label: 'Categories', icon: Edit },
    { id: 'analytics', label: 'Analytics', icon: PieChart }
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'expenses':
        return <ExpenseManager />
      case 'categories':
        return <CategoryManager />
      case 'analytics':
        return <Analytics />
      default:
        return <ExpenseManager />
    }
  }

  return (
    <BudgetProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Budget Tracker
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    Personal Finance Manager
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleDarkMode}
                  className="group p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-yellow-500 group-hover:rotate-180 transition-transform duration-300" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600 group-hover:rotate-12 transition-transform duration-300" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Panel */}
            <div className="xl:col-span-3">
              <div className="transition-all duration-300 ease-in-out">
                {renderActiveTab()}
              </div>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-40">
                <Sidebar />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © 2025 Budget Tracker. Built with React & Tailwind CSS.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
                <span>Simple</span>
                <span>•</span>
                <span>Fast</span>
                <span>•</span>
                <span>Dark Mode</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BudgetProvider>
  )
}

export default App
