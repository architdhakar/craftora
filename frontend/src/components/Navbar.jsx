// ===== FILE 1: frontend/src/components/Navbar.jsx =====
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Package, LayoutDashboard } from 'lucide-react'

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-800">Craftora</span>
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {user.role === 'artisan' && (
                  <Link
                    to="/artisan/dashboard"
                    className="flex items-center space-x-1 text-gray-700 hover:text-[#ff5000] transition"
                  >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </Link>
                )}
                
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 text-gray-700 hover:text-[#ff5000] transition"
                  >
                    <LayoutDashboard size={20} />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  to="/orders"
                  className="flex items-center space-x-1 text-gray-700 hover:text-[#ff5000] transition"
                >
                  <Package size={20} />
                  <span>Orders</span>
                </Link>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User size={20} />
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-[#ff5000] text-white px-6 py-2 rounded-lg hover:bg-[#e64800] transition font-medium"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}