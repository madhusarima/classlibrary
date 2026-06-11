import { useState } from 'react'
import { useNavigate } from 'react-router'
import { trpc } from '@/providers/trpc'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  X,
  User,
  BookOpen,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Step = 'student' | 'book' | 'confirm'

export default function IssueBook() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('student')
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [selectedBook, setSelectedBook] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [success, setSuccess] = useState(false)

  const studentsQuery = trpc.student.list.useQuery()
  const booksQuery = trpc.book.available.useQuery()
  const utils = trpc.useUtils()

  const issueMutation = trpc.transaction.issue.useMutation({
    onSuccess: () => {
      utils.transaction.stats.invalidate()
      utils.transaction.recent.invalidate()
      utils.book.available.invalidate()
      setSuccess(true)
      toast.success('Book issued successfully!')
      setTimeout(() => navigate('/'), 1500)
    },
  })

  const students = studentsQuery.data ?? []
  const books = booksQuery.data ?? []

  const filteredStudents = searchQuery
    ? students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : students

  // Books that have available copies
  const availableBooks = books.filter(b => (b.availableCopies ?? 0) > 0)
  const filteredBooks = searchQuery && step === 'book'
    ? availableBooks.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : availableBooks

  const studentData = selectedStudent ? students.find(s => s.id === selectedStudent) : null
  const bookData = selectedBook ? books.find(b => b.id === selectedBook) : null

  const handleIssue = () => {
    if (!selectedStudent || !selectedBook) return
    issueMutation.mutate({ studentId: selectedStudent, bookId: selectedBook })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--paper-bg)' }}>
        <motion.div 
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
          >
            <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: 'var(--accent-green)' }} />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}>
            Book Issued!
          </h2>
          <p className="text-sm mb-1" style={{ color: 'var(--ink-secondary)' }}>
            {bookData?.title} → {studentData?.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
            Redirecting to home...
          </p>
        </motion.div>
      </div>
    )
  }

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
            Issue Book
          </h1>
          <div className="flex gap-1 mt-1">
            {(['student', 'book', 'confirm'] as Step[]).map((s, i) => (
              <div 
                key={s}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{
                  background: ['student', 'book', 'confirm'].indexOf(step) >= i 
                    ? 'var(--accent-warm)' 
                    : 'var(--border-muted)'
                }}
              />
            ))}
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
              Step 1: Select a Student
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
                    setStep('book')
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

        {/* Step 2: Select Book */}
        {step === 'book' && (
          <motion.div 
            key="book"
            className="flex-1 flex flex-col px-4 pt-2 pb-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium" style={{ color: 'var(--ink-secondary)' }}>
                Step 2: Select a Book
              </h2>
              <button 
                onClick={() => { setStep('student'); setSelectedStudent(null) }}
                className="text-xs flex items-center gap-1"
                style={{ color: 'var(--accent-warm)' }}
              >
                <User size={12} /> {studentData?.name}
              </button>
            </div>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-secondary)' }} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search book title..."
                className="pl-9 rounded-full border"
                style={{ borderColor: 'var(--border-muted)', background: 'white' }}
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {filteredBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => {
                    setSelectedBook(book.id)
                    setSearchQuery('')
                    setStep('confirm')
                  }}
                  className="w-full text-left p-3 rounded-lg border bg-white transition-all hover:shadow-sm"
                  style={{ borderColor: 'var(--border-muted)' }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-12 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: stringToBookColor(book.title) + '15' }}
                    >
                      <BookOpen size={16} style={{ color: stringToBookColor(book.title) }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>{book.title}</p>
                      <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>{book.author}</p>
                    </div>
                    <span 
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: '#DCFCE7', color: '#166534' }}
                    >
                      {book.availableCopies} left
                    </span>
                  </div>
                </button>
              ))}
              {filteredBooks.length === 0 && (
                <p className="text-center text-sm py-8" style={{ color: 'var(--ink-secondary)' }}>
                  No available books matching your search
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <motion.div 
            key="confirm"
            className="flex-1 flex flex-col px-4 pt-4 pb-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--ink-secondary)' }}>
              Step 3: Confirm Issue
            </h2>

            <div className="library-card mb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                    style={{ background: stringToColor(studentData?.name ?? '') }}
                  >
                    {studentData?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>{studentData?.name}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>{studentData?.class}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-warm)' }}>
                    <ArrowLeft size={14} className="text-white rotate-180" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-14 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: stringToBookColor(bookData?.title ?? '') + '15' }}
                  >
                    <BookOpen size={20} style={{ color: stringToBookColor(bookData?.title ?? '') }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>{bookData?.title}</p>
                    <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>{bookData?.author}</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center mb-6" style={{ color: 'var(--ink-secondary)' }}>
              Issue date will be recorded automatically as today.
            </p>

            <div className="mt-auto space-y-2">
              <Button
                onClick={handleIssue}
                className="w-full h-14 text-base font-semibold rounded-xl"
                style={{ background: 'var(--accent-warm)' }}
                disabled={issueMutation.isPending}
              >
                {issueMutation.isPending ? 'Issuing...' : 'Confirm Issue'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setStep('book'); setSelectedBook(null) }}
                className="w-full rounded-xl"
              >
                Change Book
              </Button>
            </div>
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
