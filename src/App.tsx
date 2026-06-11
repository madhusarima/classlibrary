import { Routes, Route, Navigate } from 'react-router'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Layout from './components/custom/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Books from './pages/Books'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import IssueBook from './pages/IssueBook'
import ReturnBook from './pages/ReturnBook'

function AppRoutes() {
  const { user } = useAuth()

  if (!user) {
    return <Login />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/books" element={<Books />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/issue" element={<IssueBook />} />
        <Route path="/return" element={<ReturnBook />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#FFF8E7',
            border: '1px solid #E8E0D5',
            color: '#2C1810',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <AppRoutes />
    </AuthProvider>
  )
}
