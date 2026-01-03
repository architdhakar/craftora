
// frontend/src/pages/OrderTracking.jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getOrderDetails } from '../api/axios'
import { Package, CheckCircle, Clock, Truck } from 'lucide-react'

export default function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetails()
  }, [id])

  const fetchOrderDetails = async () => {
    try {
      const response = await getOrderDetails(id)
      setOrder(response.data)
    } catch (error) {
      console.error('Failed to fetch order details', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#ff5000]"></div>
      </div>
    )
  }

  if (!order) {
    return <div className="text-center py-12">Order not found</div>
  }

  const imageUrls = order.product_image
  const mainImage = imageUrls || 'https://via.placeholder.com/200'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Order Tracking</h1>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-6">
          <img
            src={mainImage}
            alt={order.product_name}
            className="w-32 h-32 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{order.product_name}</h2>
            <p className="text-gray-600 mb-2">by {order.artisan_name}</p>
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-gray-600">Quantity: </span>
                <span className="font-medium">{order.quantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Total: </span>
                <span className="text-xl font-bold text-[#ff5000]">
                  ₹{order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Shipping Address</p>
          <p className="text-gray-800">{order.shipping_address}</p>
        </div>
      </div>

      {/* Crafting Progress Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Crafting Journey</h2>

        {order.progress && order.progress.length > 0 ? (
          <div className="space-y-6">
            {order.progress.map((progress, idx) => (
              <div key={progress.id} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-10 h-10 bg-[#ff5000] rounded-full flex items-center justify-center text-white">
                    <CheckCircle size={20} />
                  </div>
                  {idx < order.progress.length - 1 && (
                    <div className="w-0.5 h-full bg-[#ff5000] mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{progress.stage}</h3>
                    <p className="text-gray-600 text-sm mb-2">{progress.description}</p>
                    {progress.image_url && (
                      <img
                        src={progress.image_url}
                        alt={progress.stage}
                        className="w-full max-w-md rounded-lg mt-3"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(progress.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <Package size={48} className="mx-auto mb-3 text-gray-400" />
            <p>No progress updates yet. Check back soon!</p>
          </div>
        )}

        {order.estimated_eta && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center text-gray-700">
            <Clock size={20} className="mr-2" />
            <span>
              Estimated Delivery: <strong>{new Date(order.estimated_eta).toLocaleDateString()}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}