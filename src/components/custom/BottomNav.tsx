import { useLocation, useNavigate } from 'react-router'
import { LayoutDashboard, Users, BookOpen, BarChart3, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/students', label: 'Students', icon: Users },
  { path: '/books', label: 'Books', icon: BookOpen },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ 
        background: 'rgba(253, 251, 247, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderColor: 'var(--border-muted)' 
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 py-2 px-4 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-1 h-1 rounded-full"
                  style={{ background: 'var(--accent-warm)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ color: isActive ? 'var(--accent-warm)' : 'var(--ink-secondary)' }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? 'var(--accent-warm)' : 'var(--ink-secondary)' }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
