import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories')
    return response.data
  },
  
  create: async (categoryData) => {
    const response = await api.post('/categories', categoryData)
    return response.data
  },
  
  update: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  }
}

// Expenses API
export const expensesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/expenses', { params })
    return response.data
  },
  
  create: async (expenseData) => {
    const response = await api.post('/expenses', expenseData)
    return response.data
  },
  
  update: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/expenses/${id}`)
    return response.data
  }
}

export default api
