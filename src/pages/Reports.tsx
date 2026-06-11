import { useState, useRef, useEffect } from 'react'
import { trpc } from '@/providers/trpc'
import { motion } from 'framer-motion'
import {
  Trophy,
  TrendingUp,
  BookOpen,
  Share2,
  Printer,
  Users,
  Calendar,
  BarChart3,
  ChevronRight,
  Medal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, subDays } from 'date-fns'

type Period = 'week' | 'month' | 'all'

export default function Reports() {
  const [period, setPeriod] = useState<Period>('all')
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'popular' | 'classes' | 'log'>('leaderboard')

  const leaderboardQuery = trpc.report.leaderboard.useQuery({ limit: 10, period })
  const popularQuery = trpc.report.popularBooks.useQuery({ limit: 10, period })
  const classComparisonQuery = trpc.report.classComparison.useQuery()
  const transactionsQuery = trpc.transaction.list.useQuery({})
  const overdueQuery = trpc.transaction.overdue.useQuery({ days: 15 })

  const leaderboard = leaderboardQuery.data ?? []
  const popular = popularQuery.data ?? []
  const classComparison = classComparisonQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const overdue = overdueQuery.data ?? []

  const maxReads = Math.max(...leaderboard.map(l => l.booksRead), 1)
  const maxPopular = Math.max(...popular.map(p => p.readCount), 1)
  const maxClass = Math.max(...classComparison.map(c => c.booksRead), 1)

  const handleShareWhatsApp = () => {
    let text = ''
    if (activeTab === 'leaderboard') {
      text = `*Top Readers${period !== 'all' ? ` (${period})` : ''}*\n\n`
      leaderboard.slice(0, 5).forEach((l, i) => {
        text += `${i + 1}. ${l.studentName} (${l.studentClass}) — ${l.booksRead} books\n`
      })
    } else if (activeTab === 'popular') {
      text = `*Most Popular Books${period !== 'all' ? ` (${period})` : ''}*\n\n`
      popular.slice(0, 5).forEach((p, i) => {
        text += `${i + 1}. ${p.bookTitle} — ${p.readCount} reads\n`
      })
    } else if (activeTab === 'classes') {
      text = `*Class Reading Rankings*\n\n`
      classComparison.forEach((c, i) => {
        text += `${i + 1}. ${c.className} — ${c.booksRead} books\n`
      })
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  const tabs = [
    { key: 'leaderboard' as const, label: 'Readers', icon: Trophy },
    { key: 'popular' as const, label: 'Books', icon: BookOpen },
    { key: 'classes' as const, label: 'Classes', icon: BarChart3 },
    { key: 'log' as const, label: 'Log', icon: Calendar },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 
          className="text-2xl font-bold"
          style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
        >
          Reports
        </h1>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={handleShareWhatsApp}>
            <Share2 size={14} style={{ color: '#25D366' }} />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={handlePrint}>
            <Printer size={14} style={{ color: 'var(--ink-secondary)' }} />
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-1.5 mb-4">
        {([['all', 'All Time'], ['month', 'This Month'], ['week', 'This Week']] as [Period, string][]).map(([p, label]) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: period === p ? 'var(--accent-warm)' : 'white',
              color: period === p ? 'white' : 'var(--ink-secondary)',
              border: `1px solid ${period === p ? 'var(--accent-warm)' : 'var(--border-muted)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-warm)' : 'var(--ink-secondary)',
              border: activeTab === tab.key ? '1px solid var(--border-muted)' : '1px solid transparent',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-1.5">
              {leaderboard.map((item, index) => (
                <LeaderboardRow
                  key={item.studentId}
                  rank={index + 1}
                  name={item.studentName}
                  subtitle={item.studentClass}
                  value={item.booksRead}
                  max={maxReads}
                  color={index < 3 ? ['#E07A5F', '#81B29A', '#5E81AC'][index] : 'var(--border-muted)'}
                />
              ))}
              {leaderboard.length === 0 && (
                <EmptyState icon={Trophy} message="No reading data for this period" />
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'popular' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-1.5">
              {popular.map((item, index) => (
                <LeaderboardRow
                  key={item.bookId}
                  rank={index + 1}
                  name={item.bookTitle}
                  subtitle={item.bookAuthor}
                  value={item.readCount}
                  max={maxPopular}
                  color={index < 3 ? ['#E07A5F', '#81B29A', '#5E81AC'][index] : 'var(--border-muted)'}
                />
              ))}
              {popular.length === 0 && (
                <EmptyState icon={BookOpen} message="No book data for this period" />
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'classes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-1.5">
              {classComparison.map((item, index) => (
                <LeaderboardRow
                  key={item.className}
                  rank={index + 1}
                  name={item.className}
                  subtitle="Total books read"
                  value={item.booksRead}
                  max={maxClass}
                  color={index < 3 ? ['#E07A5F', '#81B29A', '#5E81AC'][index] : 'var(--border-muted)'}
                />
              ))}
              {classComparison.length === 0 && (
                <EmptyState icon={BarChart3} message="No class data available" />
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'log' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Overdue Section */}
            {overdue.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#DC2626' }}>
                  <Medal size={14} /> Overdue Books ({overdue.length})
                </h3>
                <div className="space-y-1.5">
                  {overdue.map((o) => (
                    <div 
                      key={o.id}
                      className="p-2.5 rounded-lg bg-white border"
                      style={{ borderColor: '#FECACA' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>{o.bookTitle}</p>
                          <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>
                            {o.studentName} • {o.studentClass}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                          {format(new Date(o.issueDate), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Log */}
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink-primary)' }}>
              Recent Transactions
            </h3>
            <div className="space-y-1.5">
              {transactions.slice(0, 30).map((t) => (
                <div 
                  key={t.id}
                  className="p-2.5 rounded-lg bg-white border"
                  style={{ borderColor: 'var(--border-muted)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--ink-primary)' }}>
                        {t.bookTitle}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>
                        {t.studentName} • {t.studentClass}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ 
                          background: t.status === 'returned' ? '#DCFCE7' : '#FEF3C7',
                          color: t.status === 'returned' ? '#166534' : '#92400E'
                        }}
                      >
                        {t.status}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>
                        {format(new Date(t.issueDate), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <EmptyState icon={Calendar} message="No transactions yet" />
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function LeaderboardRow({
  rank,
  name,
  subtitle,
  value,
  max,
  color,
}: {
  rank: number
  name: string
  subtitle: string
  value: number
  max: number
  color: string
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  const isTop3 = rank <= 3

  return (
    <div 
      className="leaderboard-row p-3 rounded-lg bg-white"
      style={{ borderBottom: '1px solid var(--border-muted)' }}
    >
      <div className="flex items-center gap-3 w-full">
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ 
            background: isTop3 ? color + '20' : 'var(--border-muted)',
            color: isTop3 ? color : 'var(--ink-secondary)'
          }}
        >
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>{name}</p>
          <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>{subtitle}</p>
          <div className="w-full h-1.5 rounded-full overflow-hidden mt-1" style={{ background: '#F0EDE5' }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, background: color }}
            />
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>{value}</p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: typeof Trophy; message: string }) {
  return (
    <div className="text-center py-12">
      <Icon size={40} className="mx-auto mb-3" style={{ color: 'var(--border-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>{message}</p>
    </div>
  )
}
