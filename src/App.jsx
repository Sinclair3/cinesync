import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ROUTES } from './utils/constants'
import Home from './pages/Home'
import Auth from './pages/Auth'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME}      element={<Home />} />
          <Route path={ROUTES.AUTH}      element={<Auth />} />
          {/* Future routes added here */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
