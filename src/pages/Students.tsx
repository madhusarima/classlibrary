import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  UserPlus,
  X,
  Phone,
  BookOpen,
  Clock,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  FileText,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import CsvUpload from '@/components/custom/CsvUpload'
import { format, differenceInDays } from 'date-fns'

export default function Students() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('All')
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showCsvUpload, setShowCsvUpload] = useState(false)
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])

  const studentsQuery = trpc.student.list.useQuery(
    selectedClass !== 'All' ? { classFilter: selectedClass } : undefined
  )
  const classesQuery = trpc.student.classes.useQuery()
  const utils = trpc.useUtils()

  const deleteMutation = trpc.student.delete.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate()
      utils.student.classes.invalidate()
      toast.success('Student deleted successfully')
      setSelectedStudent(null)
    },
  })

  const students = studentsQuery.data ?? []
  const classes = classesQuery.data ?? []
  const allClasses = ['All', ...classes]

  const filteredStudents = searchQuery
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.rollNumber && s.rollNumber.includes(searchQuery))
      )
    : students

  const selectedStudentData = selectedStudent ? students.find((s) => s.id === selectedStudent) : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 
          className="text-2xl font-bold"
          style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
        >
          Students
        </h1>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            onClick={() => setShowCsvUpload(true)}
            size="sm"
            className="rounded-full px-3"
            style={{ borderColor: 'var(--border-muted)' }}
          >
            <Upload size={14} className="mr-1" /> CSV
          </Button>
          <Button
            onClick={() => setShowAdd(true)}
            size="sm"
            className="rounded-full px-4"
            style={{ background: 'var(--accent-warm)' }}
          >
            <UserPlus size={16} className="mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-secondary)' }} />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or roll number..."
          className="pl-9 pr-9 rounded-full border"
          style={{ borderColor: 'var(--border-muted)', background: 'white' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X size={14} style={{ color: 'var(--ink-secondary)' }} />
          </button>
        )}
      </div>

      {/* Class Filter Pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {allClasses.map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              background: selectedClass === cls ? 'var(--accent-warm)' : 'white',
              color: selectedClass === cls ? 'white' : 'var(--ink-secondary)',
              border: `1px solid ${selectedClass === cls ? 'var(--accent-warm)' : 'var(--border-muted)'}`,
            }}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Student List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ delay: index * 0.02 }}
            >
              <button
                onClick={() => setSelectedStudent(student.id)}
                className="w-full text-left p-3 rounded-lg border bg-white transition-shadow hover:shadow-sm"
                style={{ borderColor: 'var(--border-muted)' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: stringToColor(student.name) }}
                  >
                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                      {student.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                      <GraduationCap size={10} />
                      <span>{student.class}</span>
                      {student.rollNumber && (
                        <>
                          <span>•</span>
                          <span>Roll {student.rollNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--ink-secondary)' }} />
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--border-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              {searchQuery ? 'No students match your search' : 'No students in this class'}
            </p>
          </div>
        )}
      </div>

      {/* Student Detail Sheet */}
      <Sheet open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0 overflow-y-auto"
          style={{ background: 'var(--paper-bg)' }}
        >
          {selectedStudentData && (
            <StudentDetail 
              student={selectedStudentData} 
              onDelete={() => {
                if (confirm('Delete this student and all their records?')) {
                  deleteMutation.mutate({ id: selectedStudentData.id })
                }
              }}
              onClose={() => setSelectedStudent(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Add Student Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md" style={{ background: 'var(--paper-bg)' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Add New Student</DialogTitle>
          </DialogHeader>
          <AddStudentForm onClose={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={showCsvUpload} onOpenChange={setShowCsvUpload}>
        <DialogContent className="sm:max-w-md" style={{ background: 'var(--paper-bg)' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Bulk Import Students</DialogTitle>
          </DialogHeader>
          <CsvUpload
            entityName="students"
            sampleHeaders={['name', 'class', 'rollNumber', 'parentWhatsApp']}
            sampleRow={['Rahul Sharma', 'Class 7', '701', '+919876543210']}
            onDataParsed={(data) => setCsvData(data)}
          />
          {csvData.length > 0 && (
            <div className="mt-3">
              <CsvImportStudentPreview 
                data={csvData} 
                onClose={() => { setShowCsvUpload(false); setCsvData([]) }} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StudentDetail({ student, onDelete, onClose }: { student: { id: number; name: string; class: string; rollNumber: string | null; parentWhatsApp: string | null; studentWhatsApp: string | null; admissionNumber: string | null }; onDelete: () => void; onClose: () => void }) {
  const historyQuery = trpc.student.readingHistory.useQuery({ id: student.id })
  const holdingsQuery = trpc.student.currentHoldings.useQuery({ id: student.id })
  const history = historyQuery.data ?? []
  const holdings = holdingsQuery.data ?? []

  const totalRead = history.filter(h => h.status === 'returned').length
  const currentlyHolding = holdings.length

  const handleShareWhatsApp = () => {
    const currentlyReading = holdings.map((h, i) => `${i + 1}. ${h.bookTitle}`).join('\n')
    const booksLog = history.map((h, i) => `${i + 1}. ${h.bookTitle}${h.status === 'returned' ? ' ✓' : ' (holding)'}`).join('\n')
    
    let text = `*${student.name}*\nClass: ${student.class}\n\n`
    
    if (currentlyReading) {
      text += `*Reading now:*\n${currentlyReading}\n\n`
    }
    
    text += `*Log of books read:*\n${booksLog || 'No books yet'}`
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="h-full flex flex-col">
      <SheetHeader className="p-4 border-b" style={{ borderColor: 'var(--border-muted)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white"
              style={{ background: stringToColor(student.name) }}
            >
              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <SheetTitle style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}>
                {student.name}
              </SheetTitle>
              <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
                {student.class} {student.rollNumber && `• Roll ${student.rollNumber}`}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShareWhatsApp}>
              <Phone size={14} style={{ color: '#25D366' }} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
              <Trash2 size={14} style={{ color: '#DC2626' }} />
            </Button>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-3 rounded-lg bg-white border" style={{ borderColor: 'var(--border-muted)' }}>
            <BookOpen size={16} className="mx-auto mb-1" style={{ color: 'var(--accent-warm)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>{history.length}</p>
            <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>Total Books</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white border" style={{ borderColor: 'var(--border-muted)' }}>
            <Clock size={16} className="mx-auto mb-1" style={{ color: 'var(--accent-green)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>{currentlyHolding}</p>
            <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>Holding</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white border" style={{ borderColor: 'var(--border-muted)' }}>
            <FileText size={16} className="mx-auto mb-1" style={{ color: 'var(--accent-blue)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>{totalRead}</p>
            <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>Returned</p>
          </div>
        </div>

        {/* Currently Holding */}
        {currentlyHolding > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink-primary)' }}>
              Currently Holding
            </h3>
            <div className="space-y-1.5">
              {holdings.map((h) => (
                <div 
                  key={h.transactionId}
                  className="p-2.5 rounded-lg bg-white border flex items-center justify-between"
                  style={{ borderColor: 'var(--border-muted)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>{h.bookTitle}</p>
                    <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>
                      Issued {format(new Date(h.issueDate), 'MMM d')}
                    </p>
                  </div>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: '#FEF3C7', color: '#92400E' }}
                  >
                    {differenceInDays(new Date(), new Date(h.issueDate))}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reading History */}
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink-primary)' }}>
            Reading History
          </h3>
          <div className="space-y-1.5">
            {history.map((h) => (
              <div 
                key={h.transactionId}
                className="p-2.5 rounded-lg bg-white border"
                style={{ borderColor: 'var(--border-muted)' }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>{h.bookTitle}</p>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ 
                      background: h.status === 'returned' ? '#DCFCE7' : '#FEF3C7',
                      color: h.status === 'returned' ? '#166534' : '#92400E'
                    }}
                  >
                    {h.status}
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>
                  {h.bookAuthor} • {format(new Date(h.issueDate), 'MMM d, yyyy')}
                  {h.returnDate && ` → ${format(new Date(h.returnDate), 'MMM d, yyyy')}`}
                </p>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--ink-secondary)' }}>
                No reading history yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddStudentForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.student.create.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate()
      utils.student.classes.invalidate()
      toast.success('Student added successfully')
      onClose()
    },
  })

  const [form, setForm] = useState({
    name: '',
    class: '',
    rollNumber: '',
    parentWhatsApp: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.class) return
    createMutation.mutate({
      name: form.name,
      class: form.class,
      rollNumber: form.rollNumber || undefined,
      parentWhatsApp: form.parentWhatsApp || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-2">
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Full Name *</label>
        <Input 
          value={form.name} 
          onChange={(e) => setForm({ ...form, name: e.target.value })} 
          placeholder="e.g. Rahul Sharma"
          required
          className="rounded-lg"
          style={{ borderColor: 'var(--border-muted)' }}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Class *</label>
        <Input 
          value={form.class} 
          onChange={(e) => setForm({ ...form, class: e.target.value })} 
          placeholder="e.g. Class 7"
          required
          className="rounded-lg"
          style={{ borderColor: 'var(--border-muted)' }}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Roll Number</label>
        <Input 
          value={form.rollNumber} 
          onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} 
          placeholder="Optional"
          className="rounded-lg"
          style={{ borderColor: 'var(--border-muted)' }}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Parent WhatsApp</label>
        <Input 
          value={form.parentWhatsApp} 
          onChange={(e) => setForm({ ...form, parentWhatsApp: e.target.value })} 
          placeholder="+91..."
          className="rounded-lg"
          style={{ borderColor: 'var(--border-muted)' }}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 rounded-lg" 
          style={{ background: 'var(--accent-warm)' }}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Adding...' : 'Add Student'}
        </Button>
      </div>
    </form>
  )
}

function CsvImportStudentPreview({ data, onClose }: { data: Record<string, string>[]; onClose: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.student.create.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate()
      utils.student.classes.invalidate()
    },
  })

  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)

  const handleImport = async () => {
    setImporting(true)
    let count = 0
    for (const row of data) {
      const name = row.name || row.Name || row.NAME || ''
      const cls = row.class || row.Class || row.CLASS || row.className || row.classname || ''
      const roll = row.rollNumber || row.rollnumber || row.RollNumber || row.roll || row.Roll || row['Roll No'] || row['Roll No.'] || ''
      const phone = row.parentWhatsApp || row.parentwhatsapp || row.ParentWhatsApp || row.phone || row.Phone || row.whatsapp || row.WhatsApp || ''
      
      if (name && cls) {
        try {
          await createMutation.mutateAsync({
            name: name.trim(),
            class: cls.trim(),
            rollNumber: roll.trim() || undefined,
            parentWhatsApp: phone.trim() || undefined,
          })
          count++
          setImported(count)
        } catch {
          // skip failed rows
        }
      }
    }
    setImporting(false)
    toast.success(`Imported ${count} students`)
    onClose()
  }

  const validRows = data.filter(r => {
    const name = r.name || r.Name || r.NAME || ''
    const cls = r.class || r.Class || r.CLASS || ''
    return name.trim() && cls.trim()
  })

  return (
    <div className="mt-3">
      <div className="p-2.5 rounded-lg border mb-3" style={{ borderColor: 'var(--border-muted)', background: '#F9F8F4' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--ink-primary)' }}>
          {validRows.length} valid rows found
        </p>
        {importing && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--accent-warm)' }}>
            Importing {imported} of {validRows.length}...
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 rounded-lg" onClick={onClose} disabled={importing}>
          Cancel
        </Button>
        <Button 
          className="flex-1 rounded-lg" 
          style={{ background: 'var(--accent-green)' }}
          onClick={handleImport}
          disabled={importing || validRows.length === 0}
        >
          {importing ? `Importing ${imported}...` : `Import ${validRows.length} Students`}
        </Button>
      </div>
    </div>
  )
}

// Need this icon for the empty state
function Users({ size, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={style}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
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
