import { useState } from 'react'
import { BarChart3, Calendar, TrendingUp, Zap, Activity, Target, PieChart, Clock } from 'lucide-react'
import Analytics from './Analytics'
import DayWiseAnalytics from './DayWiseAnalytics'
import AdvancedAnalytics from './AdvancedAnalytics'

export default function AnalyticsDashboard() {
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('overview')

  const analyticsTab = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: PieChart,
      description: 'General spending overview and trends'
    },
    { 
      id: 'daily', 
      label: 'Day-wise', 
      icon: Calendar,
      description: 'Detailed daily spending analysis'
    },
    { 
      id: 'advanced', 
      label: 'Advanced', 
      icon: Zap,
      description: 'Deep insights and spending patterns'
    }
  ]

  const renderActiveAnalyticsTab = () => {
    switch (activeAnalyticsTab) {
      case 'overview':
        return <Analytics />
      case 'daily':
        return <DayWiseAnalytics />
      case 'advanced':
        return <AdvancedAnalytics />
      default:
        return <Analytics />
    }
  }

  return (
    <div className="space-y-6">
      {/* Analytics Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive analysis of your spending patterns and financial behavior
            </p>
          </div>
        </div>
        
        {/* Sub Navigation */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row gap-2">
            {analyticsTab.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalyticsTab(tab.id)}
                  className={`flex items-start space-x-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                    activeAnalyticsTab === tab.id
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    activeAnalyticsTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-gray-100 dark:bg-gray-600'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      activeAnalyticsTab === tab.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      activeAnalyticsTab === tab.id
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {tab.label}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      activeAnalyticsTab === tab.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {tab.description}
                    </p>
                  </div>
                  {activeAnalyticsTab === tab.id && (
                    <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="transition-all duration-300 ease-in-out">
        {renderActiveAnalyticsTab()}
      </div>
    </div>
  )
}
