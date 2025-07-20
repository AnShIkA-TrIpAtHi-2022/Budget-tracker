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
    console.log('📡 API: Getting all categories')
    const response = await api.get('/categories')
    console.log('📦 API: Get categories response:', response.data)
    // Backend returns { success, count, data }, we need just the data array
    return response.data.data || []
  },
  
  create: async (categoryData) => {
    console.log('📡 API: Creating category with data:', categoryData)
    const response = await api.post('/categories', categoryData)
    console.log('📦 API: Create category response:', response.data)
    // Backend returns { success, data }, we need just the data
    return response.data.data
  },
  
  update: async (id, categoryData) => {
    console.log('📡 API: Updating category ID:', id, 'with data:', categoryData)
    const response = await api.put(`/categories/${id}`, categoryData)
    console.log('📦 API: Update category response:', response.data)
    // Backend returns { success, data }, we need just the data
    return response.data.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  }
}

// Expenses API
export const expensesAPI = {
  getAll: async (params = {}) => {
    console.log('📡 API: Getting all expenses with params:', params)
    // Request all expenses by setting a high limit to bypass pagination
    const allParams = { ...params, limit: 10000 }
    const response = await api.get('/expenses', { params: allParams })
    console.log('📦 API: Get expenses response:', response.data)
    // Backend returns { success, count, total, pagination, data }, we need just the data array
    return response.data.data || []
  },
  
  create: async (expenseData) => {
    console.log('📡 API: Creating expense with data:', expenseData)
    const response = await api.post('/expenses', expenseData)
    console.log('📦 API: Create expense response:', response.data)
    // Backend returns { success, data }, we need just the data
    return response.data.data
  },
  
  update: async (id, expenseData) => {
    console.log('📡 API: Updating expense ID:', id, 'with data:', expenseData)
    const response = await api.put(`/expenses/${id}`, expenseData)
    console.log('📦 API: Update expense response:', response.data)
    // Backend returns { success, data }, we need just the data
    return response.data.data
  },
  
  delete: async (id) => {
    console.log('📡 API: Deleting expense ID:', id)
    const response = await api.delete(`/expenses/${id}`)
    console.log('📦 API: Delete expense response:', response.data)
    return response.data
  }
}

export default api
