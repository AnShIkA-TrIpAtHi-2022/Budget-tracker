import { createContext, useContext, useReducer, useEffect } from 'react'
import { expensesAPI, categoriesAPI } from '../services/api'

const BudgetContext = createContext()

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_EXPENSES: 'SET_EXPENSES',
  ADD_EXPENSE: 'ADD_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',
  SET_CATEGORIES: 'SET_CATEGORIES',
  ADD_CATEGORY: 'ADD_CATEGORY',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  SET_BUDGET: 'SET_BUDGET'
}

// Initial state
const initialState = {
  loading: false,
  error: null,
  expenses: [],
  categories: [],
  monthlyBudget: 3000
}

// Reducer function
function budgetReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
    
    case ACTIONS.SET_EXPENSES:
      return { ...state, expenses: action.payload, loading: false }
    
    case ACTIONS.ADD_EXPENSE:
      return {
        ...state,
        expenses: [...state.expenses, action.payload],
        loading: false
      }
    
    case ACTIONS.UPDATE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.map(expense => 
          expense._id === action.payload._id ? action.payload : expense
        ),
        loading: false
      }
    
    case ACTIONS.DELETE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense._id !== action.payload),
        loading: false
      }
    
    case ACTIONS.SET_CATEGORIES:
      return { ...state, categories: action.payload, loading: false }
    
    case ACTIONS.ADD_CATEGORY:
      return {
        ...state,
        categories: [...state.categories, action.payload],
        loading: false
      }
    
    case ACTIONS.UPDATE_CATEGORY:
      return {
        ...state,
        categories: state.categories.map(category => 
          category._id === action.payload._id ? action.payload : category
        ),
        loading: false
      }
    
    case ACTIONS.DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter(category => category._id !== action.payload),
        loading: false
      }
    
    case ACTIONS.SET_BUDGET:
      return { ...state, monthlyBudget: action.payload }
    
    default:
      return state
  }
}

// Provider component
export function BudgetProvider({ children }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState)

  // Load data from API on mount
  useEffect(() => {
    loadExpenses()
    loadCategories()
    loadBudget()
  }, [])

  // Load functions
  const loadExpenses = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      const data = await expensesAPI.getAll()
      dispatch({ type: ACTIONS.SET_EXPENSES, payload: data.expenses || data })
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll()
      dispatch({ type: ACTIONS.SET_CATEGORIES, payload: data.categories || data })
    } catch (error) {
      console.warn('Categories not loaded from API, using defaults')
      // Set default categories if API fails
      const defaultCategories = [
        { _id: '1', name: 'Food & Dining', color: '#ef4444' },
        { _id: '2', name: 'Transportation', color: '#3b82f6' },
        { _id: '3', name: 'Shopping', color: '#8b5cf6' },
        { _id: '4', name: 'Entertainment', color: '#f59e0b' },
        { _id: '5', name: 'Utilities', color: '#10b981' }
      ]
      dispatch({ type: ACTIONS.SET_CATEGORIES, payload: defaultCategories })
    }
  }

  const loadBudget = () => {
    const savedBudget = localStorage.getItem('budgetTracker_budget')
    if (savedBudget) {
      dispatch({ type: ACTIONS.SET_BUDGET, payload: JSON.parse(savedBudget) })
    }
  }

  // Expense actions
  const addExpense = async (expenseData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      const data = await expensesAPI.create(expenseData)
      dispatch({ type: ACTIONS.ADD_EXPENSE, payload: data.expense || data })
      return { success: true }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }

  const updateExpense = async (id, expenseData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      const data = await expensesAPI.update(id, expenseData)
      dispatch({ type: ACTIONS.UPDATE_EXPENSE, payload: data.expense || data })
      return { success: true }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }

  const deleteExpense = async (id) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      await expensesAPI.delete(id)
      dispatch({ type: ACTIONS.DELETE_EXPENSE, payload: id })
      return { success: true }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }

  // Category actions
  const addCategory = async (categoryData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      const data = await categoriesAPI.create(categoryData)
      dispatch({ type: ACTIONS.ADD_CATEGORY, payload: data.category || data })
      return { success: true }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      const data = await categoriesAPI.update(id, categoryData)
      dispatch({ type: ACTIONS.UPDATE_CATEGORY, payload: data.category || data })
      return { success: true }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }

  const deleteCategory = async (id) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      await categoriesAPI.delete(id)
      dispatch({ type: ACTIONS.DELETE_CATEGORY, payload: id })
      return { success: true }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }

  const updateBudget = (amount) => {
    try {
      dispatch({ type: ACTIONS.SET_BUDGET, payload: amount })
      localStorage.setItem('budgetTracker_budget', JSON.stringify(amount))
      return { success: true }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    }
  }

  const clearError = () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null })
  }

  const value = {
    ...state,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    updateBudget,
    clearError,
    refreshData: () => {
      loadExpenses()
      loadCategories()
    }
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}

export const useBudget = () => {
  const context = useContext(BudgetContext)
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider')
  }
  return context
}
