// frontend/src/pages/Orders.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserOrders } from '../api/axios'
import { Package, Clock, CheckCircle, Truck } from 'lucide-react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await getUserOrders()
      setOrders(response.data)
    } catch (error) {
      console.error('Failed to fetch orders', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      crafting: 'bg-purple-100 text-purple-800',
      shipping: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={20} />,
      confirmed: <CheckCircle size={20} />,
      crafting: <Package size={20} />,
      shipping: <Truck size={20} />,
      delivered: <CheckCircle size={20} />,
    }
    return icons[status] || <Package size={20} />
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff5000]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-4">No orders yet</p>
          <Link
            to="/"
            className="inline-block bg-[#ff5000] text-white px-6 py-3 rounded-lg hover:bg-[#e64800] transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            
            
            const imageUrls = order.product_image 
            
            const mainImage = imageUrls|| 'https://via.placeholder.com/100'

            return (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Order #{order.id}</span>
                      <span className="text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`px-4 py-1 rounded-full flex items-center space-x-2 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="font-medium capitalize">{order.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <img
                      src={mainImage}
                      alt={order.product_name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        {order.product_name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">by {order.artisan_name}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-600">Quantity: </span>
                          <span className="font-medium">{order.quantity}</span>
                        </div>
                        <div className="text-xl font-bold text-[#ff5000]">
                          ₹{order.total_amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.estimated_eta && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm text-gray-600">
                      <Clock size={16} className="mr-2" />
                      <span>
                        Estimated Delivery: {new Date(order.estimated_eta).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}