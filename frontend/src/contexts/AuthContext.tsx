import { createContext, useContext, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  avatar?: {
    url: string
    public_id: string
  }
  bio?: string
  followers: any[]
  following: any[]
  isVerified: boolean
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const queryClient = useQueryClient()

  // Get user data if token exists
  const { isLoading } = useQuery(
    'user',
    async () => {
      const token = localStorage.getItem('token')
      if (!token) return null
      
      const response = await api.get('/auth/me')
      return response.data.user
    },
    {
      onSuccess: (userData) => {
        if (userData) {
          setUser(userData)
          setIsAuthenticated(true)
        }
      },
      onError: () => {
        localStorage.removeItem('token')
        setUser(null)
        setIsAuthenticated(false)
      },
      retry: false,
    }
  )

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      setUser(userData)
      setIsAuthenticated(true)
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries('user')
      
      toast.success('Login successful!')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password })
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      setUser(userData)
      setIsAuthenticated(true)
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries('user')
      
      toast.success('Registration successful!')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
    queryClient.clear()
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}