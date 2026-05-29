'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { getMe } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data?.user || data || null)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // When used outside AuthProvider (e.g. in server components or tests),
    // fall back to a hook that fetches independently
    return useAuthFallback()
  }
  return ctx
}

function useAuthFallback() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data?.user || data || null)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { user, isLoggedIn: !!user, loading }
}
