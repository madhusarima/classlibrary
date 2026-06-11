import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { BookOpen, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Please enter username and password')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      const success = login(username.trim(), password)
      if (!success) {
        toast.error('Invalid username or password')
      }
      setIsLoading(false)
    }, 400)
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ 
        background: 'var(--paper-bg)',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(232, 224, 213, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(224, 122, 95, 0.05) 0%, transparent 50%)
        `
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--accent-warm)' }}
          >
            <BookOpen size={28} className="text-white" />
          </motion.div>
          <h1 
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
          >
            Library Tracker
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Classroom Reading Management
          </p>
        </div>

        {/* Login Card */}
        <div 
          className="p-6 rounded-xl border bg-white"
          style={{ borderColor: 'var(--border-muted)', boxShadow: '0 4px 20px rgba(44, 24, 16, 0.08)' }}
        >
          <h2 
            className="text-lg font-semibold mb-4 text-center"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
          >
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>
                Username
              </label>
              <div className="relative">
                <User 
                  size={14} 
                  className="absolute left-3 top-1/2 -translate-y-1/2" 
                  style={{ color: 'var(--ink-secondary)' }} 
                />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-9 rounded-lg"
                  style={{ borderColor: 'var(--border-muted)' }}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock 
                  size={14} 
                  className="absolute left-3 top-1/2 -translate-y-1/2" 
                  style={{ color: 'var(--ink-secondary)' }} 
                />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-9 pr-10 rounded-lg"
                  style={{ borderColor: 'var(--border-muted)' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff size={14} style={{ color: 'var(--ink-secondary)' }} />
                  ) : (
                    <Eye size={14} style={{ color: 'var(--ink-secondary)' }} />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-lg font-semibold mt-2"
              style={{ background: 'var(--accent-warm)' }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Hint */}
        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--ink-secondary)' }}>
          Admin: <strong>admin</strong> / <strong>admin123</strong> &nbsp;|&nbsp;
          Teacher: <strong>teacher</strong> / <strong>abhyasa2026</strong>
        </p>
      </motion.div>
    </div>
  )
}
