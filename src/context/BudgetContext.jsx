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
  monthlyBudget: 25000
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

  // Load data from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🏁 BudgetContext: Loading initial data from backend...')
        dispatch({ type: ACTIONS.SET_LOADING, payload: true })
        
        // Load categories and expenses in parallel
        const [categoriesData, expensesData] = await Promise.all([
          categoriesAPI.getAll(),
          expensesAPI.getAll()
        ])
        
        console.log('📂 BudgetContext: Loaded categories:', categoriesData)
        console.log('💰 BudgetContext: Loaded expenses:', expensesData)
        
        // Ensure categories is always an array
        const categoriesArray = Array.isArray(categoriesData) ? categoriesData : []
        const expensesArray = Array.isArray(expensesData) ? expensesData : []
        
        dispatch({ type: ACTIONS.SET_CATEGORIES, payload: categoriesArray })
        dispatch({ type: ACTIONS.SET_EXPENSES, payload: expensesArray })
        
        // Load budget from localStorage (budget is still local for now)
        const savedBudget = localStorage.getItem('budgetTracker_budget')
        if (savedBudget) {
          dispatch({ type: ACTIONS.SET_BUDGET, payload: JSON.parse(savedBudget) })
        }
        
      } catch (error) {
        console.error('❌ BudgetContext: Error loading initial data:', error)
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false })
      }
    }

    loadData()
  }, [])

  // Save budget to localStorage when it changes (budget is still local)
  useEffect(() => {
    localStorage.setItem('budgetTracker_budget', JSON.stringify(state.monthlyBudget))
  }, [state.monthlyBudget])

  // Expense actions with API calls
  const addExpense = async (expenseData) => {
    try {
      console.log('➕ BudgetContext: Adding expense with form data:', expenseData)
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      const newExpense = await expensesAPI.create(expenseData)
      console.log('✅ BudgetContext: Expense added successfully:', newExpense)
      
      dispatch({ type: ACTIONS.ADD_EXPENSE, payload: newExpense })
      return { success: true }
    } catch (error) {
      console.error('❌ BudgetContext: Error adding expense:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }

  const updateExpense = async (expenseData) => {
    try {
      console.log('✏️ BudgetContext: Updating expense with form data:', expenseData)
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      const updatedExpense = await expensesAPI.update(expenseData.id || expenseData._id, expenseData)
      console.log('✅ BudgetContext: Expense updated successfully:', updatedExpense)
      
      dispatch({ type: ACTIONS.UPDATE_EXPENSE, payload: updatedExpense })
      return { success: true }
    } catch (error) {
      console.error('❌ BudgetContext: Error updating expense:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }

  const deleteExpense = async (id) => {
    try {
      console.log('🗑️ BudgetContext: Deleting expense with ID:', id)
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      await expensesAPI.delete(id)
      console.log('✅ BudgetContext: Expense deleted successfully')
      
      dispatch({ type: ACTIONS.DELETE_EXPENSE, payload: id })
      return { success: true }
    } catch (error) {
      console.error('❌ BudgetContext: Error deleting expense:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }

  // Category actions with API calls
  const addCategory = async (categoryData) => {
    try {
      console.log('➕ BudgetContext: Adding category with data:', categoryData)
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      const newCategory = await categoriesAPI.create(categoryData)
      console.log('✅ BudgetContext: Category added successfully:', newCategory)
      
      dispatch({ type: ACTIONS.ADD_CATEGORY, payload: newCategory })
      return { success: true }
    } catch (error) {
      console.error('❌ BudgetContext: Error adding category:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }

  const updateCategory = async (id, categoryData) => {
    try {
      console.log('✏️ BudgetContext: Updating category ID:', id, 'with data:', categoryData)
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      const updatedCategory = await categoriesAPI.update(id, categoryData)
      console.log('✅ BudgetContext: Category updated successfully:', updatedCategory)
      
      dispatch({ type: ACTIONS.UPDATE_CATEGORY, payload: updatedCategory })
      return { success: true }
    } catch (error) {
      console.error('❌ BudgetContext: Error updating category:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }

  const deleteCategory = async (id) => {
    try {
      console.log('🗑️ BudgetContext: Deleting category with ID:', id)
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      await categoriesAPI.delete(id)
      console.log('✅ BudgetContext: Category deleted successfully')
      
      dispatch({ type: ACTIONS.DELETE_CATEGORY, payload: id })
      return { success: true }
    } catch (error) {
      console.error('❌ BudgetContext: Error deleting category:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      return { success: false, error: error.message }
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }

  const updateBudget = (amount) => {
    try {
      console.log('💰 BudgetContext: Updating budget to:', amount)
      dispatch({ type: ACTIONS.SET_BUDGET, payload: amount })
      return { success: true }
    } catch (error) {
      console.error('❌ BudgetContext: Error updating budget:', error)
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
    clearError
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
