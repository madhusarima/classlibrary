import { useNavigate } from 'react-router'
import { trpc } from '@/providers/trpc'
import { motion } from 'framer-motion'
import {
  BookOpen,
  BookCheck,
  UserPlus,
  ScrollText,
  TrendingUp,
  AlertCircle,
  Users,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'

const quickActions = [
  { label: 'Issue Book', icon: BookOpen, path: '/issue', color: '#E07A5F' },
  { label: 'Return Book', icon: BookCheck, path: '/return', color: '#81B29A' },
  { label: 'Add Student', icon: UserPlus, path: '/students?add=true', color: '#5E81AC' },
  { label: 'View Log', icon: ScrollText, path: '/reports', color: '#8B7355' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const statsQuery = trpc.transaction.stats.useQuery()
  const recentQuery = trpc.transaction.recent.useQuery({ limit: 10 })

  const stats = statsQuery.data ?? { issuedToday: 0, overdue: 0, activeReaders: 0 }
  const recent = recentQuery.data ?? []

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
        >
          {greeting}, Teacher
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Live Stats */}
      <motion.div 
        className="flex gap-2 mb-6 overflow-x-auto pb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatPill
          icon={TrendingUp}
          label="Issued Today"
          value={stats.issuedToday}
          color="#E07A5F"
        />
        <StatPill
          icon={AlertCircle}
          label="Overdue"
          value={stats.overdue}
          color="#DC2626"
        />
        <StatPill
          icon={Users}
          label="Active Readers"
          value={stats.activeReaders}
          color="#81B29A"
        />
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 
          className="text-lg font-semibold mb-3"
          style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="relative p-4 rounded-lg text-left border transition-shadow hover:shadow-md"
              style={{ 
                background: 'white', 
                borderColor: 'var(--border-muted)' 
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${action.color}15` }}
              >
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <span 
                className="text-sm font-semibold block"
                style={{ color: 'var(--ink-primary)' }}
              >
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 
            className="text-lg font-semibold"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
          >
            Recent Activity
          </h2>
          <button 
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--accent-warm)' }}
          >
            View All <ArrowRight size={12} />
          </button>
        </div>

        <div className="space-y-2">
          {recent.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <div className="library-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                      {item.studentName}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--ink-secondary)' }}>
                      {item.bookTitle} — {item.bookAuthor}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--ink-secondary)' }}>
                      {format(new Date(item.issueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {item.status === 'issued' ? (
                      <span className="stamp stamp-issued animate-stamp">Issued</span>
                    ) : (
                      <span className="stamp stamp-returned animate-stamp-returned">Returned</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof TrendingUp
  label: string
  value: number
  color: string
}) {
  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 rounded-full border whitespace-nowrap"
      style={{ background: 'white', borderColor: 'var(--border-muted)' }}
    >
      <Icon size={14} style={{ color }} />
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>{value}</span>
        <span className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>{label}</span>
      </div>
    </div>
  )
}
