"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount
    const savedToken = localStorage.getItem("auth_token")
    const savedUser = localStorage.getItem("auth_user")
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const formData = new FormData()
    formData.append("username", email) // OAuth2PasswordRequestForm uses 'username'
    formData.append("password", password)

    const response = await fetch("http://localhost:8000/api/v1/token", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data = await response.json()
    const authToken = data.access_token

    // Create user object (in a real app, you might fetch user details)
    const userObj = { id: 1, email }

    setToken(authToken)
    setUser(userObj)

    // Save to localStorage
    localStorage.setItem("auth_token", authToken)
    localStorage.setItem("auth_user", JSON.stringify(userObj))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}