// ==================== 1. FIX: Auth Race Condition ====================
// frontend/src/App.jsx - FIXED VERSION

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AuthPage from './pages/AuthPage'
import ProductDetail from './pages/ProductDetail'
import Orders from './pages/Orders'
import OrderTracking from './pages/OrderTracking'
import ArtisanDashboard from './pages/ArtisanDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ArtisanOnboarding from './pages/ArtisanOnboarding'
import AddProduct from './pages/AddProduct'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Add loading state

  useEffect(() => {
    // Load user from localStorage on mount
    const loadUser = () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        if (token && userData) {
          setUser(JSON.parse(userData))
        }
      } catch (e) {
        console.error('Failed to parse user data:', e)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setLoading(false) // Mark loading as complete
      }
    }
    
    loadUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff5000]"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/auth" element={<AuthPage setUser={setUser} />} />
          <Route path="/product/:id" element={<ProductDetail user={user} />} />
          <Route path="/orders" element={user ? <Orders /> : <Navigate to="/auth" />} />
          <Route path="/orders/:id" element={user ? <OrderTracking /> : <Navigate to="/auth" />} />
          <Route path="/artisan/onboard" element={user ? <ArtisanOnboarding setUser={setUser} /> : <Navigate to="/auth" />} />
          <Route path="/artisan/dashboard" element={user?.role === 'artisan' ? <ArtisanDashboard /> : <Navigate to="/" />} />
          <Route path="/artisan/add-product" element={user?.role === 'artisan' ? <AddProduct /> : <Navigate to="/" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App