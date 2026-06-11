import { Outlet, useLocation } from 'react-router'
import BottomNav from './BottomNav'
import { AnimatePresence, motion } from 'framer-motion'

export default function Layout() {
  const location = useLocation()
  const hideNavPaths = ['/issue', '/return']
  const showNav = !hideNavPaths.includes(location.pathname)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper-bg)' }}>
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
