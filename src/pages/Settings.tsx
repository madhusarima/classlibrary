import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Info,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  LogOut,
  Shield,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function Settings() {
  const { user, logout } = useAuth()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const statsQuery = trpc.transaction.stats.useQuery()
  const studentsCountQuery = trpc.student.list.useQuery()
  const booksCountQuery = trpc.book.list.useQuery()
  const transactionsQuery = trpc.transaction.list.useQuery()

  const stats = statsQuery.data ?? { issuedToday: 0, overdue: 0, activeReaders: 0 }
  const studentsCount = (studentsCountQuery.data ?? []).length
  const booksCount = (booksCountQuery.data ?? []).length
  const transactionsCount = (transactionsQuery.data ?? []).length

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      students: studentsCountQuery.data ?? [],
      books: booksCountQuery.data ?? [],
      transactions: transactionsQuery.data ?? [],
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `library-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Database exported successfully')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <h1 
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
      >
        Settings
      </h1>

      {/* User Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border bg-white mb-4 flex items-center justify-between"
        style={{ borderColor: 'var(--border-muted)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: user?.role === 'admin' ? '#FEE2E2' : '#DCFCE7' }}
          >
            {user?.role === 'admin' ? (
              <Shield size={18} style={{ color: '#DC2626' }} />
            ) : (
              <UserCheck size={18} style={{ color: '#16A34A' }} />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold capitalize" style={{ color: 'var(--ink-primary)' }}>
              {user?.username}
            </p>
            <p className="text-[10px] capitalize" style={{ color: 'var(--ink-secondary)' }}>
              {user?.role} Account
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs"
          onClick={logout}
        >
          <LogOut size={12} className="mr-1" /> Logout
        </Button>
      </motion.div>

      {/* App Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-2 mb-6"
      >
        <StatCard icon={Users} label="Students" value={studentsCount} color="#5E81AC" />
        <StatCard icon={BookOpen} label="Books" value={booksCount} color="#81B29A" />
        <StatCard icon={Clock} label="Transactions" value={transactionsCount} color="#E07A5F" />
        <StatCard icon={CheckCircle2} label="Active Readers" value={stats.activeReaders} color="#D4A373" />
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--ink-secondary)' }}>
          Data Management
        </h2>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-3.5 rounded-lg border bg-white text-left transition-shadow hover:shadow-sm"
            style={{ borderColor: 'var(--border-muted)' }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#DCFCE7' }}>
              <Download size={16} style={{ color: '#166534' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>Export Database</p>
              <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>Download all data as JSON</p>
            </div>
            <Download size={14} style={{ color: 'var(--ink-secondary)' }} />
          </button>

          <button
            onClick={() => toast.info('Import feature coming soon')}
            className="w-full flex items-center gap-3 p-3.5 rounded-lg border bg-white text-left transition-shadow hover:shadow-sm"
            style={{ borderColor: 'var(--border-muted)' }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#DBEAFE' }}>
              <Upload size={16} style={{ color: '#1D4ED8' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>Import Database</p>
              <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>Restore from backup file</p>
            </div>
            <Upload size={14} style={{ color: 'var(--ink-secondary)' }} />
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-3 p-3.5 rounded-lg border bg-white text-left transition-shadow hover:shadow-sm"
            style={{ borderColor: '#FECACA' }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#FEE2E2' }}>
              <Trash2 size={16} style={{ color: '#DC2626' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#DC2626' }}>Reset All Data</p>
              <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>Delete everything — cannot be undone</p>
            </div>
            <AlertTriangle size={14} style={{ color: '#DC2626' }} />
          </button>
        </div>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--ink-secondary)' }}>
          About
        </h2>
        <div className="p-4 rounded-lg border bg-white" style={{ borderColor: 'var(--border-muted)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-warm)' }}
            >
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                Classroom Library Tracker
              </p>
              <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>Version 1.0</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
            A simple, fast, and offline-first reading library management system designed for teachers. 
            Track student reading, manage book inventory, and generate reports with minimal effort.
          </p>
        </div>
      </motion.div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-sm" style={{ background: 'var(--paper-bg)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif', color: '#DC2626' }}>
              <AlertTriangle size={18} /> Reset All Data
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            This will permanently delete all students, books, and transaction records. This action cannot be undone.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-lg" 
              style={{ background: '#DC2626' }}
              onClick={() => {
                toast.info('Reset feature disabled in demo')
                setShowResetConfirm(false)
              }}
            >
              Reset Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg border bg-white text-center" style={{ borderColor: 'var(--border-muted)' }}>
      <Icon size={18} className="mx-auto mb-1.5" style={{ color }} />
      <p className="text-xl font-bold" style={{ color: 'var(--ink-primary)' }}>{value}</p>
      <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>{label}</p>
    </div>
  )
}
