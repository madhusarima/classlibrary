import { useRef, useState } from 'react'
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CsvUploadProps {
  onDataParsed: (data: Record<string, string>[]) => void
  sampleHeaders: string[]
  sampleRow: string[]
  entityName: string // "students" or "books"
}

export default function CsvUpload({ onDataParsed, sampleHeaders, sampleRow, entityName }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return

      const lines = text.trim().split('\n')
      if (lines.length < 2) {
        toast.error('CSV file must have a header row and at least one data row')
        return
      }

      // Parse headers
      const headers = parseCsvLine(lines[0])
      
      // Parse data rows
      const data: Record<string, string>[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i])
        if (values.length < headers.length) continue // skip incomplete rows
        
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
          row[h.trim()] = values[idx]?.trim() ?? ''
        })
        
        // Only add if at least the first required field has a value
        if (row[headers[0].trim()]) {
          data.push(row)
        }
      }

      if (data.length === 0) {
        toast.error('No valid data rows found in CSV')
        return
      }

      setPreview(data.slice(0, 5))
      onDataParsed(data)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const downloadSample = () => {
    const headers = sampleHeaders.join(',')
    const row = sampleRow.join(',')
    const csv = `${headers}\n${row}\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sample_${entityName}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
        style={{
          borderColor: isDragging ? 'var(--accent-warm)' : 'var(--border-muted)',
          background: isDragging ? 'rgba(224, 122, 95, 0.05)' : 'white',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />
        <Upload 
          size={24} 
          className="mx-auto mb-2" 
          style={{ color: isDragging ? 'var(--accent-warm)' : 'var(--ink-secondary)' }} 
        />
        <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
          Click or drag CSV file here
        </p>
        <p className="text-[10px] mt-1" style={{ color: 'var(--ink-secondary)' }}>
          Only .csv files supported
        </p>
      </div>

      {/* Sample Download */}
      <button
        onClick={(e) => { e.stopPropagation(); downloadSample() }}
        className="flex items-center gap-1.5 mt-2 text-[11px] font-medium mx-auto"
        style={{ color: 'var(--accent-warm)' }}
      >
        <FileSpreadsheet size={12} />
        Download sample CSV template
      </button>

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="mt-3 p-3 rounded-lg border bg-white" style={{ borderColor: 'var(--border-muted)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--ink-primary)' }}>
              Found {preview.length}+ {entityName}
            </p>
          </div>
          <div className="space-y-1">
            {preview.slice(0, 3).map((row, i) => (
              <p key={i} className="text-[10px] truncate" style={{ color: 'var(--ink-secondary)' }}>
                {Object.values(row).join(' • ')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Simple CSV line parser - handles quoted fields with commas
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
