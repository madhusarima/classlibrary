import { useState } from 'react'
import { useNavigate } from 'react-router'
import { trpc } from '@/providers/trpc'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  X,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Clock,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { differenceInDays, format } from 'date-fns'

type Step = 'student' | 'return'

export default function ReturnBook() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('student')
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [returnedBooks, setReturnedBooks] = useState<Set<number>>(new Set())

  const studentsQuery = trpc.student.list.useQuery()
  const utils = trpc.useUtils()

  const returnMutation = trpc.transaction.return.useMutation({
    onSuccess: (_, vars) => {
      utils.transaction.stats.invalidate()
      utils.transaction.recent.invalidate()
      utils.book.available.invalidate()
      utils.student.currentHoldings.invalidate()
      setReturnedBooks(prev => new Set(prev).add(vars.transactionId))
      toast.success('Book returned!')
    },
  })

  const students = studentsQuery.data ?? []
  const holdingsQuery = trpc.student.currentHoldings.useQuery(
    { id: selectedStudent! },
    { enabled: !!selectedStudent }
  )
  const holdings = holdingsQuery.data ?? []

  const filteredStudents = searchQuery
    ? students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : students

  const studentData = selectedStudent ? students.find(s => s.id === selectedStudent) : null
  const activeHoldings = holdings.filter(h => !returnedBooks.has(h.transactionId))

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper-bg)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center gap-2">
        <Button 
          variant="ghost" 
          className="h-10 px-3 rounded-full flex items-center gap-1 text-sm font-medium" 
          onClick={() => navigate('/')}
          style={{ color: 'var(--ink-primary)' }}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </Button>
        <div className="flex-1">
          <h1 
            className="text-xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
          >
            Return Book
          </h1>
          <div className="flex gap-1 mt-1">
            <div 
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: step === 'student' ? 'var(--accent-green)' : 'var(--accent-green)' }}
            />
            <div 
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: step === 'return' ? 'var(--accent-green)' : 'var(--border-muted)' }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Student */}
        {step === 'student' && (
          <motion.div 
            key="student"
            className="flex-1 flex flex-col px-4 pt-2 pb-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--ink-secondary)' }}>
              Who is returning a book?
            </h2>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-secondary)' }} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student name..."
                className="pl-9 pr-9 rounded-full border"
                style={{ borderColor: 'var(--border-muted)', background: 'white' }}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} style={{ color: 'var(--ink-secondary)' }} />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student.id)
                    setSearchQuery('')
                    setStep('return')
                  }}
                  className="w-full text-left p-3 rounded-lg border bg-white transition-all hover:shadow-sm"
                  style={{ borderColor: 'var(--border-muted)' }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: stringToColor(student.name) }}
                    >
                      {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>{student.name}</p>
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--ink-secondary)' }}>
                        <GraduationCap size={10} /> {student.class}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Return Books */}
        {step === 'return' && (
          <motion.div 
            key="return"
            className="flex-1 flex flex-col px-4 pt-2 pb-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Books currently held by
                </h2>
                <p className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {studentData?.name}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={() => { setStep('student'); setSelectedStudent(null); setReturnedBooks(new Set()) }}
              >
                Change
              </Button>
            </div>

            {activeHoldings.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: 'var(--accent-green)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    All books returned!
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ink-secondary)' }}>
                    {studentData?.name} has no more books
                  </p>
                  <Button
                    onClick={() => navigate('/')}
                    className="mt-4 rounded-full px-6"
                    style={{ background: 'var(--accent-green)' }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                <AnimatePresence>
                  {activeHoldings.map((holding) => {
                    const daysHeld = differenceInDays(new Date(), new Date(holding.issueDate))
                    const isOverdue = daysHeld > 15
                    return (
                      <motion.div
                        key={holding.transactionId}
                        layout
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="p-3 rounded-lg border bg-white"
                        style={{ borderColor: isOverdue ? '#FECACA' : 'var(--border-muted)' }}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-12 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: stringToBookColor(holding.bookTitle) + '15' }}
                          >
                            <BookOpen size={16} style={{ color: stringToBookColor(holding.bookTitle) }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                              {holding.bookTitle}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>{holding.bookAuthor}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--ink-secondary)' }}>
                                <Clock size={10} />
                                {format(new Date(holding.issueDate), 'MMM d')}
                              </span>
                              <span 
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                style={{ 
                                  background: isOverdue ? '#FEE2E2' : '#FEF3C7',
                                  color: isOverdue ? '#DC2626' : '#92400E'
                                }}
                              >
                                {daysHeld} days
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => returnMutation.mutate({ transactionId: holding.transactionId })}
                            size="sm"
                            className="rounded-full flex-shrink-0"
                            style={{ background: 'var(--accent-green)' }}
                            disabled={returnMutation.isPending}
                          >
                            Return
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function stringToColor(str: string): string {
  const colors = ['#E07A5F', '#81B29A', '#5E81AC', '#8B7355', '#D4A373', '#6B8E8A', '#9B7EBD', '#C97B5B']
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function stringToBookColor(str: string): string {
  const colors = ['#E07A5F', '#81B29A', '#5E81AC', '#8B7355', '#D4A373', '#6B8E8A', '#9B7EBD', '#C97B5B']
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
