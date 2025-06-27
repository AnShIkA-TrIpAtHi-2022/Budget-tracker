import { useState, useEffect, createContext, useContext } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('budgetToken')
      const savedUser = localStorage.getItem('budgetUser')
      
      if (token && savedUser) {
        setUser(JSON.parse(savedUser))
        setIsAuthenticated(true)
        
        // Verify token with server
        try {
          const response = await authAPI.getCurrentUser()
          setUser(response.user)
        } catch (error) {
          // Token invalid, clear local storage
          logout()
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      
      if (response.success) {
        localStorage.setItem('budgetToken', response.token)
        localStorage.setItem('budgetUser', JSON.stringify(response.user))
        setUser(response.user)
        setIsAuthenticated(true)
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed'
      return { success: false, error: message }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register({ name, email, password })
      
      if (response.success) {
        localStorage.setItem('budgetToken', response.token)
        localStorage.setItem('budgetUser', JSON.stringify(response.user))
        setUser(response.user)
        setIsAuthenticated(true)
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed'
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('budgetToken')
    localStorage.removeItem('budgetUser')
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData)
      
      if (response.success) {
        localStorage.setItem('budgetUser', JSON.stringify(response.user))
        setUser(response.user)
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed'
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
