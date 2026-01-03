// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import {
  getPendingArtisans,
  verifyArtisan,
  getPendingProducts,
  approveProduct,
  getAnalytics,
  createCategory
} from '../api/axios'
import { Users, Package, DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics')
  const [analytics, setAnalytics] = useState(null)
  const [pendingArtisans, setPendingArtisans] = useState([])
  const [pendingProducts, setPendingProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryModal, setCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: ''
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'analytics') {
        const response = await getAnalytics()
        setAnalytics(response.data)
      } else if (activeTab === 'artisans') {
        const response = await getPendingArtisans()
        setPendingArtisans(response.data)
      } else if (activeTab === 'products') {
        const response = await getPendingProducts()
        setPendingProducts(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyArtisan = async (id) => {
    try {
      await verifyArtisan(id)
      alert('Artisan verified successfully!')
      fetchData()
    } catch (error) {
      alert('Failed to verify artisan')
    }
  }

  const handleApproveProduct = async (id) => {
    try {
      await approveProduct(id)
      alert('Product approved successfully!')
      fetchData()
    } catch (error) {
      alert('Failed to approve product')
    }
  }

  const handleCreateCategory = async () => {
    try {
      await createCategory(newCategory)
      alert('Category created successfully!')
      setCategoryModal(false)
      setNewCategory({ name: '', slug: '', description: '', image_url: '' })
    } catch (error) {
      alert('Failed to create category')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-gray-200">
        {['analytics', 'artisans', 'products', 'categories'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition ${
              activeTab === tab
                ? 'text-[#ff5000] border-b-2 border-[#ff5000]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff5000]"></div>
        </div>
      ) : (
        <>
          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Users size={32} />
                    <span className="text-4xl font-bold">{analytics.total_artisans}</span>
                  </div>
                  <p className="text-blue-100">Total Artisans</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Package size={32} />
                    <span className="text-4xl font-bold">{analytics.total_products}</span>
                  </div>
                  <p className="text-purple-100">Total Products</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp size={32} />
                    <span className="text-4xl font-bold">{analytics.total_orders}</span>
                  </div>
                  <p className="text-green-100">Total Orders</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign size={32} />
                    <span className="text-4xl font-bold">₹{analytics.total_revenue.toFixed(0)}</span>
                  </div>
                  <p className="text-orange-100">Total Revenue</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Pending Actions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <span className="text-gray-700">Artisan Verifications</span>
                      <span className="text-2xl font-bold text-yellow-600">
                        {analytics.pending_artisans}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Product Approvals</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {analytics.pending_products}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Artisans Tab */}
          {activeTab === 'artisans' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Artisan Verifications</h2>

              {pendingArtisans.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No pending verifications</p>
              ) : (
                <div className="space-y-4">
                  {pendingArtisans.map((artisan) => (
                    <div key={artisan.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {artisan.business_name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {artisan.craft_type} • {artisan.region}
                          </p>
                        </div>
                        <button
                          onClick={() => handleVerifyArtisan(artisan.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center space-x-2"
                        >
                          <CheckCircle size={18} />
                          <span>Verify</span>
                        </button>
                      </div>

                      <p className="text-gray-700 mb-3">{artisan.bio}</p>

                      {artisan.verification_docs && (
                        <a
                          href={artisan.verification_docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Verification Documents →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Product Approvals</h2>

              {pendingProducts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No pending approvals</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingProducts.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">by {product.artisan_name}</p>
                      <p className="text-xl font-bold text-[#ff5000] mb-4">₹{product.price}</p>

                      <button
                        onClick={() => handleApproveProduct(product.id)}
                        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center space-x-2"
                      >
                        <CheckCircle size={18} />
                        <span>Approve</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Categories</h2>
                <button
                  onClick={() => setCategoryModal(true)}
                  className="bg-[#ff5000] text-white px-6 py-2 rounded-lg hover:bg-[#e64800] transition"
                >
                  Add Category
                </button>
              </div>

              <p className="text-gray-600">Category management interface coming soon...</p>
            </div>
          )}
        </>
      )}

      {/* Category Modal */}
      {categoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add New Category</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Slug</label>
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Image URL</label>
                <input
                  type="text"
                  value={newCategory.image_url}
                  onChange={(e) => setNewCategory({ ...newCategory, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setCategoryModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                className="flex-1 bg-[#ff5000] text-white py-3 rounded-lg font-semibold hover:bg-[#e64800] transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}