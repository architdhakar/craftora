// frontend/src/pages/ArtisanDashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getArtisanOrders, updateOrderStatus, addProgressUpdate, getProducts } from '../api/axios'
import { Package, Plus, Clock, CheckCircle, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react'

export default function ArtisanDashboard() {
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [progressModal, setProgressModal] = useState(false)
  const [progressData, setProgressData] = useState({
    stage: '',
    description: '',
    image_url: ''
  })

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await getArtisanOrders()
      setOrders(response.data)
    } catch (error) {
      console.error('Failed to fetch orders', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      // Fetch artisan's products - you may need to add a specific endpoint
      const response = await getProducts()
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to fetch products', error)
    }
  }

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      fetchOrders()
      alert('Order status updated!')
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const handleAddProgress = async () => {
    try {
      await addProgressUpdate(selectedOrder, progressData)
      setProgressModal(false)
      setProgressData({ stage: '', description: '', image_url: '' })
      alert('Progress update added!')
    } catch (error) {
      alert('Failed to add progress')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      crafting: 'bg-purple-100 text-purple-800',
      shipping: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff5000]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Artisan Dashboard</h1>
        <Link
          to="/artisan/add-product"
          className="bg-[#ff5000] text-white px-6 py-3 rounded-lg hover:bg-[#e64800] transition flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package size={24} />
            <span className="text-3xl font-bold">{orders.length}</span>
          </div>
          <p className="text-blue-100">Total Orders</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={24} />
            <span className="text-3xl font-bold">
              {orders.filter(o => o.status === 'delivered').length}
            </span>
          </div>
          <p className="text-green-100">Completed</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag size={24} />
            <span className="text-3xl font-bold">{products.length}</span>
          </div>
          <p className="text-purple-100">Products Listed</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} />
            <span className="text-3xl font-bold">
              ₹{orders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(0)}
            </span>
          </div>
          <p className="text-orange-100">Total Earnings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'orders'
              ? 'text-[#ff5000] border-b-2 border-[#ff5000]'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'products'
              ? 'text-[#ff5000] border-b-2 border-[#ff5000]'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          My Products
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff5000]"></div>
        </div>
      ) : (
        <>
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Orders</h2>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{order.product_name}</h3>
                          <p className="text-gray-600 text-sm">
                            Buyer: {order.buyer_name} • Qty: {order.quantity} • ₹{order.total_amount}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
                          <span className="font-medium capitalize">{order.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="crafting">Crafting</option>
                          <option value="shipping">Shipping</option>
                          <option value="delivered">Delivered</option>
                        </select>

                        <button
                          onClick={() => {
                            setSelectedOrder(order.id)
                            setProgressModal(true)
                          }}
                          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                          Add Progress Update
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                        <p><strong>Shipping:</strong> {order.shipping_address}</p>
                        <p className="mt-1">
                          <strong>Ordered:</strong> {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Products</h2>
                <Link
                  to="/artisan/add-product"
                  className="bg-[#ff5000] text-white px-4 py-2 rounded-lg hover:bg-[#e64800] transition"
                >
                  Add New Product
                </Link>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No products listed yet</p>
                  <Link
                    to="/artisan/add-product"
                    className="inline-block bg-[#ff5000] text-white px-6 py-3 rounded-lg hover:bg-[#e64800] transition"
                  >
                    Add Your First Product
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => {
                    const imageUrls = product.image_urls
                    
                    const mainImage = imageUrls || 'https://via.placeholder.com/300x300?text=No+Image'
                    
                    return (
                      <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl font-bold text-[#ff5000]">₹{product.price}</span>
                            <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={`px-3 py-1 rounded-full ${
                              product.is_approved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {product.is_approved ? 'Approved' : 'Pending Approval'}
                            </span>
                            {product.rating > 0 && (
                              <span className="text-gray-600">⭐ {product.rating.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Progress Modal */}
      {progressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Progress Update</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Stage</label>
                <input
                  type="text"
                  placeholder="e.g., Clay Molding, Glazing"
                  value={progressData.stage}
                  onChange={(e) => setProgressData({ ...progressData, stage: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  value={progressData.description}
                  onChange={(e) => setProgressData({ ...progressData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={progressData.image_url}
                  onChange={(e) => setProgressData({ ...progressData, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5000]"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setProgressModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProgress}
                className="flex-1 bg-[#ff5000] text-white py-3 rounded-lg font-semibold hover:bg-[#e64800] transition"
              >
                Add Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}