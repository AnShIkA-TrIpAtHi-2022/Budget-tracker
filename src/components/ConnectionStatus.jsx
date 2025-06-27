import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Database, Server, Globe } from 'lucide-react'

const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    online: navigator.onLine,
    backend: 'unknown',
    database: 'unknown',
    lastCheck: new Date()
  })

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('/api/', { 
        method: 'GET',
        timeout: 5000 
      })
      const data = await response.json()
      
      setStatus(prev => ({
        ...prev,
        backend: response.ok ? 'connected' : 'error',
        database: data.message ? 'connected' : 'error',
        lastCheck: new Date()
      }))
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        backend: 'error',
        database: 'error',
        lastCheck: new Date()
      }))
    }
  }

  useEffect(() => {
    checkBackendStatus()
    
    const interval = setInterval(checkBackendStatus, 30000) // Check every 30 seconds
    
    const handleOnline = () => setStatus(prev => ({ ...prev, online: true }))
    const handleOffline = () => setStatus(prev => ({ ...prev, online: false }))
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const StatusIndicator = ({ status, icon: Icon, label }) => {
    const getColor = () => {
      switch (status) {
        case 'connected': return 'text-green-500'
        case 'error': return 'text-red-500'
        default: return 'text-yellow-500'
      }
    }

    return (
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 ${getColor()}`} />
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
      <div className="space-y-1">
        <StatusIndicator 
          status={status.online ? 'connected' : 'error'} 
          icon={status.online ? Wifi : WifiOff} 
          label="Internet" 
        />
        <StatusIndicator 
          status={status.backend} 
          icon={Server} 
          label="Backend" 
        />
        <StatusIndicator 
          status={status.database} 
          icon={Database} 
          label="Database" 
        />
      </div>
      <div className="text-xs text-gray-400 mt-2">
        Last check: {status.lastCheck.toLocaleTimeString()}
      </div>
    </div>
  )
}

export default ConnectionStatus
