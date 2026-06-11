import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  X,
  BookOpen,
  User,
  Clock,
  TrendingUp,
  Trash2,
  Phone,
  Bookmark,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import CsvUpload from '@/components/custom/CsvUpload'
import { format } from 'date-fns'

export default function Books() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedBook, setSelectedBook] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showCsvUpload, setShowCsvUpload] = useState(false)
  const [csvData, setCsvData] = useState<Record<string, string>[]>([])

  const booksQuery = trpc.book.available.useQuery()
  const categoriesQuery = trpc.book.categories.useQuery()
  const utils = trpc.useUtils()

  const deleteMutation = trpc.book.delete.useMutation({
    onSuccess: () => {
      utils.book.available.invalidate()
      utils.book.categories.invalidate()
      toast.success('Book deleted')
      setSelectedBook(null)
    },
  })

  const books = booksQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const allCategories = ['All', ...categories]

  const filteredBooks = books.filter((book) => {
    const matchesSearch = !searchQuery ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.bookCode && book.bookCode.includes(searchQuery))
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const selectedBookData = selectedBook ? books.find((b) => b.id === selectedBook) : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 
          className="text-2xl font-bold"
          style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}
        >
          Library
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
            <Plus size={16} className="mr-1" /> Add Book
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-secondary)' }} />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search books by title, author..."
          className="pl-9 pr-9 rounded-full border"
          style={{ borderColor: 'var(--border-muted)', background: 'white' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} style={{ color: 'var(--ink-secondary)' }} />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              background: selectedCategory === cat ? 'var(--accent-warm)' : 'white',
              color: selectedCategory === cat ? 'white' : 'var(--ink-secondary)',
              border: `1px solid ${selectedCategory === cat ? 'var(--accent-warm)' : 'var(--border-muted)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Book Cards Grid */}
      <div className="grid grid-cols-1 gap-2.5">
        <AnimatePresence>
          {filteredBooks.map((book, index) => {
            const available = book.availableCopies ?? 0
            const total = book.copies
            const statusColor = available === 0 ? '#DC2626' : available <= 1 ? '#F59E0B' : '#16A34A'
            const statusLabel = available === 0 ? 'All Out' : `${available} of ${total} available`

            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ delay: index * 0.02 }}
              >
                <button
                  onClick={() => setSelectedBook(book.id)}
                  className="w-full text-left p-3.5 rounded-lg border bg-white transition-shadow hover:shadow-sm"
                  style={{ borderColor: 'var(--border-muted)' }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-14 rounded flex-shrink-0 flex items-center justify-center"
                      style={{ background: stringToBookColor(book.title) + '15' }}
                    >
                      <BookOpen size={18} style={{ color: stringToBookColor(book.title) }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                        {book.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
                        {book.author}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span 
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: categoryColor(book.category), color: 'white' }}
                        >
                          {book.category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: statusColor }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={40} className="mx-auto mb-3" style={{ color: 'var(--border-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              {searchQuery ? 'No books match your search' : 'No books in this category'}
            </p>
          </div>
        )}
      </div>

      {/* Book Detail Sheet */}
      <Sheet open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto" style={{ background: 'var(--paper-bg)' }}>
          {selectedBookData && (
            <BookDetail 
              book={selectedBookData} 
              onDelete={() => {
                if (confirm('Delete this book from the library?')) {
                  deleteMutation.mutate({ id: selectedBookData.id })
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Add Book Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md" style={{ background: 'var(--paper-bg)' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Add New Book</DialogTitle>
          </DialogHeader>
          <AddBookForm onClose={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={showCsvUpload} onOpenChange={setShowCsvUpload}>
        <DialogContent className="sm:max-w-md" style={{ background: 'var(--paper-bg)' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Bulk Import Books</DialogTitle>
          </DialogHeader>
          <CsvUpload
            entityName="books"
            sampleHeaders={['title', 'author', 'category', 'language', 'copies', 'bookCode']}
            sampleRow={['Panchatantra', 'Vishnu Sharma', 'Folktales', 'Hindi', '3', 'BK001']}
            onDataParsed={(data) => setCsvData(data)}
          />
          {csvData.length > 0 && (
            <div className="mt-3">
              <CsvImportBookPreview 
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

function BookDetail({ book, onDelete }: { book: { id: number; title: string; author: string; category: string; language: string; copies: number; availableCopies?: number; bookCode: string | null }; onDelete: () => void }) {
  const byBookQuery = trpc.report.byBook.useQuery({ bookId: book.id })
  const readers = byBookQuery.data ?? []
  const timesIssued = readers.length
  const currentlyHeld = readers.filter(r => r.status === 'issued')

  return (
    <div className="h-full flex flex-col">
      <SheetHeader className="p-4 border-b" style={{ borderColor: 'var(--border-muted)' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div 
              className="w-12 h-16 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: stringToBookColor(book.title) + '15' }}
            >
              <BookOpen size={22} style={{ color: stringToBookColor(book.title) }} />
            </div>
            <div>
              <SheetTitle className="text-left" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--ink-primary)' }}>
                {book.title}
              </SheetTitle>
              <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>{book.author}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 size={14} style={{ color: '#DC2626' }} />
          </Button>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Book Info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <InfoCard label="Category" value={book.category} icon={Bookmark} />
          <InfoCard label="Language" value={book.language} icon={BookOpen} />
          <InfoCard label="Total Copies" value={String(book.copies)} icon={BookOpen} />
          <InfoCard label="Available" value={String(book.availableCopies ?? book.copies)} icon={BookOpen} />
        </div>

        {/* Popularity Bar */}
        <div className="mb-4 p-3 rounded-lg bg-white border" style={{ borderColor: 'var(--border-muted)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
              <TrendingUp size={12} className="inline mr-1" />
              Times Issued: {timesIssued}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#F0EDE5' }}>
            <motion.div 
              className="h-full rounded-full"
              style={{ background: 'var(--accent-warm)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (timesIssued / 20) * 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Current Holders */}
        {currentlyHeld.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink-primary)' }}>
              Currently With
            </h3>
            <div className="space-y-1.5">
              {currentlyHeld.map((r) => (
                <div 
                  key={r.transactionId}
                  className="p-2.5 rounded-lg bg-white border flex items-center gap-2"
                  style={{ borderColor: 'var(--border-muted)' }}
                >
                  <User size={14} style={{ color: 'var(--accent-warm)' }} />
                  <span className="text-sm" style={{ color: 'var(--ink-primary)' }}>{r.studentName}</span>
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--ink-secondary)' }}>
                    {r.studentClass}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Readers */}
        <div>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink-primary)' }}>
            Reading History
          </h3>
          <div className="space-y-1.5">
            {readers.slice(0, 10).map((r) => (
              <div 
                key={r.transactionId}
                className="p-2.5 rounded-lg bg-white border flex items-center justify-between"
                style={{ borderColor: 'var(--border-muted)' }}
              >
                <span className="text-sm" style={{ color: 'var(--ink-primary)' }}>{r.studentName}</span>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ 
                      background: r.status === 'returned' ? '#DCFCE7' : '#FEF3C7',
                      color: r.status === 'returned' ? '#166534' : '#92400E'
                    }}
                  >
                    {r.status}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>
                    {format(new Date(r.issueDate), 'MMM d')}
                  </span>
                </div>
              </div>
            ))}
            {readers.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--ink-secondary)' }}>
                No one has read this book yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BookOpen }) {
  return (
    <div className="p-2.5 rounded-lg bg-white border" style={{ borderColor: 'var(--border-muted)' }}>
      <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--ink-secondary)' }}>
        <Icon size={10} /> {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>{value}</p>
    </div>
  )
}

function AddBookForm({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.book.create.useMutation({
    onSuccess: () => {
      utils.book.available.invalidate()
      utils.book.categories.invalidate()
      toast.success('Book added successfully')
      onClose()
    },
  })

  const [form, setForm] = useState({
    title: '',
    author: '',
    category: 'Fiction',
    language: 'English',
    copies: 1,
    bookCode: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.author) return
    createMutation.mutate({
      title: form.title,
      author: form.author,
      category: form.category,
      language: form.language,
      copies: form.copies,
      bookCode: form.bookCode || undefined,
    })
  }

  const categories = ['Fiction', 'Adventure', 'Fantasy', 'Classic', 'Folktales', 'Biography', 'History', 'Mythology', 'Philosophy']

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-2">
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Title *</label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Book title" required className="rounded-lg" style={{ borderColor: 'var(--border-muted)' }} />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Author *</label>
        <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" required className="rounded-lg" style={{ borderColor: 'var(--border-muted)' }} />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Category</label>
        <select 
          value={form.category} 
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border text-sm bg-white"
          style={{ borderColor: 'var(--border-muted)' }}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Copies</label>
          <Input type="number" min={1} value={form.copies} onChange={(e) => setForm({ ...form, copies: parseInt(e.target.value) || 1 })} className="rounded-lg" style={{ borderColor: 'var(--border-muted)' }} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--ink-secondary)' }}>Book Code</label>
          <Input value={form.bookCode} onChange={(e) => setForm({ ...form, bookCode: e.target.value })} placeholder="Optional" className="rounded-lg" style={{ borderColor: 'var(--border-muted)' }} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1 rounded-lg" style={{ background: 'var(--accent-warm)' }} disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add Book'}
        </Button>
      </div>
    </form>
  )
}

function CsvImportBookPreview({ data, onClose }: { data: Record<string, string>[]; onClose: () => void }) {
  const utils = trpc.useUtils()
  const createMutation = trpc.book.create.useMutation({
    onSuccess: () => {
      utils.book.available.invalidate()
      utils.book.categories.invalidate()
    },
  })

  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)

  const handleImport = async () => {
    setImporting(true)
    let count = 0
    for (const row of data) {
      const title = row.title || row.Title || row.TITLE || ''
      const author = row.author || row.Author || row.AUTHOR || ''
      const category = row.category || row.Category || row.CATEGORY || 'Fiction'
      const language = row.language || row.Language || row.LANGUAGE || 'English'
      const copies = parseInt(row.copies || row.Copies || row.COPIES || '1', 10) || 1
      const bookCode = row.bookCode || row.bookcode || row.BookCode || row.code || row.Code || ''

      if (title && author) {
        try {
          await createMutation.mutateAsync({
            title: title.trim(),
            author: author.trim(),
            category: category.trim() || 'Fiction',
            language: language.trim() || 'English',
            copies,
            bookCode: bookCode.trim() || undefined,
          })
          count++
          setImported(count)
        } catch {
          // skip failed rows
        }
      }
    }
    setImporting(false)
    toast.success(`Imported ${count} books`)
    onClose()
  }

  const validRows = data.filter(r => {
    const title = r.title || r.Title || r.TITLE || ''
    const author = r.author || r.Author || r.AUTHOR || ''
    return title.trim() && author.trim()
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
          {importing ? `Importing ${imported}...` : `Import ${validRows.length} Books`}
        </Button>
      </div>
    </div>
  )
}

function categoryColor(cat: string): string {
  const colors: Record<string, string> = {
    'Fiction': '#5E81AC',
    'Adventure': '#E07A5F',
    'Fantasy': '#9B7EBD',
    'Classic': '#8B7355',
    'Folktales': '#81B29A',
    'Biography': '#D4A373',
    'History': '#6B8E8A',
    'Mythology': '#C97B5B',
    'Philosophy': '#7C6F8B',
  }
  return colors[cat] || '#8B7355'
}

function stringToBookColor(str: string): string {
  const colors = ['#E07A5F', '#81B29A', '#5E81AC', '#8B7355', '#D4A373', '#6B8E8A', '#9B7EBD', '#C97B5B']
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
