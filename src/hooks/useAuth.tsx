import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type UserRole = 'admin' | 'teacher'

interface AuthUser {
  username: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const USERS: Record<string, { password: string; role: UserRole }> = {
  admin: { password: 'admin123', role: 'admin' },
  teacher: { password: 'abhyasa2026', role: 'teacher' },
}

const STORAGE_KEY = 'library_auth_user'

function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)

  const login = useCallback((username: string, password: string): boolean => {
    const record = USERS[username.trim()]
    if (record && record.password === password) {
      const authUser = { username: username.trim(), role: record.role }
      setUser(authUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export function useIsAdmin() {
  const { user } = useAuth()
  return user?.role === 'admin'
}
