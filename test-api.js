// Simple test script to verify backend API
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

async function testAPI() {
  try {
    console.log('Testing backend API connection...')
    
    // Test basic connection
    const response = await axios.get(`${API_URL}/`)
    console.log('✅ API health check:', response.data)
    
    // Test login with demo user
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      email: 'demo@budgettracker.com',
      password: 'demo123'
    })
    console.log('✅ Demo login successful:', {
      success: loginResponse.data.success,
      user: loginResponse.data.user.name
    })
    
    const token = loginResponse.data.token
    
    // Test authenticated request - get categories
    const categoriesResponse = await axios.get(`${API_URL}/categories`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log('✅ Categories fetched:', categoriesResponse.data.data.length, 'categories')
    
    // Test get expenses
    const expensesResponse = await axios.get(`${API_URL}/expenses`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log('✅ Expenses fetched:', expensesResponse.data.data.length, 'expenses')
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message)
  }
}

testAPI()
