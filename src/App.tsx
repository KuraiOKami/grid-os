import { Routes, Route, Navigate } from 'react-router-dom'
import BootScreen from '@/pages/BootScreen'
import OSShell from '@/pages/OSShell'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/boot" replace />} />
      <Route path="/boot" element={<BootScreen />} />
      <Route path="/os" element={<OSShell />} />
    </Routes>
  )
}
